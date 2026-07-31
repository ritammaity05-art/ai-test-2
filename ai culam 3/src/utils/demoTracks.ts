/**
 * demoTracks.ts
 * Generates rich synthetic audio tracks with isolated multi-channel stemBuffers
 * (Drums, Bass, Instruments, Vocals) for 100% clean stem muting.
 */

import type { Track } from '../types/dj';
import { AudioAnalyzer } from '../audio/AudioAnalyzer';

export const DEMO_TRACK_METADATA = [
  {
    id: 'demo-1',
    title: 'Neon Cyberpunk Beat',
    artist: 'TINO Synth Lab',
    genre: 'Synthwave',
    bpm: 124,
    key: '8A',
    duration: 60,
    color: '#3b82f6',
  },
  {
    id: 'demo-2',
    title: 'Deep House Groove',
    artist: 'TINO Audio Core',
    genre: 'Deep House',
    bpm: 126,
    key: '5B',
    duration: 60,
    color: '#10b981',
  },
  {
    id: 'demo-3',
    title: 'Techno Pulse 130',
    artist: 'TINO DJ Studio',
    genre: 'Peak Techno',
    bpm: 130,
    key: '9A',
    duration: 60,
    color: '#8b5cf6',
  },
  {
    id: 'demo-4',
    title: 'Funk & Disco Groove',
    artist: 'TINO Groove Collective',
    genre: 'Funk / Nu-Disco',
    bpm: 120,
    key: '6B',
    duration: 60,
    color: '#ec4899',
  },
];

export async function generateDemoTrack(
  ctx: AudioContext,
  meta: typeof DEMO_TRACK_METADATA[0]
): Promise<Track> {
  const sampleRate = ctx.sampleRate;
  const length = meta.duration * sampleRate;

  // Master Audio Buffer
  const masterBuffer = ctx.createBuffer(2, length, sampleRate);
  const masterL = masterBuffer.getChannelData(0);
  const masterR = masterBuffer.getChannelData(1);

  // Isolated Stem Buffers
  const drumsBuf = ctx.createBuffer(2, length, sampleRate);
  const drumsL = drumsBuf.getChannelData(0);
  const drumsR = drumsBuf.getChannelData(1);

  const bassBuf = ctx.createBuffer(2, length, sampleRate);
  const bassL = bassBuf.getChannelData(0);
  const bassR = bassBuf.getChannelData(1);

  const instBuf = ctx.createBuffer(2, length, sampleRate);
  const instL = instBuf.getChannelData(0);
  const instR = instBuf.getChannelData(1);

  const vocalBuf = ctx.createBuffer(2, length, sampleRate);
  const vocalL = vocalBuf.getChannelData(0);
  const vocalR = vocalBuf.getChannelData(1);

  const secondsPerBeat = 60 / meta.bpm;
  const samplesPerBeat = secondsPerBeat * sampleRate;

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const beatProgress = (i % samplesPerBeat) / samplesPerBeat;
    const currentBeat = Math.floor(i / samplesPerBeat);
    const bar = Math.floor(currentBeat / 4);

    let dL = 0, dR = 0;
    let bL = 0, bR = 0;
    let iL = 0, iR = 0;
    let vL = 0, vR = 0;

    // 1. DRUMS (Kick, Snare, HiHat)
    if (beatProgress < 0.2) {
      const kickFreq = 140 * Math.exp(-beatProgress * 25);
      const kickEnv = Math.exp(-beatProgress * 15);
      const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.7;
      dL += kick;
      dR += kick;
    }
    if (currentBeat % 2 === 1 && beatProgress < 0.25) {
      const noise = Math.random() * 2 - 1;
      const snareEnv = Math.exp(-beatProgress * 18);
      const snareTone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-beatProgress * 30);
      const snare = (noise * 0.6 + snareTone * 0.4) * snareEnv * 0.4;
      dL += snare;
      dR += snare;
    }
    const offbeat = (beatProgress + 0.5) % 1.0;
    if (offbeat < 0.1) {
      const noise = Math.random() * 2 - 1;
      const hatEnv = Math.exp(-offbeat * 40);
      dL += noise * hatEnv * 0.25;
      dR += noise * hatEnv * 0.25;
    }

    // 2. BASS
    const bassNoteIndex = (Math.floor(t * 4) + bar) % 4;
    const bassFreqs = meta.genre.includes('Techno')
      ? [55, 55, 65.4, 49]
      : meta.genre.includes('Funk')
      ? [65.4, 82.4, 98, 73.4]
      : [55, 65.4, 73.4, 82.4];
    const bassFreq = bassFreqs[bassNoteIndex];
    const bassSub = Math.sin(2 * Math.PI * bassFreq * t);
    const bassSaw = (2 * ((bassFreq * t) % 1)) - 1;
    const bassEnv = Math.exp(-(beatProgress % 0.5) * 8);
    const bassVal = (bassSub * 0.6 + bassSaw * 0.4) * bassEnv * 0.45;
    bL += bassVal;
    bR += bassVal;

    // 3. INSTRUMENTS (Synth Leads, Chords, Arpeggios)
    const arpNote = Math.floor(t * 8) % 8;
    const arpFreq = 220 * Math.pow(2, arpNote / 12);
    const arpVal = Math.sin(2 * Math.PI * arpFreq * t) * Math.exp(-(t % 0.125) * 20);
    iL += arpVal * 0.25 * (arpNote % 2 === 0 ? 1 : 0.7);
    iR += arpVal * 0.25 * (arpNote % 2 === 1 ? 1 : 0.7);

    // 4. VOCALS (Formant Synth Drop)
    if (bar % 4 === 3 && currentBeat % 4 >= 2) {
      const vFreq = 440 * (1 + 0.1 * Math.sin(2 * Math.PI * 5 * t));
      const vVal = Math.sin(2 * Math.PI * vFreq * t) * Math.exp(-(beatProgress % 0.25) * 10);
      vL += vVal * 0.3;
      vR += vVal * 0.3;
    }

    // Write to Stem Buffers
    drumsL[i] = Math.max(-1, Math.min(1, dL));
    drumsR[i] = Math.max(-1, Math.min(1, dR));

    bassL[i] = Math.max(-1, Math.min(1, bL));
    bassR[i] = Math.max(-1, Math.min(1, bR));

    instL[i] = Math.max(-1, Math.min(1, iL));
    instR[i] = Math.max(-1, Math.min(1, iR));

    vocalL[i] = Math.max(-1, Math.min(1, vL));
    vocalR[i] = Math.max(-1, Math.min(1, vR));

    // Master sum
    masterL[i] = Math.max(-1, Math.min(1, dL + bL + iL + vL));
    masterR[i] = Math.max(-1, Math.min(1, dR + bR + iR + vR));
  }

  const analysis = await AudioAnalyzer.analyze(masterBuffer);

  return {
    id: meta.id,
    title: meta.title,
    artist: meta.artist,
    genre: meta.genre,
    bpm: meta.bpm,
    key: meta.key,
    duration: meta.duration,
    audioBuffer: masterBuffer,
    stemBuffers: {
      drums: drumsBuf,
      bass: bassBuf,
      instruments: instBuf,
      vocals: vocalBuf,
    },
    peakData: analysis.peakData,
    overviewPeaks: analysis.overviewPeaks,
    addedAt: Date.now(),
  };
}
