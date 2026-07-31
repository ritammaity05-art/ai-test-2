// Live Camera Feed Component for TINO Reality Debugger
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface CameraLayerProps {
  onVideoReady?: (videoEl: HTMLVideoElement) => void;
}

export const CameraLayer: React.FC<CameraLayerProps> = ({ onVideoReady }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        if (onVideoReady) {
          onVideoReady(videoRef.current);
        }
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      const msg = err instanceof Error ? err.message : 'Webcam permission denied or device unavailable.';
      setError(msg);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black select-none pointer-events-none">
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          isCameraActive ? 'opacity-90' : 'opacity-20'
        }`}
      />

      {/* Grid Pattern Overlay for HUD Vibe */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#00f3ff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Camera Permission / Error Banner if blocked */}
      {error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-50">
          <div className="cyber-glass-panel p-6 max-w-md text-center border border-red-500/50 bg-black/80">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/40 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-wider">CAMERA FEED OFF-LINE</h3>
            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              {error}. Please allow camera access in your browser settings to initialize full AR tracking.
            </p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-xs tracking-widest font-mono border border-cyan-400/50 rounded-lg flex items-center justify-center mx-auto gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> RE-INIT CAMERA ENGINE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
