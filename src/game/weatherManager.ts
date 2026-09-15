import * as THREE from 'three';
import { WeatherType, TimeOfDay } from '../types/car';

export class WeatherManager {
  public weather: WeatherType = 'clear';
  private scene: THREE.Scene;
  private rainPoints: THREE.Points | null = null;
  private rainCount = 2200;
  private rainVelocities: Float32Array = new Float32Array(0);

  // Original world fog reference
  private defaultFog: THREE.FogExp2 | THREE.Fog | null = null;
  private rainAmbientAudioPlaying = false;

  constructor(scene: THREE.Scene, initialWeather: WeatherType = 'clear') {
    this.scene = scene;
    this.weather = initialWeather;
    this.defaultFog = scene.fog;
    this.initRainSystem();
    this.applyWeather(this.weather, 'day');
  }

  private initRainSystem() {
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount);

    const range = 90;
    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * range;
      positions[i * 3 + 1] = Math.random() * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * range;
      this.rainVelocities[i] = 35 + Math.random() * 25; // High speed rain streak drop
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.28,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    this.rainPoints = new THREE.Points(rainGeo, rainMat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);
  }

  public applyWeather(weather: WeatherType, timeOfDay: TimeOfDay) {
    this.weather = weather;

    if (weather === 'rain') {
      if (this.rainPoints) this.rainPoints.visible = true;

      // Moody rain atmospheric fog
      const rainFogColor = timeOfDay === 'night' ? 0x090d16 : timeOfDay === 'sunset' ? 0x472a3b : 0x475569;
      this.scene.fog = new THREE.FogExp2(rainFogColor, 0.008);

    } else if (weather === 'fog') {
      if (this.rainPoints) this.rainPoints.visible = false;

      // Dense Alpine / European Mist
      const fogColor = timeOfDay === 'night' ? 0x0f172a : timeOfDay === 'sunset' ? 0xd97706 : 0x94a3b8;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.016);

    } else if (weather === 'overcast') {
      if (this.rainPoints) this.rainPoints.visible = false;

      // Soft overcast European lighting
      const overcastFogColor = timeOfDay === 'night' ? 0x09090b : 0x64748b;
      this.scene.fog = new THREE.FogExp2(overcastFogColor, 0.0035);

    } else {
      // Clear European sunny / starry skies
      if (this.rainPoints) this.rainPoints.visible = false;
      const clearFog = timeOfDay === 'night' ? 0x050811 : timeOfDay === 'sunset' ? 0x7c2d12 : 0x60a5fa;
      this.scene.fog = new THREE.FogExp2(clearFog, 0.0022);
    }
  }

  public update(dt: number, cameraPos: THREE.Vector3) {
    if (this.weather === 'rain' && this.rainPoints) {
      // Center rain box around camera
      this.rainPoints.position.set(cameraPos.x, 0, cameraPos.z);

      const positions = this.rainPoints.geometry.attributes.position.array as Float32Array;
      const range = 90;

      for (let i = 0; i < this.rainCount; i++) {
        const idxY = i * 3 + 1;
        positions[idxY] -= this.rainVelocities[i] * dt;

        // Reset drop when hitting road level
        if (positions[idxY] < 0) {
          positions[idxY] = 45 + Math.random() * 5;
          positions[i * 3] = (Math.random() - 0.5) * range;
          positions[i * 3 + 2] = (Math.random() - 0.5) * range;
        }
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  /**
   * Tire grip multiplier: wet roads in rain reduce grip for authentic drifting and longer braking distances
   */
  public getTireGripMultiplier(): number {
    if (this.weather === 'rain') return 0.78; // Wet European asphalt
    if (this.weather === 'fog') return 0.92;  // Damp misty asphalt
    return 1.0;
  }
}
