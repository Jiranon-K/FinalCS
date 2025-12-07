'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { useCameraContext } from '@/contexts/CameraContext';
import { useFaceAPI } from '@/hooks/useFaceAPI';
import { useToast } from '@/hooks/useToast';
import Loading from '@/components/ui/Loading';
import LivenessCheck from '@/components/liveness/LivenessCheck';
import type { FaceDetectionResult } from '@/types/face';
import type { PersonForRecognition } from '@/types/person';
import type { AttendanceSession } from '@/types/session';

interface CameraViewProps {
  activeSessions: AttendanceSession[];
  onAttendanceRecorded: () => void;
}

export default function CameraView({ activeSessions, onAttendanceRecorded }: CameraViewProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const pendingRecordsRef = useRef<Set<string>>(new Set());
  const lastRecordTimeRef = useRef<Map<string, number>>(new Map());

  const [detectedFaces, setDetectedFaces] = useState<FaceDetectionResult[]>([]);
  const faceDetectionEnabled = true;
  const [recognizedPersons, setRecognizedPersons] = useState<Map<number, { name: string; confidence: number; id?: string }>>(new Map());
  const [knownPersons, setKnownPersons] = useState<PersonForRecognition[]>([]);

  const [lastAttendanceRecord, setLastAttendanceRecord] = useState<Map<string, Date>>(new Map());
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [pendingPerson, setPendingPerson] = useState<{ id: string; name: string } | null>(null);

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

  const { modelsLoaded, detectFaces, recognizeFace, settings, updateSettings } = useFaceAPI();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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

    if (modelsLoaded) {
      loadKnownPersons();
    }
  }, [modelsLoaded]);

  const recordAttendance = async (personId: string, personName: string) => {
    if (activeSessions.length === 0) return;

    if (pendingRecordsRef.current.has(personId)) {
      return;
    }

    const now = Date.now();
    const lastTime = lastRecordTimeRef.current.get(personId);
    if (lastTime && (now - lastTime) < 30 * 1000) {
      return;
    }

    pendingRecordsRef.current.add(personId);
    lastRecordTimeRef.current.set(personId, now);

    setLastAttendanceRecord(prev => new Map(prev).set(personId, new Date(now)));

    let recorded = false;

    for (const session of activeSessions) {
      try {
        const response = await fetch('/api/attendance/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: personId,
            sessionId: session._id || session.id,
            timestamp: new Date(now).toISOString(),
            confidence: 0.9,
            method: 'face_recognition',
          }),
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();

        if (data.success) {
          if (data.isNewCheckIn) {
            recorded = true;
            showToast({ type: 'success', message: `✅ ${t.attendanceManagement?.recordSuccess || 'บันทึกการเข้าเรียนสำเร็จ'}: ${personName}` });
          }
        } else if (data.error === 'Student is not enrolled in this course') {
          continue;
        }
      } catch (err) {
        console.error('Error recording attendance:', err);
      }
    }

    pendingRecordsRef.current.delete(personId);

    if (recorded) {
      onAttendanceRecorded();
    }
  };

  const handleLivenessVerified = () => {
    if (pendingPerson) {
      recordAttendance(pendingPerson.id, pendingPerson.name);
    }
    setShowLivenessCheck(false);
    setPendingPerson(null);
  };

  const handleLivenessFailed = () => {
    showToast({ type: 'error', message: t.liveness?.failed || 'Verification Failed' });
    setShowLivenessCheck(false);
    setPendingPerson(null);
  };

  useEffect(() => {
    if (!isStreaming || !faceDetectionEnabled || !modelsLoaded || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
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
          setDetectedFaces(faces);

          const recognitionMap = new Map<number, { name: string; confidence: number; id?: string }>();

          for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            if (face.descriptor && knownPersons.length > 0) {
              const match = recognizeFace(face.descriptor, knownPersons);
              if (match) {
                recognitionMap.set(i, {
                  name: match.personName,
                  confidence: match.confidence,
                  id: match.personId
                });
                
                if (match.confidence > 0.45 && match.personId) {
                    if (!showLivenessCheck) {
                      setPendingPerson({ id: match.personId, name: match.personName });
                      setShowLivenessCheck(true);
                    }
                }

              } else {
                recognitionMap.set(i, {
                  name: 'Unknown',
                  confidence: 0
                });
              }
            }
          }
          setRecognizedPersons(recognitionMap);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            faces.forEach((face, index) => {
              const { box } = face.detection;
              const recognized = recognitionMap.get(index);

              const isKnown = recognized && recognized.name !== 'Unknown';
              let isCheckedIn = false;
              
              if (isKnown && recognized.id) {
                const lastRecord = lastAttendanceRecord.get(recognized.id);
                if (lastRecord) {
                   isCheckedIn = true;
                }
              }

              const boxColor = isCheckedIn ? '#3b82f6' : (isKnown ? '#10b981' : '#ef4444');
              const bgColor = isCheckedIn ? '#3b82f6' : (isKnown ? '#10b981' : '#ef4444');

              ctx.strokeStyle = boxColor;
              ctx.lineWidth = 3;
              ctx.strokeRect(box.x, box.y, box.width, box.height);

              let label = '';
              if (isKnown) {
                label = `${recognized.name} (${(recognized.confidence * 100).toFixed(1)}%)`;
              } else {
                label = `Unknown (${(face.detection.score * 100).toFixed(1)}%)`;
              }

              ctx.font = 'bold 16px sans-serif';
              const textWidth = ctx.measureText(label).width;
              const padding = 10;
              const labelHeight = 28;

              ctx.fillStyle = bgColor;
              ctx.fillRect(box.x, box.y - labelHeight - 5, textWidth + padding * 2, labelHeight);

              ctx.fillStyle = '#ffffff';
              ctx.fillText(label, box.x + padding, box.y - 12);

              if (isCheckedIn) {
                 const badgeText = "✓ Checked In";
                 const badgeWidth = ctx.measureText(badgeText).width;
                 
                 ctx.fillStyle = '#2563eb';
                 ctx.fillRect(box.x, box.y + box.height + 5, badgeWidth + padding * 2, labelHeight);
                 
                 ctx.fillStyle = '#ffffff';
                 ctx.fillText(badgeText, box.x + padding, box.y + box.height + 24);
              }

              if (face.landmarks) {
                ctx.fillStyle = '#00ffcc'; 
                face.landmarks.positions.forEach((point) => {
                  ctx.beginPath();
                  ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
                  ctx.fill();
                });
              }
            });
          }
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
    };

    detectionIntervalRef.current = window.setInterval(runDetection, 200);

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isStreaming, faceDetectionEnabled, modelsLoaded, detectFaces, recognizeFace, knownPersons, activeSessions, lastAttendanceRecord, showLivenessCheck]);

  return (
    <div className="flex flex-col h-full w-full gap-4">
      <div className="bg-base-200/20 rounded-2xl shadow-lg border border-base-content/10">
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <div className="dropdown dropdown-end">
              <div 
                tabIndex={0} 
                role="button" 
                className={`btn btn-sm bg-base-100/20 border-base-content/20 w-full sm:w-auto sm:min-w-[180px] max-w-none sm:max-w-60 h-auto py-2 sm:py-1 justify-between font-normal ${isStreaming ? 'btn-disabled opacity-50' : ''}`}
              >
                <div className="flex flex-col items-start text-left overflow-hidden w-full mr-2">
                  <span className="font-bold text-xs truncate w-full">
                    {settings.detectorModel === 'ssd_mobilenetv1' && t.faceSettings.ssdMobilenetName}
                    {settings.detectorModel === 'tiny_face_detector' && t.faceSettings.tinyFaceDetectorName}
                  </span>
                  <span className="text-[10px] opacity-70 truncate w-full">
                    {settings.detectorModel === 'ssd_mobilenetv1' && t.faceSettings.ssdMobilenetDesc}
                    {settings.detectorModel === 'tiny_face_detector' && t.faceSettings.tinyFaceDetectorDesc}
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 opacity-50 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              <ul tabIndex={0} className="dropdown-content z-1 menu p-2 shadow-lg bg-base-100 rounded-box w-64 mt-1 border border-base-content/10">
                <li>
                  <button 
                    onClick={() => {
                      updateSettings({ detectorModel: 'ssd_mobilenetv1' });
                      const elem = document.activeElement as HTMLElement;
                      if (elem) elem.blur();
                    }}
                    className={`flex flex-col items-start gap-0.5 py-2 ${settings.detectorModel === 'ssd_mobilenetv1' ? 'active' : ''}`}
                  >
                    <span className="font-bold text-xs">{t.faceSettings.ssdMobilenetName}</span>
                    <span className="text-[10px] opacity-70 truncate block w-full">{t.faceSettings.ssdMobilenetDesc}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      updateSettings({ detectorModel: 'tiny_face_detector' });
                      const elem = document.activeElement as HTMLElement;
                      if (elem) elem.blur();
                    }}
                    className={`flex flex-col items-start gap-0.5 py-2 ${settings.detectorModel === 'tiny_face_detector' ? 'active' : ''}`}
                  >
                    <span className="font-bold text-xs">{t.faceSettings.tinyFaceDetectorName}</span>
                    <span className="text-[10px] opacity-70 truncate block w-full">{t.faceSettings.tinyFaceDetectorDesc}</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="dropdown dropdown-end">
              <div 
                tabIndex={0} 
                role="button" 
                className={`btn btn-sm bg-base-100/20 border-base-content/20 w-full sm:w-auto sm:min-w-[180px] max-w-none sm:max-w-60 h-auto py-2 sm:py-1 justify-between font-normal ${devices.length === 0 || isStreaming ? 'btn-disabled opacity-50' : ''}`}
              >
                <div className="flex flex-col items-start text-left overflow-hidden w-full mr-2">
                  <span className="font-bold text-xs truncate w-full">
                    {devices.find(d => d.deviceId === selectedDeviceId)?.label || t.camera.selectDevice || 'Select Device'}
                  </span>
                  <span className="text-[10px] opacity-70 truncate w-full">
                    {t.camera.camera} {devices.findIndex(d => d.deviceId === selectedDeviceId) + 1}
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 opacity-50 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              <ul tabIndex={0} className="dropdown-content z-1 menu p-2 shadow-lg bg-base-100 rounded-box w-64 mt-1 border border-base-content/10">
                {devices.map((device, index) => (
                  <li key={device.deviceId}>
                    <button 
                      onClick={() => {
                        setSelectedDeviceId(device.deviceId);
                        const elem = document.activeElement as HTMLElement;
                        if (elem) elem.blur();
                      }}
                      className={`flex flex-col items-start gap-0.5 py-2 ${selectedDeviceId === device.deviceId ? 'active' : ''}`}
                    >
                      <span className="font-bold text-xs truncate block w-full">{device.label}</span>
                      <span className="text-[10px] opacity-70 truncate block w-full">{t.camera.camera} {index + 1}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {!isStreaming ? (
              <button
                className="btn btn-primary btn-sm gap-2 w-full sm:w-auto"
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
                className="btn btn-error btn-sm gap-2 w-full sm:w-auto"
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

      {showLivenessCheck && detectedFaces.length > 0 && (
        <LivenessCheck
          detectedFace={detectedFaces[0]}
          onVerified={handleLivenessVerified}
          onFailed={handleLivenessFailed}
        />
      )}

      <div className="flex-1 min-h-[350px] lg:min-h-[600px] relative bg-base-200/20 rounded-2xl overflow-hidden shadow-lg border border-base-content/10 flex items-center justify-center bg-black">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full w-auto h-auto"
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>


        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-200/50 backdrop-blur-sm z-10">
            <Loading variant="spinner" size="lg" text="Initializing Camera..." />
          </div>
        )}
        
        {!isStreaming && !error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-200 backdrop-blur-sm">
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
          <>
            <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-error/20 backdrop-blur-sm text-error-content px-3 py-1.5 rounded-full border border-error/20 w-fit">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
                  </span>
                  <span className="text-xs font-bold">{t.camera.live}</span>
                </div>

            {faceDetectionEnabled && modelsLoaded && (
              <>
                <div className="flex items-center gap-2 bg-success/20 backdrop-blur-sm text-success-content px-3 py-1.5 rounded-lg border border-success/20 w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-bold">
                    {detectedFaces.length} {detectedFaces.length === 1 ? 'Face' : 'Faces'} Detected
                  </span>
                </div>

                {detectedFaces.length > 0 && recognizedPersons.size > 0 && (
                  <>
                    <div className="flex items-center gap-2 bg-primary/20 backdrop-blur-sm text-primary-content px-3 py-1.5 rounded-lg border border-primary/20 w-fit">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-bold">
                        {Array.from(recognizedPersons.values()).filter(p => p.name !== 'Unknown').length} Known
                      </span>
                    </div>
                    {Array.from(recognizedPersons.values()).filter(p => p.name === 'Unknown').length > 0 && (
                      <div className="flex items-center gap-2 bg-error/20 backdrop-blur-sm text-error-content px-3 py-1.5 rounded-lg border border-error/20 w-fit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold">
                          {Array.from(recognizedPersons.values()).filter(p => p.name === 'Unknown').length} Unknown
                        </span>
                      </div>
                    )}
                  </>
                )}

                {!modelsLoaded && (
                  <div className="flex items-center gap-2 bg-warning/20 backdrop-blur-sm text-warning-content px-3 py-1.5 rounded-lg border border-warning/20 w-fit">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs font-bold">Loading AI Models...</span>
                  </div>
                )}
              </>
            )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
