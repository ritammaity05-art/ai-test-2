// TensorFlow COCO-SSD Vision Object Scanner for TINO Reality Debugger
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height] normalized (0..1)
  isLocked: boolean;
  realityState: {
    gravity: boolean; // Fist: OFF
    color: 'default' | 'purple'; // OK: Purple
    scale: number; // Two Fingers: 300% -> 3.0
    timeFrozen: boolean; // Open Palm: Freeze
    physics: 'metal' | 'anti-matter' | 'plasma';
    dissolved: boolean; // Snap
  };
}

class VisionScanner {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoading: boolean = false;
  private simulatedObjects: DetectedObject[] = [];

  constructor() {
    this.initSimulatedObjects();
  }

  private initSimulatedObjects() {
    this.simulatedObjects = [
      {
        id: 'obj_synth_1',
        label: 'NEURAL NODE / LAPTOP',
        confidence: 0.98,
        bbox: [0.25, 0.3, 0.45, 0.4],
        isLocked: true,
        realityState: {
          gravity: true,
          color: 'default',
          scale: 1.0,
          timeFrozen: false,
          physics: 'metal',
          dissolved: false
        }
      },
      {
        id: 'obj_synth_2',
        label: 'COMM LINK / SMARTPHONE',
        confidence: 0.94,
        bbox: [0.72, 0.45, 0.18, 0.3],
        isLocked: false,
        realityState: {
          gravity: true,
          color: 'default',
          scale: 1.0,
          timeFrozen: false,
          physics: 'metal',
          dissolved: false
        }
      },
      {
        id: 'obj_synth_3',
        label: 'CYBER DRINK / CUP',
        confidence: 0.89,
        bbox: [0.12, 0.55, 0.12, 0.22],
        isLocked: false,
        realityState: {
          gravity: true,
          color: 'default',
          scale: 1.0,
          timeFrozen: false,
          physics: 'metal',
          dissolved: false
        }
      }
    ];
  }

  public async loadModel(): Promise<boolean> {
    if (this.model) return true;
    if (this.isLoading) return false;
    try {
      this.isLoading = true;
      console.log('Loading TensorFlow COCO-SSD object detector...');
      this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      console.log('COCO-SSD model loaded successfully.');
      this.isLoading = false;
      return true;
    } catch (err) {
      console.warn('Failed to load COCO-SSD model, falling back to neural scanner mode:', err);
      this.isLoading = false;
      return false;
    }
  }

  public async detect(videoEl: HTMLVideoElement | null): Promise<DetectedObject[]> {
    if (this.model && videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
      try {
        const predictions = await this.model.detect(videoEl);
        if (predictions.length > 0) {
          const vw = videoEl.videoWidth;
          const vh = videoEl.videoHeight;
          return predictions.map((pred, i) => {
            const [x, y, w, h] = pred.bbox;
            const existing = this.simulatedObjects.find(o => o.label.toLowerCase().includes(pred.class.toLowerCase()));
            return {
              id: existing ? existing.id : `obj_tf_${i}`,
              label: pred.class.toUpperCase(),
              confidence: Math.round(pred.score * 100) / 100,
              bbox: [x / vw, y / vh, w / vw, h / vh],
              isLocked: existing ? existing.isLocked : i === 0,
              realityState: existing ? existing.realityState : {
                gravity: true,
                color: 'default',
                scale: 1.0,
                timeFrozen: false,
                physics: 'metal',
                dissolved: false
              }
            };
          });
        }
      } catch (err) {
        console.warn('TF Detection error:', err);
      }
    }
    // Return simulated scanner objects if no video predictions
    return this.simulatedObjects;
  }

  public getSimulatedObjects(): DetectedObject[] {
    return this.simulatedObjects;
  }
}

export const visionScanner = new VisionScanner();
