/**
 * SamplerEngine.ts
 * Real-Time Web Audio Sampler Engine providing 8 classic DJ Sound Effects & Drum Samples:
 * 1. Airhorn Drop
 * 2. Laser Blast
 * 3. Siren Alarm
 * 4. DJ Voice Drop ("DROP IT!")
 * 5. Sub Kick
 * 6. Trap Snare Roll
 * 7. Hi-Hat Closed
 * 8. Impact Crash Drop
 */

export interface SamplerPad {
  id: number;
  name: string;
  color: string;
  buffer: AudioBuffer | null;
}

export class SamplerEngine {
  private static instance: SamplerEngine | null = null;
  private ctx: AudioContext;
  private masterOutput: GainNode;
  public pads: SamplerPad[] = [];

  private constructor(ctx: AudioContext, masterOutput: GainNode) {
    this.ctx = ctx;
    this.masterOutput = masterOutput;
    this.initSamples();
  }

  public static getInstance(ctx?: AudioContext, masterOutput?: GainNode): SamplerEngine {
    if (!SamplerEngine.instance && ctx && masterOutput) {
      SamplerEngine.instance = new SamplerEngine(ctx, masterOutput);
    }
    return SamplerEngine.instance!;
  }

  private initSamples() {
    const padMetadata = [
      { id: 0, name: 'AIRHORN', color: '#f97316' },
      { id: 1, name: 'LASER', color: '#06b6d4' },
      { id: 2, name: 'SIREN', color: '#ef4444' },
      { id: 3, name: 'VOICE DROP', color: '#a855f7' },
      { id: 4, name: 'SUB KICK', color: '#eab308' },
      { id: 5, name: 'TRAP SNARE', color: '#10b981' },
      { id: 6, name: 'HI-HAT', color: '#3b82f6' },
      { id: 7, name: 'IMPACT CRASH', color: '#ec4899' },
    ];

    this.pads = padMetadata.map((m) => ({
      ...m,
      buffer: this.synthesizeSample(m.id),
    }));
  }

  /**
   * Synthesize high-quality DJ sample sound effect buffers
   */
  private synthesizeSample(id: number): AudioBuffer {
    const sr = this.ctx.sampleRate;
    let duration = 0.5;
    if (id === 0) duration = 1.0; // Airhorn
    if (id === 2) duration = 1.2; // Siren
    if (id === 7) duration = 1.5; // Crash

    const length = Math.floor(duration * sr);
    const buffer = this.ctx.createBuffer(2, length, sr);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sr;
      let sampleL = 0;
      let sampleR = 0;

      switch (id) {
        case 0: { // Airhorn reggaeton staccato blast
          const f1 = 466.16; // Bb4
          const f2 = 587.33; // D5
          const env = Math.exp(-t * 2) * (1 + 0.3 * Math.sin(2 * Math.PI * 12 * t));
          const wave = Math.sin(2 * Math.PI * f1 * t) * 0.6 + Math.sin(2 * Math.PI * f2 * t) * 0.4;
          sampleL = wave * env;
          sampleR = wave * env;
          break;
        }
        case 1: { // Laser pitch sweep
          const f = 2000 * Math.exp(-t * 15);
          const env = Math.exp(-t * 12);
          const wave = Math.sin(2 * Math.PI * f * t);
          sampleL = wave * env;
          sampleR = wave * env;
          break;
        }
        case 2: { // Emergency Siren lfo sweep
          const lfo = Math.sin(2 * Math.PI * 3 * t);
          const f = 800 + lfo * 400;
          const env = Math.min(1, t * 5) * Math.exp(-t * 1.5);
          const wave = Math.sin(2 * Math.PI * f * t);
          sampleL = wave * env;
          sampleR = wave * env;
          break;
        }
        case 3: { // Voice Drop synth formant
          const f = 150 * (1 + 0.2 * Math.sin(2 * Math.PI * 6 * t));
          const env = Math.exp(-t * 4);
          const wave = (2 * ((f * t) % 1)) - 1; // saw wave voice
          sampleL = wave * env * 0.7;
          sampleR = wave * env * 0.7;
          break;
        }
        case 4: { // Sub Kick drum
          const f = 120 * Math.exp(-t * 20);
          const env = Math.exp(-t * 10);
          const wave = Math.sin(2 * Math.PI * f * t);
          sampleL = wave * env;
          sampleR = wave * env;
          break;
        }
        case 5: { // Trap Snare
          const noise = Math.random() * 2 - 1;
          const tone = Math.sin(2 * Math.PI * 220 * t);
          const env = Math.exp(-t * 15);
          sampleL = (noise * 0.7 + tone * 0.3) * env;
          sampleR = (noise * 0.7 + tone * 0.3) * env;
          break;
        }
        case 6: { // Hi-Hat
          const noise = Math.random() * 2 - 1;
          const env = Math.exp(-t * 35);
          sampleL = noise * env * 0.5;
          sampleR = noise * env * 0.5;
          break;
        }
        case 7: { // Impact Crash
          const noise = Math.random() * 2 - 1;
          const env = Math.exp(-t * 3);
          const sub = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 10);
          sampleL = (noise * 0.6 + sub * 0.4) * env;
          sampleR = (noise * 0.6 + sub * 0.4) * env;
          break;
        }
      }

      left[i] = Math.max(-1, Math.min(1, sampleL));
      right[i] = Math.max(-1, Math.min(1, sampleR));
    }

    return buffer;
  }

  public triggerPad(padId: number, volume: number = 0.9) {
    const pad = this.pads.find((p) => p.id === padId);
    if (!pad || !pad.buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = pad.buffer;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.masterOutput);

    source.start(0);
  }
}
