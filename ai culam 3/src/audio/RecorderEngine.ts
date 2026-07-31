/**
 * RecorderEngine.ts
 * Real-Time Master Mix Recorder using Web MediaRecorder API.
 */

import { AudioEngine } from './AudioEngine';

export class RecorderEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private startTime: number = 0;
  private timerId: number | null = null;

  private onStatusChange?: (isRecording: boolean, durationSeconds: number, blobUrl: string | null) => void;

  public setCallback(cb: (isRecording: boolean, durationSeconds: number, blobUrl: string | null) => void) {
    this.onStatusChange = cb;
  }

  public startRecording() {
    const engine = AudioEngine.getInstance();
    const stream = engine.streamDestination.stream;

    this.recordedChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    try {
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    } catch (_) {
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      this.isRecording = false;
      this.stopTimer();
      if (this.onStatusChange) {
        this.onStatusChange(false, this.getDuration(), url);
      }
    };

    this.mediaRecorder.start(100);
    this.isRecording = true;
    this.startTime = Date.now();
    this.startTimer();

    if (this.onStatusChange) {
      this.onStatusChange(true, 0, null);
    }
  }

  public stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  public getDuration(): number {
    if (!this.isRecording) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private startTimer() {
    this.timerId = window.setInterval(() => {
      if (this.onStatusChange && this.isRecording) {
        this.onStatusChange(true, this.getDuration(), null);
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
