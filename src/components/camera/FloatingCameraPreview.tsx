'use client';

import { useCameraContext } from '@/contexts/CameraContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { useFaceAPI } from '@/hooks/useFaceAPI';
import Loading from '@/components/ui/Loading';
import type { PersonForRecognition } from '@/types/person';

export default function FloatingCameraPreview() {
  const { t } = useLocale();
  const { stream, isStreaming, isLoading, stopCamera } = useCameraContext();
  const pathname = usePathname();
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const [knownPersons, setKnownPersons] = useState<PersonForRecognition[]>([]);

  const { modelsLoaded, detectFaces, recognizeFace } = useFaceAPI();

  const isVisible = isStreaming && pathname !== '/camera';

  useEffect(() => {
    const loadKnownPersons = async () => {
      try {
        const response = await fetch('/api/faces');
        const data = await response.json();
        if (data.success) {
          setKnownPersons(data.data);
        }
      } catch (err) {
        console.error('Error loading known persons:', err);
      }
    };

    if (modelsLoaded && isVisible) {
      loadKnownPersons();
    }
  }, [modelsLoaded, isVisible]);

  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
  }, [stream, isVisible]);

  useEffect(() => {
    if (!isVisible || !modelsLoaded || !localVideoRef.current || !canvasRef.current) {
      return;
    }

    const video = localVideoRef.current;
    const canvas = canvasRef.current;

    const updateCanvasSize = () => {
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    video.addEventListener('loadedmetadata', updateCanvasSize);
    updateCanvasSize();

    const runDetection = async () => {
      try {
        if (video.readyState === 4) {
          const faces = await detectFaces(video);


          const recognitionMap = new Map<number, { name: string; confidence: number }>();

          for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            if (face.descriptor && knownPersons.length > 0) {
              const match = recognizeFace(face.descriptor, knownPersons);
              if (match) {
                recognitionMap.set(i, {
                  name: match.personName,
                  confidence: match.confidence
                });
              } else {
                recognitionMap.set(i, {
                  name: 'Unknown',
                  confidence: 0
                });
              }
            }
          }
          // setRecognizedPersons removed as it's not used for rendering


          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            faces.forEach((face, index) => {
              const { box } = face.detection;
              const recognized = recognitionMap.get(index);

              const isKnown = recognized && recognized.name !== 'Unknown';
              const boxColor = isKnown ? '#10b981' : '#ef4444';
              const bgColor = isKnown ? '#10b981' : '#ef4444';

              ctx.strokeStyle = boxColor;
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);

              let label = '';
              if (isKnown) {
                label = `${recognized.name} (${(recognized.confidence * 100).toFixed(1)}%)`;
              } else {
                label = `${t.camera.unknown || 'Unknown'} (${(face.detection.score * 100).toFixed(1)}%)`;
              }

              ctx.font = 'bold 12px sans-serif';
              const textWidth = ctx.measureText(label).width;
              const padding = 6;
              const labelHeight = 20;

              ctx.fillStyle = bgColor;
              ctx.fillRect(box.x, box.y - labelHeight - 3, textWidth + padding * 2, labelHeight);

              ctx.fillStyle = '#ffffff';
              ctx.fillText(label, box.x + padding, box.y - 8);
            });
          }
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
    };

    detectionIntervalRef.current = window.setInterval(runDetection, 300);

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isVisible, modelsLoaded, detectFaces, recognizeFace, knownPersons, t.camera.unknown]);

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
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
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

