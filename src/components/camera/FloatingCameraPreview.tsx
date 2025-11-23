'use client';

import { useCameraContext } from '@/contexts/CameraContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import Loading from '@/components/ui/Loading';

export default function FloatingCameraPreview() {
  const { t } = useLocale();
  const { stream, isStreaming, isLoading, stopCamera } = useCameraContext();
  const pathname = usePathname();
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const isVisible = isStreaming && pathname !== '/camera';

  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
  }, [stream, isVisible]);

  const handleClick = () => {
    router.push('/camera');
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopCamera();
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 group cursor-pointer transition-all duration-300 hover:scale-105"
      onClick={handleClick}
    >
      <div className="relative bg-base-200/20 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border border-base-content/10">
        <div className="relative w-64 h-36">
          <video 
            ref={localVideoRef}
            autoPlay 
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-base-200/50 backdrop-blur-sm z-10">
              <Loading variant="spinner" size="sm" />
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-error/20 backdrop-blur-sm text-error-content px-2 py-1 rounded-full border border-error/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
            <span className="text-xs font-bold">{t.camera.live}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-base-300/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-base-content/80 font-medium">{t.camera.clickToView}</span>
              <button
                onClick={handleStop}
                className="btn btn-error btn-xs gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                </svg>
                {t.camera.stop}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

