'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocale } from '@/i18n/LocaleContext';

interface VideoInputDevice {
  deviceId: string;
  label: string;
}

interface CameraContextType {
  stream: MediaStream | null;
  isStreaming: boolean;
  isLoading: boolean;
  selectedDeviceId: string;
  devices: VideoInputDevice[];
  error: string | null;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  setSelectedDeviceId: (id: string) => void;
  getDevices: () => Promise<void>;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

const FULL_HD_RESOLUTION = { width: 1920, height: 1080 };

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<VideoInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `${t.camera.camera} ${device.deviceId.slice(0, 5)}...`
        }));
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
      setError(t.camera.failedToGetDevices);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeviceId]);

  const startCamera = useCallback(async (deviceId?: string) => {
    const targetDeviceId = deviceId || selectedDeviceId;
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }


    
    setIsLoading(true);

    try {
      const constraints = {
        video: {
          deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
          width: { ideal: FULL_HD_RESOLUTION.width },
          height: { ideal: FULL_HD_RESOLUTION.height }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setIsStreaming(true);
      setError(null);
    } catch (err) {
      console.error("Error starting camera:", err);
      setError(t.camera.failedToStartCamera);
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeviceId, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(tempStream => {
        tempStream.getTracks().forEach(track => track.stop());
        getDevices();
      })
      .catch(err => {
        console.error("Permission denied:", err);
        setError(t.camera.permissionDenied);
      });
  }, [getDevices]);

  const value: CameraContextType = {
    stream,
    isStreaming,
    isLoading,
    selectedDeviceId,
    devices,
    error,
    startCamera,
    stopCamera,
    setSelectedDeviceId,
    getDevices,
  };

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
}

export function useCameraContext() {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCameraContext must be used within a CameraProvider');
  }
  return context;
}
