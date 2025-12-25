'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faCheckCircle, faExclamationTriangle, faTrash } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceAPIModule = any;

interface FaceUploadProps {
  onFaceDetected: (imageFile: File, faceDescriptors: number[][], mainImage: string) => void;
  onImageRemove: () => void;
  currentImage: string | null;
}

export default function FaceUpload({
  onFaceDetected,
  onImageRemove,
  currentImage,
}: FaceUploadProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [descriptors, setDescriptors] = useState<number[][]>([]);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelsLoadedRef = useRef(false);
  const faceapiRef = useRef<FaceAPIModule | null>(null);


  const captureSteps = useMemo(() => [
    { id: 'center', label: t.register.faceSteps.center, instruction: t.register.faceSteps.centerInstruction },
    { id: 'left', label: t.register.faceSteps.left, instruction: t.register.faceSteps.leftInstruction },
    { id: 'right', label: t.register.faceSteps.right, instruction: t.register.faceSteps.rightInstruction },
    { id: 'up', label: t.register.faceSteps.up, instruction: t.register.faceSteps.upInstruction },
    { id: 'down', label: t.register.faceSteps.down, instruction: t.register.faceSteps.downInstruction },
  ], [t]);

  useEffect(() => {
    const loadModels = async () => {
      if (modelsLoadedRef.current) return;

      try {
        const [tf, faceapi] = await Promise.all([
          import('@tensorflow/tfjs'),
          import('@vladmandic/face-api')
        ]);

        faceapiRef.current = faceapi;

        await tf.ready();

        const MODEL_URL = '/model';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (!modelsLoadedRef.current) {
          modelsLoadedRef.current = true;
          setModelsLoaded(true);
          showToast({
            type: 'success',
            message: t.faceDetection.loadingModels + ' ' + t.toasts.operationSuccess,
            duration: 2000,
          });
        }
      } catch (error) {
        console.error('Error loading face detection models:', error);
        setDetectionError(t.faceDetection.loadingModels + ' failed');
        if (!modelsLoadedRef.current) {
          showToast({
            type: 'error',
            message: t.faceDetection.loadingModels + ' ' + t.toasts.operationError,
            duration: 4000,
          });
        }
      }
    };

    loadModels();
  }, [t, showToast]);


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validateFacePose = (landmarks: any, stepId: string): { isValid: boolean; error?: string } => {
    const nose = landmarks.getNose()[3];
    const leftEye = landmarks.getLeftEye()[0];
    const rightEye = landmarks.getRightEye()[3];
    const jaw = landmarks.getJawOutline();
    const leftJaw = jaw[0];
    const rightJaw = jaw[16];
    const chin = jaw[8];
    

    const distToLeftJaw = Math.abs(nose.x - leftJaw.x);
    const distToRightJaw = Math.abs(nose.x - rightJaw.x);
    const yawRatio = distToLeftJaw / (distToLeftJaw + distToRightJaw);



    const faceHeight = Math.abs(chin.y - (leftEye.y + rightEye.y) / 2);
    const noseYRelative = (nose.y - (leftEye.y + rightEye.y) / 2) / faceHeight;

    switch (stepId) {
      case 'center':
        if (yawRatio < 0.4 || yawRatio > 0.6) return { isValid: false, error: t.register.validation.centerError };
        return { isValid: true };
      
      case 'left':

        if (yawRatio > 0.45) return { isValid: false, error: t.register.validation.leftError };
        return { isValid: true };
      
      case 'right':

        if (yawRatio < 0.55) return { isValid: false, error: t.register.validation.rightError };
        return { isValid: true };

      case 'up':

        if (noseYRelative > 0.35) return { isValid: false, error: t.register.validation.upError };
        return { isValid: true };

      case 'down':

         if (noseYRelative < 0.45) return { isValid: false, error: t.register.validation.downError };
        return { isValid: true };
        
      default:
        return { isValid: true };
    }
  };

  const detectFace = async (file: File) => {
    const faceapi = faceapiRef.current;

    if (!modelsLoaded || !faceapi) {
      setDetectionError(t.faceDetection.loadingModels);
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      const img = await faceapi.bufferToImage(blob);

      const detections = await faceapi
        .detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setDetectionError(t.faceDetection.noFaceDetected);
        return;
      }

      if (detections.length > 1) {
        setDetectionError(t.faceDetection.multipleFacesDetected);
        return;
      }

      const detection = detections[0];
      const landmarks = detection.landmarks;
      

      const currentStep = captureSteps[currentStepIndex];
      const poseValidation = validateFacePose(landmarks, currentStep.id);
      
      if (!poseValidation.isValid) {
         setDetectionError(poseValidation.error || t.register.validation.invalidPose);
         return;
      }

      const descriptor = Array.from(detection.descriptor) as number[];
      
      const newDescriptors = [...descriptors, descriptor];
      setDescriptors(newDescriptors);
      

      if (currentStepIndex === 0) {
        setMainImageFile(file);
      }


      if (currentStepIndex === captureSteps.length - 1) {

         const reader = new FileReader();
         reader.onloadend = () => {
             onFaceDetected(mainImageFile || file, newDescriptors, reader.result as string);
         };
         reader.readAsDataURL(mainImageFile || file);
      } else {

         setCurrentStepIndex(prev => prev + 1);
         showToast({ message: t.register.faceSteps.nextStep, type: 'success' });
      }

    } catch (error) {
      console.error('Face detection error:', error);
      setDetectionError(t.faceDetection.noFaceDetected);
    } finally {
      setIsDetecting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDetectionError(t.register.invalidFileType);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setDetectionError(t.register.fileTooLarge);
      return;
    }

    await detectFace(file);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setDescriptors([]);
    setMainImageFile(null);
    setDetectionError(null);
    onImageRemove();
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const currentStep = captureSteps[currentStepIndex];
  const isComplete = currentImage !== null;

  return (
    <div className="space-y-6">
       

       <div className="flex justify-between items-center w-full px-2">
            {captureSteps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                        ${index < currentStepIndex || isComplete ? 'bg-success text-white' : 
                          index === currentStepIndex ? 'bg-primary text-white' : 'bg-base-200 text-base-content/30'}
                    `}>
                        {index < currentStepIndex || isComplete ? <FontAwesomeIcon icon={faCheckCircle} /> : index + 1}
                    </div>
                    <span className="text-xs opacity-70 hidden md:block">{step.label}</span>
                </div>
            ))}
       </div>

      <div className="card bg-base-200/50 border-2 border-dashed border-base-300">
        <div className="card-body items-center text-center py-10">
            
            {isComplete ? (
                 <div className="relative w-64 h-64 rounded-xl overflow-hidden shadow-lg mb-4">
                    <Image
                        src={currentImage}
                        alt="Face preview"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="badge badge-success gap-2 p-3">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            {t.register.faceSteps.completed}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl">
                        <FontAwesomeIcon icon={faUpload} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{currentStep.label}</h3>
                        <p className="text-base-content/60">{currentStep.instruction}</p>
                    </div>
                </div>
            )}

            {isDetecting && (
                <div className="absolute inset-0 bg-base-100/80 z-20 flex flex-col items-center justify-center rounded-xl">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 font-medium">{t.register.detectingFace}</p>
                </div>
            )}

            <div className="flex gap-3">
                {!isComplete && (
                     <label className={`btn btn-primary btn-lg ${!modelsLoaded ? 'btn-disabled' : ''}`}>
                        {modelsLoaded ? t.register.uploadImage : t.faceDetection.loadingModels + '...'}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={!modelsLoaded || isDetecting}
                        />
                    </label>
                )}
               
                {(currentStepIndex > 0 || isComplete) && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-outline btn-error"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        {t.register.faceSteps.reset}
                    </button>
                )}
            </div>

            {detectionError && (
                <div className="alert alert-error mt-6 text-left max-w-md">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{detectionError}</span>
                </div>
            )}
            
        </div>
      </div>

       <div className="alert alert-info text-sm">
          <FontAwesomeIcon icon={faUpload} />
          <div>
            <h3 className="font-bold">{t.register.advice.title}</h3>
            <ul className="list-disc list-inside opacity-90 mt-1 space-y-1">
                <li>{t.register.advice.lighting}</li>
                <li>{t.register.advice.accessories}</li>
                <li>{t.register.advice.instructions}</li>
            </ul>
          </div>
        </div>

    </div>
  );
}
