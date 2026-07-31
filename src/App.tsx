// TINO Reality Debugger - Main AI OS Application
import React, { useEffect, useRef, useState } from 'react';
import { CameraLayer } from './components/CameraLayer';
import { AROverlayCanvas } from './components/AROverlayCanvas';
import { HUDOverlay } from './components/HUDOverlay';
import { RealityDebugPanel } from './components/RealityDebugPanel';
import { visionScanner, type DetectedObject } from './services/visionScanner';
import { detectGesture, type HandGesture } from './services/gestureDetector';
import { audioEngine } from './services/audioEngine';
import * as mpHands from '@mediapipe/hands';

export const App: React.FC = () => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [lockedObjectId, setLockedObjectId] = useState<string | null>('obj_synth_1');
  const [currentGesture, setCurrentGesture] = useState<HandGesture>('NONE');
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [rawLandmarks, setRawLandmarks] = useState<Array<{ x: number; y: number; z: number }>>([]);
  const [fps, setFps] = useState<number>(60);
  const [aiStatus, setAiStatus] = useState<string>('ONLINE');
  const [trackingQuality, setTrackingQuality] = useState<number>(98);

  const prevGestureRef = useRef<HandGesture>('NONE');
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Initialize AI vision models
  useEffect(() => {
    visionScanner.loadModel().then(success => {
      setAiStatus(success ? 'COCO-SSD ACTIVE' : 'NEURAL SIMULATOR');
    });
    setObjects(visionScanner.getSimulatedObjects());
  }, []);

  // Set up MediaPipe Hands tracking loop on video element
  useEffect(() => {
    if (!videoElement) return;

    // Hands instance
    let hands: any = null;
    let animFrame: number | null = null;

    try {
      const mp = mpHands as unknown as Record<string, unknown>;
      const HandsClass = mp.Hands || (mp.default as Record<string, unknown>)?.Hands || (window as unknown as Record<string, unknown>).Hands;
      if (HandsClass) {
        hands = new (HandsClass as new (config: { locateFile: (file: string) => string }) => {
          setOptions: (opts: unknown) => void;
          onResults: (cb: (results: unknown) => void) => void;
          send: (input: { image: HTMLVideoElement }) => Promise<void>;
          close: () => void;
        })({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        hands.onResults((results: mpHands.Results) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            setRawLandmarks(landmarks);

            const { gesture, confidence, pointerPos } = detectGesture(landmarks);
            setCurrentGesture(gesture);
            setPointerPos(pointerPos);
            setTrackingQuality(Math.round(confidence * 100));
          } else {
            setRawLandmarks([]);
            setCurrentGesture('NONE');
            setPointerPos(null);
            setTrackingQuality(92);
          }
        });
      }

      // Frame Processing Loop
      const processFrame = async () => {
        if (videoElement && videoElement.readyState >= 2) {
          try {
            if (hands) {
              await hands.send({ image: videoElement });
            }
          } catch (e) {
            // Silence frame send drops
          }

          // Detect objects via COCO-SSD / Scanner
          const detected = await visionScanner.detect(videoElement);
          setObjects(prevObjs => {
            return detected.map(newObj => {
              const existing = prevObjs.find(p => p.id === newObj.id);
              return existing ? { ...newObj, realityState: existing.realityState, isLocked: existing.isLocked } : newObj;
            });
          });
        }

        // FPS Calculation
        frameCountRef.current++;
        const now = performance.now();
        if (now - lastFrameTimeRef.current >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current)));
          frameCountRef.current = 0;
          lastFrameTimeRef.current = now;
        }

        animFrame = requestAnimationFrame(processFrame);
      };

      processFrame();
    } catch (err) {
      console.warn('MediaPipe Hands setup warning:', err);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (hands) hands.close();
    };
  }, [videoElement]);

  // HANDLE GESTURE REALITY POWERS & AUDIO TRIGGERS
  useEffect(() => {
    if (currentGesture === prevGestureRef.current) return;
    prevGestureRef.current = currentGesture;

    if (currentGesture === 'NONE') return;

    audioEngine.playGestureRecognized();

    setObjects(prevObjects => {
      const lockedObj = prevObjects.find(o => o.isLocked) || prevObjects[0];
      if (!lockedObj) return prevObjects;

      return prevObjects.map(obj => {
        if (obj.id !== lockedObj.id) return obj;

        const newState = { ...obj.realityState };

        switch (currentGesture) {
          case 'FIST': // Gravity = OFF
            newState.gravity = false;
            audioEngine.playRealityEdit();
            break;
          case 'OK_SIGN': // Color = Holographic Purple
            newState.color = 'purple';
            audioEngine.playRealityEdit();
            break;
          case 'TWO_FINGERS': // Scale = 300%
            newState.scale = 3.0;
            audioEngine.playRealityEdit();
            break;
          case 'OPEN_PALM': // Time = Freeze
            newState.timeFrozen = true;
            audioEngine.playTimeFreeze();
            break;
          case 'PINCH': // Reset object back to default
            newState.gravity = true;
            newState.color = 'default';
            newState.scale = 1.0;
            newState.timeFrozen = false;
            newState.dissolved = false;
            audioEngine.playReset();
            break;
          case 'POINTING_FINGER':
            audioEngine.playLockOn();
            break;
        }

        return { ...obj, realityState: newState };
      });
    });
  }, [currentGesture]);

  // Lock target object nearest to finger pointer reticle
  useEffect(() => {
    if (currentGesture === 'POINTING_FINGER' && pointerPos && objects.length > 0) {
      let nearestId = objects[0].id;
      let minDistance = Infinity;

      objects.forEach(obj => {
        const [x, y, w, h] = obj.bbox;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const dist = Math.sqrt(Math.pow(pointerPos.x - cx, 2) + Math.pow(pointerPos.y - cy, 2));
        if (dist < minDistance) {
          minDistance = dist;
          nearestId = obj.id;
        }
      });

      if (nearestId !== lockedObjectId) {
        setLockedObjectId(nearestId);
        setObjects(objs => objs.map(o => ({ ...o, isLocked: o.id === nearestId })));
      }
    }
  }, [pointerPos, currentGesture, objects, lockedObjectId]);

  const handleResetObject = () => {
    audioEngine.playReset();
    setObjects(objs => objs.map(o => o.isLocked ? {
      ...o,
      realityState: {
        gravity: true,
        color: 'default',
        scale: 1.0,
        timeFrozen: false,
        physics: 'metal',
        dissolved: false
      }
    } : o));
  };

  const handleSnapTriggered = () => {
    audioEngine.playDissolve();
    setObjects(objs => objs.map(o => o.isLocked ? {
      ...o,
      realityState: { ...o.realityState, dissolved: true }
    } : o));

    // Auto restore after dissolve
    setTimeout(() => {
      handleResetObject();
    }, 2500);
  };

  const handleUpdateObjectState = (key: keyof DetectedObject['realityState'], val: unknown) => {
    audioEngine.playRealityEdit();
    setObjects(objs => objs.map(o => o.isLocked ? {
      ...o,
      realityState: { ...o.realityState, [key]: val }
    } : o));
  };

  const currentLockedObject = objects.find(o => o.isLocked) || objects[0] || null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white select-none font-mono">
      {/* Live Webcam Feed Background */}
      <CameraLayer onVideoReady={setVideoElement} />

      {/* AR Canvas Rendering Layer */}
      <AROverlayCanvas
        objects={objects}
        activeGesture={currentGesture}
        pointerPos={pointerPos}
        rawLandmarks={rawLandmarks}
      />

      {/* Cinematic HUD Telemetry */}
      <HUDOverlay
        fps={fps}
        aiStatus={aiStatus}
        trackingQuality={trackingQuality}
        currentGesture={currentGesture}
        currentObject={currentLockedObject}
        onSnapTriggered={handleSnapTriggered}
      />

      {/* Floating Reality Debug & Code Visualizer Panel */}
      <aside className="absolute top-24 right-6 pointer-events-auto z-30">
        <RealityDebugPanel
          targetObject={currentLockedObject}
          onResetObject={handleResetObject}
          onUpdateState={handleUpdateObjectState}
        />
      </aside>
    </main>
  );
};

export default App;
