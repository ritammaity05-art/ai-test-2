// High Performance Canvas AR Visual Effects Renderer for TINO Reality Debugger
import React, { useEffect, useRef } from 'react';
import type { DetectedObject } from '../services/visionScanner';
import type { HandGesture } from '../services/gestureDetector';

interface AROverlayCanvasProps {
  objects: DetectedObject[];
  activeGesture: HandGesture;
  pointerPos: { x: number; y: number } | null;
  rawLandmarks?: Array<{ x: number; y: number; z: number }>;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export const AROverlayCanvas: React.FC<AROverlayCanvasProps> = ({
  objects,
  activeGesture,
  pointerPos,
  rawLandmarks
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Main 120 FPS Rendering Loop
    const render = () => {
      timeRef.current += 0.016; // ~60-120fps delta step
      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Find currently locked object or primary object
      const lockedObj = objects.find(o => o.isLocked) || objects[0];

      // RENDER DETECTED OBJECTS & AR EFFECTS
      objects.forEach(obj => {
        const isTarget = obj.id === lockedObj?.id;
        const [normX, normY, normW, normH] = obj.bbox;

        // Base box pixel coordinates
        let boxX = normX * w;
        let boxY = normY * h;
        let boxW = normW * w;
        let boxH = normH * h;

        // Reality Manipulation Modifiers
        const { gravity, color, scale, timeFrozen, dissolved } = obj.realityState;

        // Gravity = OFF -> Floating Drift
        if (!gravity) {
          boxY += Math.sin(t * 3.5) * 24 - 15;
          boxX += Math.cos(t * 2.5) * 10;
        }

        // Scale = 300% -> Smooth Enlargement
        let currentScale = 1.0;
        if (scale > 1.0) {
          currentScale = scale;
          const cx = boxX + boxW / 2;
          const cy = boxY + boxH / 2;
          boxW *= currentScale;
          boxH *= currentScale;
          boxX = cx - boxW / 2;
          boxY = cy - boxH / 2;
        }

        // If dissolved, render disintegration explosion
        if (dissolved) {
          ctx.save();
          ctx.strokeStyle = '#ff007f';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(boxX, boxY, boxW, boxH);
          ctx.restore();

          // Spawn dissolve particles
          for (let p = 0; p < 3; p++) {
            particlesRef.current.push({
              x: boxX + Math.random() * boxW,
              y: boxY + Math.random() * boxH,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 6 - 2,
              size: Math.random() * 4 + 1.5,
              color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f',
              alpha: 1.0,
              life: 0,
              maxLife: 60
            });
          }
          return;
        }

        // Color Shader Palette
        const primaryColor = color === 'purple' ? '#b026ff' : '#00f3ff';
        const secondaryColor = color === 'purple' ? '#ff007f' : '#b026ff';

        ctx.save();

        // 1. Draw Bounding Box & Outer Glow
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = isTarget ? 20 : 8;
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = isTarget ? 2.5 : 1.5;

        // Draw HUD Corner Brackets
        const bracketLen = Math.min(boxW, boxH) * 0.2;
        
        // Top-Left Corner
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + bracketLen);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + bracketLen, boxY);
        ctx.stroke();

        // Top-Right Corner
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - bracketLen, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + bracketLen);
        ctx.stroke();

        // Bottom-Left Corner
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - bracketLen);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + bracketLen, boxY + boxH);
        ctx.stroke();

        // Bottom-Right Corner
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - bracketLen, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - bracketLen);
        ctx.stroke();

        // Semi-transparent glass fill
        ctx.fillStyle = color === 'purple' ? 'rgba(176, 38, 255, 0.08)' : 'rgba(0, 243, 255, 0.06)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // 2. Animated Holographic Grid/Scanline Shader if purple or locked
        if (!timeFrozen) {
          const scanY = boxY + ((t * 120) % boxH);
          ctx.strokeStyle = secondaryColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(boxX, scanY);
          ctx.lineTo(boxX + boxW, scanY);
          ctx.stroke();
        }

        // Holographic Mesh Pattern if Purple Color Gesture Active
        if (color === 'purple') {
          ctx.save();
          ctx.strokeStyle = 'rgba(176, 38, 255, 0.25)';
          ctx.lineWidth = 1;
          const cols = 6;
          const rows = 6;
          for (let c = 1; c < cols; c++) {
            ctx.beginPath();
            ctx.moveTo(boxX + (boxW / cols) * c, boxY);
            ctx.lineTo(boxX + (boxW / cols) * c, boxY + boxH);
            ctx.stroke();
          }
          for (let r = 1; r < rows; r++) {
            ctx.beginPath();
            ctx.moveTo(boxX, boxY + (boxH / rows) * r);
            ctx.lineTo(boxX + boxW, boxY + (boxH / rows) * r);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 3. Object Header Tag & Target Lock Badge
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 11px monospace';

        if (isTarget) {
          ctx.fillRect(boxX, boxY - 24, 130, 20);
          ctx.fillStyle = '#000';
          ctx.fillText('TARGET LOCKED', boxX + 8, boxY - 10);

          // Sub-label with Object Name & Confidence %
          ctx.fillStyle = primaryColor;
          ctx.fillText(`${obj.label} [${Math.round(obj.confidence * 100)}%]`, boxX, boxY + boxH + 16);
          if (scale > 1.0) {
            ctx.fillStyle = '#ff007f';
            ctx.fillText(`SCALE 300% (3.0x)`, boxX + boxW - 120, boxY + boxH + 16);
          }
        } else {
          ctx.fillText(`${obj.label} ${Math.round(obj.confidence * 100)}%`, boxX + 4, boxY - 8);
        }

        // 4. Particle Generation around Target Object
        if (isTarget && !timeFrozen && Math.random() > 0.4) {
          particlesRef.current.push({
            x: boxX + Math.random() * boxW,
            y: boxY + Math.random() * boxH,
            vx: (Math.random() - 0.5) * 1.5,
            vy: gravity ? -Math.random() * 2.0 : -Math.random() * 3.5 - 1.0,
            size: Math.random() * 3 + 1,
            color: primaryColor,
            alpha: 1.0,
            life: 0,
            maxLife: 45
          });
        }

        // 5. Time Frozen Overlay Badge
        if (timeFrozen) {
          ctx.fillStyle = 'rgba(0, 243, 255, 0.9)';
          ctx.font = 'bold 14px monospace';
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#00f3ff';
          ctx.fillText('⚡ TIME FROZEN', boxX + boxW / 2 - 60, boxY + boxH / 2);
        }

        ctx.restore();
      });

      // UPDATE AND DRAW FLOATING PARTICLES
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(idx, 1);
        }
      });

      // DRAW HAND LANDMARKS AND FINGER POINTER RETICLE
      if (rawLandmarks && rawLandmarks.length > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
        ctx.lineWidth = 1.5;

        // Draw connections between key hand landmarks
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // Index
          [5, 9], [9, 10], [10, 11], [11, 12], // Middle
          [9, 13], [13, 14], [14, 15], [15, 16], // Ring
          [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
          [0, 17]
        ];

        connections.forEach(([i, j]) => {
          const pt1 = rawLandmarks[i];
          const pt2 = rawLandmarks[j];
          if (pt1 && pt2) {
            ctx.beginPath();
            ctx.moveTo(pt1.x * w, pt1.y * h);
            ctx.lineTo(pt2.x * w, pt2.y * h);
            ctx.stroke();
          }
        });

        // Draw Dots on Joint Nodes
        rawLandmarks.forEach(pt => {
          ctx.fillStyle = '#00f3ff';
          ctx.beginPath();
          ctx.arc(pt.x * w, pt.y * h, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      // DRAW INTERACTIVE POINTER RETICLE (when pointing or moving)
      if (pointerPos) {
        const px = pointerPos.x * w;
        const py = pointerPos.y * h;

        ctx.save();
        ctx.strokeStyle = activeGesture === 'POINTING_FINGER' ? '#ff007f' : '#00f3ff';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;

        // Target Reticle Rings
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(px - 22, py);
        ctx.lineTo(px - 14, py);
        ctx.moveTo(px + 14, py);
        ctx.lineTo(px + 22, py);
        ctx.moveTo(px, py - 22);
        ctx.lineTo(px, py - 14);
        ctx.moveTo(px, py + 14);
        ctx.lineTo(px, py + 22);
        ctx.stroke();

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [objects, activeGesture, pointerPos, rawLandmarks]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};
