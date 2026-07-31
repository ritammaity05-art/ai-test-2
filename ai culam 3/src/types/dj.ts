export type DeckId = 'A' | 'B';

export interface CuePoint {
  id: number;
  position: number;
  label: string;
  color: string;
}

export interface LoopState {
  active: boolean;
  start: number | null;
  end: number | null;
  lengthBeats: number | null;
  isAuto: boolean;
}

export interface StemsState {
  vocals: boolean;      // true = active, false = muted (100% silent)
  instruments: boolean; // true = active, false = muted (100% silent)
  bass: boolean;        // true = active, false = muted (100% silent)
  drums: boolean;       // true = active, false = muted (100% silent)
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number;
  bpm: number;
  key: string;
  audioBuffer?: AudioBuffer;
  stemBuffers?: {
    vocals?: AudioBuffer;
    instruments?: AudioBuffer;
    bass?: AudioBuffer;
    drums?: AudioBuffer;
  };
  peakData?: Float32Array;
  overviewPeaks?: Float32Array;
  vocalPeaks?: Float32Array;
  instPeaks?: Float32Array;
  bassPeaks?: Float32Array;
  drumsPeaks?: Float32Array;
  url?: string;
  file?: File;
  addedAt: number;
}

export interface DeckState {
  deckId: DeckId;
  track: Track | null;
  isPlaying: boolean;
  isPaused: boolean;
  isCued: boolean;
  currentTime: number;
  duration: number;
  bpm: number;
  originalBpm: number;
  key: string;
  keyLock: boolean;
  pitchPercent: number;
  pitchBend: number;
  vinylMode: boolean;
  slipMode: boolean;
  slipTime: number;
  reverse: boolean;
  isScratching: boolean;
  hotCues: (CuePoint | null)[];
  loop: LoopState;
  stems: StemsState;
  quantize: boolean;
  beatGridOffset: number;
}

export interface EqState {
  high: number;
  mid: number;
  low: number;
}

export interface MixerChannelState {
  gain: number;
  eq: EqState;
  filter: number;
  volume: number;
  cue: boolean;
  peakMeter: { left: number; right: number };
}

export type CrossfaderCurve = 'linear' | 'constant_power' | 'scratch';

export interface MixerState {
  deckA: MixerChannelState;
  deckB: MixerChannelState;
  crossfader: number;
  crossfaderCurve: CrossfaderCurve;
  masterVolume: number;
  headphoneVolume: number;
  headphoneCueMix: number;
  masterMeter: { left: number; right: number };
}

export type EffectType =
  | 'echo'
  | 'delay'
  | 'reverb'
  | 'filter'
  | 'flanger'
  | 'phaser'
  | 'roll'
  | 'gate'
  | 'noise'
  | 'bitcrusher';

export interface FXUnitState {
  id: 'FX_A' | 'FX_B';
  assignedDeck: DeckId;
  enabled: boolean;
  type: EffectType;
  param1: number;
  param2: number;
  param3: number;
  wetDry: number;
  beatSync: boolean;
}

export interface MIDIMapping {
  id: string;
  name: string;
  channel: number;
  controlNumber: number;
  type: 'note' | 'cc' | 'pitchbend';
  target: string;
}

export interface KeyMapping {
  key: string;
  label: string;
  target: string;
}

export interface AudioSettings {
  sampleRate: number;
  latencyHint: 'interactive' | 'playback' | 'balanced';
  graphicsQuality: 'high' | 'medium' | 'low';
  theme: 'pro-dark' | 'neon-cyan' | 'obsidian';
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  blobUrl: string | null;
}
