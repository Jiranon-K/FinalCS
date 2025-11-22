'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { useCameraContext } from '@/contexts/CameraContext';
import Loading from '@/components/ui/Loading';

export default function CameraView() {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { 
    stream,
    isStreaming, 
    isLoading,
    selectedDeviceId, 
    devices, 
    error,
    startCamera, 
    stopCamera, 
    setSelectedDeviceId 
  } = useCameraContext();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (isStreaming && selectedDeviceId) {
      startCamera(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  return (
    <div className="flex flex-col h-full w-full gap-4">
      <div className="bg-base-200/20 rounded-2xl shadow-lg border border-base-content/10">
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">
                {t.nav.camera}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-base-content/60">1920 × 1080</span>
                {devices.length > 0 && (
                  <>
                    <span className="text-xs text-base-content/40">•</span>
                    <span className="text-xs text-base-content/60">
                      {devices.length} {devices.length === 1 ? t.camera.device : t.camera.devices}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              className="select select-bordered select-sm bg-base-100/20 min-w-[180px]"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={devices.length === 0}
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
            
            {!isStreaming ? (
              <button 
                className="btn btn-primary btn-sm gap-2"
                onClick={() => startCamera()}
                disabled={!selectedDeviceId}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
                {t.camera.start}
              </button>
            ) : (
              <button 
                className="btn btn-error btn-sm gap-2"
                onClick={stopCamera}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                </svg>
                {t.camera.stop}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 min-h-[600px] relative bg-base-200/20 rounded-2xl overflow-hidden shadow-lg border border-base-content/10">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-200/50 backdrop-blur-sm z-10">
            <Loading variant="spinner" size="lg" text="Initializing Camera..." />
          </div>
        )}
        
        {!isStreaming && !error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-200/20">
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-32 h-32 text-base-content/20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-4 bg-primary/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-primary animate-pulse">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-base-content/80">
                  {t.camera.cameraReady}
                </p>
                <p className="text-sm text-base-content/50">
                  {t.camera.clickStartToBegin}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isStreaming && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-error/20 backdrop-blur-sm text-error-content px-3 py-1.5 rounded-full border border-error/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
            </span>
            <span className="text-xs font-bold">{t.camera.live}</span>
          </div>
        )}
      </div>
    </div>
  );
}
