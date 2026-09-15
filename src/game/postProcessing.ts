import * as THREE from 'three';
import { GraphicsQuality } from '../types/car';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Custom Speed Radial Motion Blur, Chromatic Aberration & Vignette Post-Processing Shader
 * Inspired by Unity HDRP / Forza Horizon high-speed post effects
 */
export const SpeedFxShader = {
  name: 'SpeedFxShader',
  uniforms: {
    tDiffuse: { value: null },
    uSpeedRatio: { value: 0.0 }, // 0.0 to 1.0 (based on speed / 200mph)
    uNitrousBoost: { value: 0.0 }, // 0.0 or 1.0 when NOS active
    uDriftIntensity: { value: 0.0 }, // 0.0 to 1.0 when sliding
    uTime: { value: 0.0 },
    uVignetteDarkness: { value: 0.45 },
    uColorGradeWarmth: { value: 0.0 }, // -1.0 (cool night) to +1.0 (sunset)
    uSaturation: { value: 1.12 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uSpeedRatio;
    uniform float uNitrousBoost;
    uniform float uDriftIntensity;
    uniform float uTime;
    uniform float uVignetteDarkness;
    uniform float uColorGradeWarmth;
    uniform float uSaturation;

    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 uv = vUv;
      vec2 dir = uv - center;
      float dist = length(dir);

      // Dynamic Radial Blur amount increases at high speed and nitrous
      float blurStrength = (uSpeedRatio * 0.025) + (uNitrousBoost * 0.035);
      // Mask radial blur so center remains crisp
      float blurMask = smoothstep(0.2, 0.85, dist);
      float finalBlur = blurStrength * blurMask;

      // Multi-tap radial samples with Chromatic Aberration (R/G/B offset)
      vec4 color = vec4(0.0);
      float chromaticOffset = (uSpeedRatio * 0.008) + (uNitrousBoost * 0.012) + (uDriftIntensity * 0.006);
      
      const int SAMPLES = 8;
      float totalWeight = 0.0;
      
      for (int i = 0; i < SAMPLES; i++) {
        float scale = 1.0 - finalBlur * (float(i) / float(SAMPLES - 1));
        vec2 sampleUv = center + dir * scale;

        // Chromatic split on high speed
        float r = texture2D(tDiffuse, sampleUv + dir * (chromaticOffset * float(i) / float(SAMPLES))).r;
        float g = texture2D(tDiffuse, sampleUv).g;
        float b = texture2D(tDiffuse, sampleUv - dir * (chromaticOffset * float(i) / float(SAMPLES))).b;
        float a = texture2D(tDiffuse, sampleUv).a;

        float weight = 1.0 - (float(i) / float(SAMPLES)) * 0.5;
        color += vec4(r, g, b, a) * weight;
        totalWeight += weight;
      }
      color /= totalWeight;

      // High-speed wind streaks / speed lines at edges
      if (uSpeedRatio > 0.4 || uNitrousBoost > 0.1) {
        float angle = atan(dir.y, dir.x);
        float speedLine = sin(angle * 48.0 + uTime * 35.0) * cos(angle * 24.0 - uTime * 20.0);
        float edgeFactor = smoothstep(0.45, 0.95, dist) * (uSpeedRatio * 0.08 + uNitrousBoost * 0.15);
        color.rgb += vec3(0.3, 0.6, 1.0) * max(0.0, speedLine) * edgeFactor;
      }

      // Saturation boost
      float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb = mix(vec3(luminance), color.rgb, uSaturation);

      // Subtle Color Grading (Warm sunset vs Cold cyber night)
      if (uColorGradeWarmth > 0.01) {
        // Warm golden hour
        color.r += uColorGradeWarmth * 0.04;
        color.g += uColorGradeWarmth * 0.015;
        color.b -= uColorGradeWarmth * 0.02;
      } else if (uColorGradeWarmth < -0.01) {
        // Cold moody night
        float c = abs(uColorGradeWarmth);
        color.r -= c * 0.02;
        color.b += c * 0.04;
      }

      // Cinematic Vignette
      float vignette = smoothstep(0.9, 0.35, dist);
      color.rgb *= mix(1.0 - uVignetteDarkness, 1.0, vignette);

      gl_FragColor = color;
    }
  `,
};

export type { GraphicsQuality };

export class GraphicsPipeline {
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  public speedFxPass: ShaderPass;
  public outputPass: OutputPass;
  public quality: GraphicsQuality = 'high';

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number,
    initialQuality: GraphicsQuality = 'high'
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.quality = initialQuality;

    // Create Render Target with HDR half-float support for bloom
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      samples: 4, // 4x MSAA
    });

    this.composer = new EffectComposer(renderer, renderTarget);

    // 1. Base Scene Render Pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 2. Unreal Bloom Pass (HDR Glow for lights, neon underglow, exhaust flames)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.65, // strength
      0.45, // radius
      0.82  // threshold
    );
    this.composer.addPass(this.bloomPass);

    // 3. Custom Speed FX & Cinematic Shader Pass
    this.speedFxPass = new ShaderPass(SpeedFxShader);
    this.composer.addPass(this.speedFxPass);

    // 4. Final Output & Tone Mapping Pass
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    this.applyQuality(this.quality);
  }

  public setSize(width: number, height: number) {
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  public applyQuality(quality: GraphicsQuality) {
    this.quality = quality;
    if (quality === 'performance') {
      // Prioritize 60+ FPS by disabling heavy bloom and multi-tap blur
      this.bloomPass.enabled = false;
      this.speedFxPass.enabled = false;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    } else if (quality === 'high') {
      // Balanced AAA graphics
      this.bloomPass.enabled = true;
      this.bloomPass.strength = 0.55;
      this.bloomPass.radius = 0.4;
      this.bloomPass.threshold = 0.85;
      this.speedFxPass.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    } else if (quality === 'ultra') {
      // Maximum Visual Fidelity (Full HDR Bloom, Intense Shaders, 2x Pixel Ratio)
      this.bloomPass.enabled = true;
      this.bloomPass.strength = 0.85;
      this.bloomPass.radius = 0.6;
      this.bloomPass.threshold = 0.78;
      this.speedFxPass.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    }
  }

  public update(
    speedMph: number,
    nitrousActive: boolean,
    isDrifting: boolean,
    timeOfDay: string,
    delta: number
  ) {
    if (!this.speedFxPass.enabled) return;

    const uniforms = this.speedFxPass.uniforms;
    const speedRatio = Math.min(1.0, Math.max(0.0, speedMph / 210.0));
    uniforms.uSpeedRatio.value = speedRatio;
    uniforms.uNitrousBoost.value = THREE.MathUtils.damp(
      uniforms.uNitrousBoost.value,
      nitrousActive ? 1.0 : 0.0,
      10,
      delta
    );
    uniforms.uDriftIntensity.value = THREE.MathUtils.damp(
      uniforms.uDriftIntensity.value,
      isDrifting ? 1.0 : 0.0,
      8,
      delta
    );
    uniforms.uTime.value += delta;

    if (timeOfDay === 'sunset') {
      uniforms.uColorGradeWarmth.value = 0.8;
      uniforms.uVignetteDarkness.value = 0.4;
    } else if (timeOfDay === 'night') {
      uniforms.uColorGradeWarmth.value = -0.7;
      uniforms.uVignetteDarkness.value = 0.55;
    } else {
      uniforms.uColorGradeWarmth.value = 0.1;
      uniforms.uVignetteDarkness.value = 0.35;
    }
  }

  public applyCustomShaders(settings: {
    bloomEnabled: boolean;
    bloomIntensity: number;
    motionBlurEnabled: boolean;
    motionBlurIntensity: number;
    chromaticAberration: boolean;
    vignetteDarkness: number;
  }) {
    this.bloomPass.enabled = settings.bloomEnabled;
    this.bloomPass.strength = settings.bloomIntensity;

    this.speedFxPass.enabled = settings.motionBlurEnabled || settings.chromaticAberration;
    if (this.speedFxPass.uniforms) {
      if (this.speedFxPass.uniforms.uVignetteDarkness) {
        this.speedFxPass.uniforms.uVignetteDarkness.value = settings.vignetteDarkness;
      }
    }
  }

  public render() {
    if (this.quality === 'performance') {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render();
    }
  }

  public dispose() {
    this.composer.renderTarget1?.dispose();
    this.composer.renderTarget2?.dispose();
  }
}
