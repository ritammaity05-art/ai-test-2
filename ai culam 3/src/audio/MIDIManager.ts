/**
 * MIDIManager.ts
 * Web MIDI API Manager with Auto-Detection & Visual MIDI Learn support.
 */

import type { MIDIMapping } from '../types/dj';

export interface MIDIMessageEvent {
  channel: number;
  type: 'note_on' | 'note_off' | 'cc' | 'pitchbend';
  controlNumber: number;
  value: number; // 0 to 127
  raw: Uint8Array;
}

export class MIDIManager {
  private static instance: MIDIManager | null = null;
  public isSupported: boolean = false;
  public devices: { id: string; name: string; manufacturer: string }[] = [];
  public isConnected: boolean = false;

  private mappings: MIDIMapping[] = [];
  private isLearning: boolean = false;
  private learningTarget: string | null = null;

  private onMIDIMessageCallback?: (msg: MIDIMessageEvent) => void;
  private onDevicesChangedCallback?: (devices: { id: string; name: string; manufacturer: string }[]) => void;
  private onMIDILearnCallback?: (mapping: MIDIMapping) => void;

  private constructor() {
    this.initMIDI();
    this.loadDefaultMappings();
  }

  public static getInstance(): MIDIManager {
    if (!MIDIManager.instance) {
      MIDIManager.instance = new MIDIManager();
    }
    return MIDIManager.instance;
  }

  private async initMIDI() {
    if ('requestMIDIAccess' in navigator) {
      try {
        const midiAccess = await (navigator as unknown as { requestMIDIAccess: (opts: { sysex: boolean }) => Promise<any> }).requestMIDIAccess({ sysex: false });
        this.isSupported = true;
        this.updateDevices(midiAccess);

        midiAccess.onstatechange = () => {
          this.updateDevices(midiAccess);
        };
      } catch (err) {
        console.warn('Web MIDI Access denied or unavailable:', err);
      }
    }
  }

  private updateDevices(midiAccess: any) {
    const devList: { id: string; name: string; manufacturer: string }[] = [];
    if (midiAccess && midiAccess.inputs) {
      const inputs = midiAccess.inputs.values();

      for (const input of inputs) {
        devList.push({
          id: input.id,
          name: input.name || 'Generic MIDI Device',
          manufacturer: input.manufacturer || 'Unknown',
        });

        input.onmidimessage = (e: any) => this.handleMIDIMessage(e);
      }
    }

    this.devices = devList;
    this.isConnected = devList.length > 0;

    if (this.onDevicesChangedCallback) {
      this.onDevicesChangedCallback(devList);
    }
  }

  private handleMIDIMessage(e: any) {
    const data = e.data;
    if (!data || data.length < 2) return;

    const status = data[0];
    const channel = (status & 0x0f) + 1;
    const command = status >> 4;

    const controlNumber = data[1];
    const value = data.length > 2 ? data[2] : 0;

    let msgType: 'note_on' | 'note_off' | 'cc' | 'pitchbend' = 'cc';
    if (command === 0x9) msgType = value > 0 ? 'note_on' : 'note_off';
    else if (command === 0x8) msgType = 'note_off';
    else if (command === 0xb) msgType = 'cc';
    else if (command === 0xe) msgType = 'pitchbend';

    const midiMsg: MIDIMessageEvent = {
      channel,
      type: msgType,
      controlNumber,
      value,
      raw: data,
    };

    if (this.isLearning && this.learningTarget) {
      const newMapping: MIDIMapping = {
        id: `${channel}-${controlNumber}-${msgType}`,
        name: `MIDI Ch ${channel} #${controlNumber}`,
        channel,
        controlNumber,
        type: msgType === 'cc' ? 'cc' : msgType === 'pitchbend' ? 'pitchbend' : 'note',
        target: this.learningTarget,
      };

      this.addOrUpdateMapping(newMapping);
      this.isLearning = false;
      this.learningTarget = null;

      if (this.onMIDILearnCallback) {
        this.onMIDILearnCallback(newMapping);
      }
      return;
    }

    if (this.onMIDIMessageCallback) {
      this.onMIDIMessageCallback(midiMsg);
    }
  }

  public startLearning(target: string, onLearned: (mapping: MIDIMapping) => void) {
    this.isLearning = true;
    this.learningTarget = target;
    this.onMIDILearnCallback = onLearned;
  }

  public cancelLearning() {
    this.isLearning = false;
    this.learningTarget = null;
  }

  public setMIDIMessageCallback(cb: (msg: MIDIMessageEvent) => void) {
    this.onMIDIMessageCallback = cb;
  }

  public setDevicesChangedCallback(cb: (devices: { id: string; name: string; manufacturer: string }[]) => void) {
    this.onDevicesChangedCallback = cb;
  }

  public getMappings(): MIDIMapping[] {
    return [...this.mappings];
  }

  public addOrUpdateMapping(mapping: MIDIMapping) {
    const existingIdx = this.mappings.findIndex((m) => m.target === mapping.target);
    if (existingIdx >= 0) {
      this.mappings[existingIdx] = mapping;
    } else {
      this.mappings.push(mapping);
    }
    this.saveMappings();
  }

  public deleteMapping(target: string) {
    this.mappings = this.mappings.filter((m) => m.target !== target);
    this.saveMappings();
  }

  private loadDefaultMappings() {
    try {
      const saved = localStorage.getItem('tino_dj_midi_mappings');
      if (saved) {
        this.mappings = JSON.parse(saved);
        return;
      }
    } catch (_) {}

    this.mappings = [
      { id: '1-60-note', name: 'Deck A Play', channel: 1, controlNumber: 60, type: 'note', target: 'deckA.play' },
      { id: '1-61-note', name: 'Deck A Cue', channel: 1, controlNumber: 61, type: 'note', target: 'deckA.cue' },
      { id: '2-60-note', name: 'Deck B Play', channel: 2, controlNumber: 60, type: 'note', target: 'deckB.play' },
      { id: '2-61-note', name: 'Deck B Cue', channel: 2, controlNumber: 61, type: 'note', target: 'deckB.cue' },
      { id: '1-1-cc', name: 'Crossfader', channel: 1, controlNumber: 1, type: 'cc', target: 'mixer.crossfader' },
    ];
  }

  private saveMappings() {
    try {
      localStorage.setItem('tino_dj_midi_mappings', JSON.stringify(this.mappings));
    } catch (_) {}
  }
}
