/**
 * Procedural European Grand Tour Radio Synthesizer
 * Generates dynamic electronic road soundtrack using the Web Audio API
 */

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  frequency: string;
  bpm: number;
  scale: number[]; // Frequencies for chords / arpeggios
  bassNotes: number[];
  color: string;
}

export const EURO_STATIONS: RadioStation[] = [
  {
    id: 'autobahn',
    name: 'Autobahn Speedwave',
    genre: 'German High-Speed Synthwave',
    frequency: '104.2 FM',
    bpm: 128,
    scale: [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25, 587.33], // A minor
    bassNotes: [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42],
    color: '#38bdf8',
  },
  {
    id: 'riviera',
    name: 'Côte d\'Azur Deep House',
    genre: 'French Riviera Sunset Grooves',
    frequency: '98.5 FM',
    bpm: 120,
    scale: [261.63, 293.66, 329.63, 392.0, 440, 523.25], // C major / pentatonic
    bassNotes: [65.41, 65.41, 73.42, 82.41, 65.41, 73.42, 82.41, 98.0],
    color: '#f59e0b',
  },
  {
    id: 'monaco',
    name: 'Monaco GP Eurobeat',
    genre: 'High-Tempo Racing Eurobeat',
    frequency: '92.4 FM',
    bpm: 140,
    scale: [246.94, 277.18, 329.63, 369.99, 440, 493.88], // B minor
    bassNotes: [61.74, 61.74, 73.42, 82.41, 61.74, 61.74, 92.5, 82.41],
    color: '#ec4899',
  },
  {
    id: 'alpine',
    name: 'Alpine Pass Chillout',
    genre: 'Swiss Mountain Road Ambient',
    frequency: '101.8 FM',
    bpm: 105,
    scale: [196.0, 220.0, 261.63, 293.66, 329.63, 392.0], // G major
    bassNotes: [49.0, 49.0, 55.0, 65.41, 49.0, 55.0, 73.42, 65.41],
    color: '#10b981',
  },
];

class EuroRadioEngine {
  private ctx: AudioContext | null = null;
  private isPlayingRadio = false;
  private currentStationIndex = 0;
  private masterGain: GainNode | null = null;
  private volume = 0.45;
  private timerId: number | null = null;
  private step = 0;
  private listeners: (() => void)[] = [];

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable
    }
  }

  public toggle(): boolean {
    if (this.isPlayingRadio) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public play() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlayingRadio = true;
    this.scheduleNotes();
    this.notify();
  }

  public pause() {
    this.isPlayingRadio = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public nextStation() {
    this.currentStationIndex = (this.currentStationIndex + 1) % EURO_STATIONS.length;
    this.notify();
  }

  public prevStation() {
    this.currentStationIndex = (this.currentStationIndex - 1 + EURO_STATIONS.length) % EURO_STATIONS.length;
    this.notify();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public getCurrentStation(): RadioStation {
    return EURO_STATIONS[this.currentStationIndex];
  }

  public isPlaying(): boolean {
    return this.isPlayingRadio;
  }

  public getVolume(): number {
    return this.volume;
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private scheduleNotes() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }

    const station = this.getCurrentStation();
    const intervalMs = (60 / station.bpm / 2) * 1000; // 8th notes

    this.timerId = window.setInterval(() => {
      if (!this.isPlayingRadio || !this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const currentStation = this.getCurrentStation();

      // Bassline note on every beat or offbeat
      const bassIndex = this.step % currentStation.bassNotes.length;
      const bassFreq = currentStation.bassNotes[bassIndex];
      this.playBassTone(bassFreq, now, intervalMs / 1000);

      // Lead Synth / Arpeggio note
      if (this.step % 2 === 0 || this.step % 3 === 0) {
        const leadIndex = (this.step * 3 + this.currentStationIndex) % currentStation.scale.length;
        const leadFreq = currentStation.scale[leadIndex];
        this.playLeadTone(leadFreq, now, (intervalMs / 1000) * 0.8);
      }

      // High Hat / Percussion click
      if (this.step % 2 === 1) {
        this.playHiHat(now);
      }

      this.step++;
    }, intervalMs);
  }

  private playBassTone(freq: number, startTime: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, startTime);
      filter.frequency.exponentialRampToValueAtTime(120, startTime + duration);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Ignored
    }
  }

  private playLeadTone(freq: number, startTime: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, startTime);
      filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Ignored
    }
  }

  private playHiHat(startTime: number) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(8000, startTime);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6000, startTime);

      gain.gain.setValueAtTime(0.06, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.06);
    } catch {
      // Ignored
    }
  }
}

export const euroRadio = new EuroRadioEngine();
