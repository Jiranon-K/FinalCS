'use client';

import { useEffect } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { useLiveness } from '@/hooks/useLiveness';
import type { FaceDetectionResult } from '@/types/face';

interface LivenessCheckProps {
  detectedFace: FaceDetectionResult | null;
  onVerified: () => void;
  onFailed: () => void;
}

export default function LivenessCheck({
  detectedFace,
  onVerified,
  onFailed,
}: LivenessCheckProps) {
  const { t } = useLocale();
  const { state, settings, startVerification, processFrame, resetVerification } = useLiveness();

  useEffect(() => {
    resetVerification();
    const timer = setTimeout(() => {
      startVerification();
    }, 1000);
    return () => clearTimeout(timer);
  }, [resetVerification, startVerification]);

  useEffect(() => {
    if (state.isActive && detectedFace?.landmarks?.positions) {
      processFrame(detectedFace.landmarks.positions);
    }
  }, [detectedFace, state.isActive, processFrame]);

  useEffect(() => {
    if (state.isVerified) {
      onVerified();
    }
  }, [state.isVerified, onVerified]);

  useEffect(() => {
    if (state.failedAttempts >= settings.maxFailedAttempts) {
      onFailed();
      resetVerification();
    }
  }, [state.failedAttempts, settings.maxFailedAttempts, onFailed, resetVerification]);

  const getProgressPercentage = () => {
    return Math.min((state.blinkCount / settings.requiredBlinks) * 100, 100);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
      
      <div className="relative w-full max-w-lg p-6 flex flex-col items-center gap-8 pointer-events-auto">
        {!state.isActive && !state.isVerified && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
            <div className="p-4 rounded-full bg-base-100/20 backdrop-blur-md border border-white/20 shadow-xl">
              <span className="text-6xl animate-pulse">👤</span>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white drop-shadow-md">
                {t.liveness?.title || 'Liveness Check'}
              </h2>
              <p className="text-white/80 text-lg font-medium drop-shadow-sm">
                {t.liveness?.['preparing' as keyof typeof t.liveness] || 'Preparing verification...'}
              </p>
            </div>
          </div>
        )}

        {state.isActive && state.currentChallenge && (
          <div className="w-full flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="alert bg-base-100/30 backdrop-blur-md border-white/20 text-white shadow-xl max-w-sm">
              <span className="text-2xl animate-pulse">👁️</span>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {state.currentChallenge.instruction}
                </h3>
                <div className="text-xs opacity-80">
                  {t.liveness?.progress || 'Progress'}: {state.blinkCount}/{settings.requiredBlinks}
                </div>
              </div>
            </div>

            <div className="w-64 h-64 relative flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-dashed border-white/30 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-0 border-4 border-primary/50 rounded-full" style={{ clipPath: `inset(${100 - getProgressPercentage()}% 0 0 0)` }} />
              
              <div className="flex flex-col items-center gap-2 text-white drop-shadow-md">
                <span className="text-5xl font-black tracking-tighter">
                  {Math.round(getProgressPercentage())}%
                </span>
                <span className={`badge ${state.isBlinking ? 'badge-warning' : 'badge-success'} badge-lg glass`}>
                  {state.isBlinking ? (t.liveness?.blinking || 'Blinking') : (t.liveness?.eyeOpen || 'Eyes Open')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {Array.from({ length: settings.requiredBlinks }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    i < state.blinkCount 
                      ? 'bg-success scale-110 shadow-[0_0_10px_rgba(34,197,94,0.8)]' 
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {state.isVerified && (
          <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
            <div className="w-24 h-24 rounded-full bg-success/20 backdrop-blur-md border border-success/40 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
              <span className="text-6xl animate-bounce">✅</span>
            </div>
            <h2 className="text-3xl font-bold text-white drop-shadow-md">
              {t.liveness?.verified || 'Verified!'}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}