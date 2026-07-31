// MediaPipe Hand Landmark Gesture Analyzer for TINO Reality Debugger

export type HandGesture = 
  | 'NONE'
  | 'OPEN_PALM'
  | 'FIST'
  | 'PINCH'
  | 'OK_SIGN'
  | 'TWO_FINGERS'
  | 'POINTING_FINGER';

export interface GestureDetectionResult {
  gesture: HandGesture;
  confidence: number;
  pointerPos: { x: number; y: number } | null;
  rawLandmarks?: Array<{ x: number; y: number; z: number }>;
}

// Distance helper
function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function detectGesture(landmarks: Array<{ x: number; y: number; z: number }>): GestureDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'NONE', confidence: 0, pointerPos: null };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // Finger extension checks (distance from tip to wrist compared to MCP to wrist)
  const isIndexExtended = distance(indexTip, wrist) > distance(indexMcp, wrist) * 1.3;
  const isMiddleExtended = distance(middleTip, wrist) > distance(landmarks[9], wrist) * 1.3;
  const isRingExtended = distance(ringTip, wrist) > distance(landmarks[13], wrist) * 1.3;
  const isPinkyExtended = distance(pinkyTip, wrist) > distance(landmarks[17], wrist) * 1.3;

  // Pinch distance check (Thumb Tip to Index Tip)
  const thumbIndexDist = distance(thumbTip, indexTip);
  const pinchThreshold = 0.08; // Normalized distance

  // Pointer position is the index finger tip
  const pointerPos = { x: indexTip.x, y: indexTip.y };

  // 1. OK Sign: Thumb and Index touch, others extended
  if (thumbIndexDist < pinchThreshold && isMiddleExtended && isRingExtended) {
    return { gesture: 'OK_SIGN', confidence: 0.95, pointerPos, rawLandmarks: landmarks };
  }

  // 2. Pinch: Thumb and Index close, other fingers NOT all extended
  if (thumbIndexDist < pinchThreshold && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return { gesture: 'PINCH', confidence: 0.92, pointerPos, rawLandmarks: landmarks };
  }

  // 3. Open Palm: All main fingers extended
  if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
    return { gesture: 'OPEN_PALM', confidence: 0.96, pointerPos, rawLandmarks: landmarks };
  }

  // 4. Two Fingers (V-sign / Victory): Index & Middle extended, Ring & Pinky curled
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return { gesture: 'TWO_FINGERS', confidence: 0.94, pointerPos, rawLandmarks: landmarks };
  }

  // 5. Pointing Finger: Index extended, Middle, Ring, Pinky curled
  if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return { gesture: 'POINTING_FINGER', confidence: 0.98, pointerPos, rawLandmarks: landmarks };
  }

  // 6. Fist: All fingers curled (tips close to wrist or MCPs)
  if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return { gesture: 'FIST', confidence: 0.93, pointerPos, rawLandmarks: landmarks };
  }

  return { gesture: 'NONE', confidence: 0.5, pointerPos, rawLandmarks: landmarks };
}
