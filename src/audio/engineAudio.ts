/**
 * Procedural Web Audio Engine Synthesizer for realistic car engine roar,
 * turbo spool, blow-off flutter, exhaust backfires, and tire squeals.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isMuted = false;

  // Master & volume nodes
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private turboGain: GainNode | null = null;
  private tireGain: GainNode | null = null;

  // Engine Oscillators
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc3: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineWaveshaper: WaveShaperNode | null = null;

  // Turbo nodes
  private turboOsc: OscillatorNode | null = null;
  private turboFilter: BiquadFilterNode | null = null;

  // Tire squeal nodes
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;

  private prevThrottle = 0;
  private lastBackfireTime = 0;

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // --- Engine Synthesizer ---
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      // Distortion waveshaper for realistic engine growl
      this.engineWaveshaper = this.ctx.createWaveShaper();
      this.engineWaveshaper.curve = this.makeDistortionCurve(18);
      this.engineWaveshaper.oversample = '2x';

      // 3 oscillators for complex multi-cylinder engine sound
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(30, this.ctx.currentTime);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(60, this.ctx.currentTime);

      this.osc3 = this.ctx.createOscillator();
      this.osc3.type = 'square';
      this.osc3.frequency.setValueAtTime(45, this.ctx.currentTime);

      const oscGain1 = this.ctx.createGain();
      oscGain1.gain.value = 0.5;
      const oscGain2 = this.ctx.createGain();
      oscGain2.gain.value = 0.35;
      const oscGain3 = this.ctx.createGain();
      oscGain3.gain.value = 0.15;

      this.osc1.connect(oscGain1);
      this.osc2.connect(oscGain2);
      this.osc3.connect(oscGain3);

      oscGain1.connect(this.engineWaveshaper);
      oscGain2.connect(this.engineWaveshaper);
      oscGain3.connect(this.engineWaveshaper);

      this.engineWaveshaper.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();
      this.osc3.start();

      // --- Turbo Whistle ---
      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(1400, this.ctx.currentTime);

      this.turboFilter = this.ctx.createBiquadFilter();
      this.turboFilter.type = 'bandpass';
      this.turboFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
      this.turboFilter.Q.setValueAtTime(5, this.ctx.currentTime);

      this.turboOsc.connect(this.turboFilter);
      this.turboFilter.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);
      this.turboOsc.start();

      // --- Tire Skid / Squeal (Noise) ---
      this.tireGain = this.ctx.createGain();
      this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.tireFilter = this.ctx.createBiquadFilter();
      this.tireFilter.type = 'bandpass';
      this.tireFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      this.tireFilter.Q.setValueAtTime(4, this.ctx.currentTime);

      const noiseBuffer = this.createNoiseBuffer(2);
      this.tireNoiseNode = this.ctx.createBufferSource();
      this.tireNoiseNode.buffer = noiseBuffer;
      this.tireNoiseNode.loop = true;
      this.tireNoiseNode.connect(this.tireFilter);
      this.tireFilter.connect(this.tireGain);
      this.tireGain.connect(this.masterGain);
      this.tireNoiseNode.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
    }
  }

  private makeDistortionCurve(amount = 20) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private createNoiseBuffer(seconds = 1): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Update engine sound state in the game loop
   */
  public update(params: {
    rpm: number;
    maxRpm: number;
    throttle: number;
    speedMph: number;
    isDrifting: boolean;
    slipRatio: number;
    hasTurbo: boolean;
    hasSupercharger?: boolean;
    soundProfile?: string;
  }) {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const {
      rpm,
      maxRpm,
      throttle,
      slipRatio,
      hasTurbo,
      soundProfile = 'flat6_gt',
    } = params;

    const now = this.ctx.currentTime;
    const normRpm = Math.min(1.0, Math.max(0.1, rpm / maxRpm));

    // Base pitch modulation
    let baseFreq = 30 + normRpm * 190;
    if (soundProfile === 'v8_muscle') {
      baseFreq = 24 + normRpm * 160; // Deeper rumble
    } else if (soundProfile === 'v12_screamer') {
      baseFreq = 38 + normRpm * 260; // High-pitched F1 scream
    } else if (soundProfile === 'inline6_turbo') {
      baseFreq = 32 + normRpm * 185;
    }

    // Set frequencies
    if (this.osc1 && this.osc2 && this.osc3) {
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      this.osc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.04);
      this.osc3.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.04);
    }

    // Filter frequency opens up with throttle load
    if (this.engineFilter) {
      const targetCutoff = 350 + throttle * 2800 + normRpm * 2200;
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, now, 0.05);
    }

    // Volume level
    if (this.engineGain) {
      const vol = 0.25 + throttle * 0.45 + normRpm * 0.2;
      this.engineGain.gain.setTargetAtTime(vol, now, 0.05);
    }

    // Turbo spool whistle
    if (this.turboGain && this.turboOsc && this.turboFilter) {
      if (hasTurbo && throttle > 0.3 && normRpm > 0.35) {
        const turboTargetFreq = 1600 + normRpm * 2200;
        this.turboOsc.frequency.setTargetAtTime(turboTargetFreq, now, 0.08);
        this.turboFilter.frequency.setTargetAtTime(turboTargetFreq, now, 0.08);
        const turboVol = Math.min(0.28, (throttle * normRpm) * 0.32);
        this.turboGain.gain.setTargetAtTime(turboVol, now, 0.08);
      } else {
        this.turboGain.gain.setTargetAtTime(0.001, now, 0.12);
      }
    }

    // Turbo flutter blow-off valve detection (throttle drops quickly from high boost)
    if (hasTurbo && this.prevThrottle > 0.65 && throttle < 0.2 && normRpm > 0.45) {
      this.triggerBlowOffFlutter();
    }

    // Exhaust backfire pop on gear shift or hard lift
    if (this.prevThrottle > 0.7 && throttle < 0.1 && (now - this.lastBackfireTime > 0.3)) {
      this.triggerBackfire();
      this.lastBackfireTime = now;
    }

    // Tire squeal based on slip ratio
    if (this.tireGain && this.tireFilter) {
      if (slipRatio > 0.22) {
        const squealVol = Math.min(0.35, (slipRatio - 0.2) * 0.6);
        const squealFreq = 950 + Math.min(1.0, slipRatio) * 600;
        this.tireFilter.frequency.setTargetAtTime(squealFreq, now, 0.03);
        this.tireGain.gain.setTargetAtTime(squealVol, now, 0.04);
      } else {
        this.tireGain.gain.setTargetAtTime(0.0001, now, 0.08);
      }
    }

    this.prevThrottle = throttle;
  }

  /**
   * Classic turbo flutter "tsu-tsu-tsu-tsu"
   */
  public triggerBlowOffFlutter() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const count = 4;
      for (let i = 0; i < count; i++) {
        const delay = i * 0.07;
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        const popFilter = this.ctx.createBiquadFilter();

        popFilter.type = 'bandpass';
        popFilter.frequency.value = 1800 - i * 150;
        popFilter.Q.value = 8;

        popOsc.type = 'sine';
        popOsc.frequency.setValueAtTime(2400 - i * 200, now + delay);
        popOsc.frequency.exponentialRampToValueAtTime(800, now + delay + 0.06);

        popGain.gain.setValueAtTime(0.18 / (i + 1), now + delay);
        popGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

        popOsc.connect(popFilter);
        popFilter.connect(popGain);
        if (this.masterGain) popGain.connect(this.masterGain);

        popOsc.start(now + delay);
        popOsc.stop(now + delay + 0.07);
      }
    } catch {
      // Audio fallback
    }
  }

  /**
   * Loud exhaust backfire gunshot / crackle pop
   */
  public triggerBackfire() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Quick thump + crackle
      const numPops = 1 + Math.floor(Math.random() * 2);
      for (let p = 0; p < numPops; p++) {
        const pDelay = p * 0.08;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1400;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, now + pDelay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + pDelay + 0.07);

        noise.connect(filter);
        filter.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        noise.start(now + pDelay);
      }
    } catch {
      // Audio fallback
    }
  }

  /**
   * Gear shift transmission clunk
   */
  public triggerGearShift() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Checkpoint Gate Chime
   */
  public triggerCheckpointSound() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.08); // A5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Countdown Beep (3, 2, 1 -> low beep, GO! -> high beep)
   */
  public triggerCountdownBeep(isGo: boolean) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isGo ? 'square' : 'triangle';
      const freq = isGo ? 987.77 : 440.0; // B5 or A4
      const duration = isGo ? 0.4 : 0.18;

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(isGo ? 0.4 : 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Race Victory Fanfare
   */
  public triggerVictoryFanfare() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, High C
      notes.forEach((freq, idx) => {
        const noteStart = now + idx * 0.12;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.3, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.42);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * European Dual-Tone Car Horn (Honk on collision / near-miss)
   */
  public triggerHorn() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(420, now);
      osc2.frequency.setValueAtTime(510, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(460, now);
      filter.Q.setValueAtTime(1.5, now);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(filter);
      if (this.masterGain) filter.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch {
      // Audio fallback
    }
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, val));
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : clamped * 0.8, this.ctx.currentTime);
    }
  }

  public setEngineVolume(val: number) {
    if (this.engineGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, val));
      this.engineGain.gain.setValueAtTime(clamped * 0.4, this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0.0 : 0.7, this.ctx.currentTime);
    }
  }

  public getMuted() {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
