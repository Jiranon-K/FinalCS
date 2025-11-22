/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useCallback } from "react";

interface BenchmarkStudent {
  id: string;
  name: string;
  studentId?: string;
  imageUrl: string;
  faceDescriptor: number[];
}

interface SingleResult {
  studentId: string;
  studentName: string;
  imageUrl: string;
  model: string;
  faceDetected: boolean;
  identifiedCorrectly: boolean;
  matchedName: string | null;
  confidence: number;
  distance: number;
  processingTimeMs: number;
}

interface ModelSummary {
  model: string;
  totalTests: number;
  facesDetected: number;
  correctIdentifications: number;
  accuracy: number;
  precision: number;
  recall: number;
  avgProcessingTimeMs: number;
  avgConfidence: number;
}

const MODELS = ["ssd_mobilenetv1", "tiny_face_detector"] as const;
type DetectorModel = (typeof MODELS)[number];

const MODEL_LABELS: Record<DetectorModel, string> = {
  ssd_mobilenetv1: "SSD MobileNetV1",
  tiny_face_detector: "Tiny Face Detector",
};

export default function BenchmarkRunner() {
  const [students, setStudents] = useState<BenchmarkStudent[]>([]);
  const [results, setResults] = useState<SingleResult[]>([]);
  const [summaries, setSummaries] = useState<ModelSummary[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" });
  const [error, setError] = useState<string | null>(null);
  const [recognitionThreshold, setRecognitionThreshold] = useState(0.6);
  const [detectionThreshold, setDetectionThreshold] = useState(0.15);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"summary" | "detail">("summary");
  const [detailFilter, setDetailFilter] = useState<string>("all");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceapiRef = useRef<any>(null);


  const loadImageToCanvas = useCallback(
    async (url: string): Promise<HTMLCanvasElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Cannot get canvas context"));
              return;
            }
            ctx.drawImage(img, 0, 0);
          
            try {
              ctx.getImageData(0, 0, 1, 1);
            } catch {
              reject(new Error(`CORS: Cannot read pixel data from ${url}`));
              return;
            }
            resolve(canvas);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    },
    [],
  );

  const runBenchmark = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setResults([]);
    setSummaries([]);
    setActiveTab("summary");
    setImageErrors([]);

    try {
      setProgress({ current: 0, total: 0, phase: "กำลังโหลด face-api.js..." });
      const [tf, faceapi] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@vladmandic/face-api"),
      ]);

      try {
        await tf.setBackend("webgl");
      } catch {
        console.warn("WebGL backend failed, using default");
      }
      await tf.ready();
      faceapiRef.current = faceapi;

      setProgress({ current: 0, total: 0, phase: "กำลังดึงข้อมูลนักศึกษา..." });
      const res = await fetch("/api/benchmark-faces");
      const data = await res.json();
      if (!data.success || !data.data.length) {
        throw new Error(
          "ไม่พบข้อมูลนักศึกษาที่มี Face Descriptor และรูปภาพใน Database",
        );
      }
      const studentList: BenchmarkStudent[] = data.data;
      setStudents(studentList);

      setProgress({
        current: 0,
        total: studentList.length,
        phase: "กำลังตรวจสอบความถูกต้องของข้อมูล...",
      });

      await faceapi.nets.ssdMobilenetv1.loadFromUri("/model");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/model");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/model");

      const DATA_CONSISTENCY_THRESHOLD = 0.5;
      const validStudents: BenchmarkStudent[] = [];
      const invalidStudents: string[] = [];

      for (let i = 0; i < studentList.length; i++) {
        const s = studentList[i];
        setProgress({
          current: i + 1,
          total: studentList.length,
          phase: `ตรวจสอบข้อมูล ${s.name} (${i + 1}/${studentList.length})`,
        });
        try {
          const canvas = await loadImageToCanvas(s.imageUrl);
          const det = await faceapi
            .detectSingleFace(
              canvas,
              new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }),
            )
            .withFaceLandmarks()
            .withFaceDescriptor();
          if (det && det.descriptor) {
            const ownDist = faceapi.euclideanDistance(
              det.descriptor as Float32Array,
              new Float32Array(s.faceDescriptor),
            );
            if (ownDist <= DATA_CONSISTENCY_THRESHOLD) {
              validStudents.push(s);
            } else {
              invalidStudents.push(`${s.name} (dist=${ownDist.toFixed(3)})`);
            }
          } else {
            invalidStudents.push(`${s.name} (ตรวจจับใบหน้าไม่ได้)`);
          }
        } catch {
          invalidStudents.push(`${s.name} (โหลดภาพไม่ได้)`);
        }
      }

      if (invalidStudents.length > 0) {
        setImageErrors(invalidStudents.map((n) => `ข้อมูลไม่สอดคล้อง: ${n}`));
      }

      if (validStudents.length === 0) {
        throw new Error(
          "ไม่พบนักศึกษาที่มีข้อมูล imageUrl ตรงกับ faceDescriptor ใน Database",
        );
      }

      const SAMPLE_SIZE = 10;
      const shuffled = [...validStudents].sort(() => Math.random() - 0.5);
      const testPool = shuffled.slice(
        0,
        Math.min(SAMPLE_SIZE, shuffled.length),
      );

      const allResults: SingleResult[] = [];
      const totalOps = testPool.length * MODELS.length;

      for (const model of MODELS) {
        setProgress({
          current: allResults.length,
          total: totalOps,
          phase: `กำลังโหลดโมเดล ${MODEL_LABELS[model]}...`,
        });

        const modelPath = "/model";
        if (model === "ssd_mobilenetv1") {
          await faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);
        } else {
          await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
        }
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);

        for (let i = 0; i < testPool.length; i++) {
          const student = testPool[i];
          setProgress({
            current: allResults.length,
            total: totalOps,
            phase: `[${MODEL_LABELS[model]}] ทดสอบ ${student.name} (${i + 1}/${testPool.length})`,
          });

          const result: SingleResult = {
            studentId: student.studentId || student.id,
            studentName: student.name,
            imageUrl: student.imageUrl,
            model: MODEL_LABELS[model],
            faceDetected: false,
            identifiedCorrectly: false,
            matchedName: null,
            confidence: 0,
            distance: Infinity,
            processingTimeMs: 0,
          };

          try {
            const canvas = await loadImageToCanvas(student.imageUrl);
            const startTime = performance.now();

            const makeOptions = (threshold: number, inputSize = 512) => {
              if (model === "ssd_mobilenetv1") {
                return new faceapi.SsdMobilenetv1Options({
                  minConfidence: threshold,
                });
              } else {
                return new faceapi.TinyFaceDetectorOptions({
                  inputSize,
                  scoreThreshold: threshold,
                });
              }
            };

            let detection = null;

            if (model === "ssd_mobilenetv1") {
              detection = await faceapi
                .detectSingleFace(canvas, makeOptions(detectionThreshold))
                .withFaceLandmarks()
                .withFaceDescriptor();

              if (!detection) {
                detection = await faceapi
                  .detectSingleFace(canvas, makeOptions(0.05))
                  .withFaceLandmarks()
                  .withFaceDescriptor();
              }
            } else {
              const inputSizes = [320, 416, 512, 608];
              for (const size of inputSizes) {
                detection = await faceapi
                  .detectSingleFace(
                    canvas,
                    makeOptions(detectionThreshold, size),
                  )
                  .withFaceLandmarks()
                  .withFaceDescriptor();
                if (detection) break;
              }
              // Final fallback: lowest threshold + all sizes
              if (!detection) {
                for (const size of inputSizes) {
                  detection = await faceapi
                    .detectSingleFace(canvas, makeOptions(0.05, size))
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                  if (detection) break;
                }
              }
            }

            const endTime = performance.now();
            result.processingTimeMs = Math.round(endTime - startTime);

            if (detection && detection.descriptor) {
              result.faceDetected = true;
              const testDescriptor = detection.descriptor as Float32Array;

              const ownDescriptor = new Float32Array(student.faceDescriptor);
              const ownDistance = faceapi.euclideanDistance(
                testDescriptor,
                ownDescriptor,
              );
              result.distance = ownDistance;

              let bestDistance = Infinity;
              let bestMatchName = "";
              let bestMatchId = "";
              for (const knownStudent of validStudents) {
                const knownDescriptor = new Float32Array(
                  knownStudent.faceDescriptor,
                );
                const d = faceapi.euclideanDistance(
                  testDescriptor,
                  knownDescriptor,
                );
                if (d < bestDistance) {
                  bestDistance = d;
                  bestMatchName = knownStudent.name;
                  bestMatchId = knownStudent.id;
                }
              }

              if (ownDistance <= recognitionThreshold) {
                result.identifiedCorrectly = true;
                result.matchedName = student.name;
                result.confidence = Math.max(0, 1 - ownDistance);
              } else if (bestDistance <= recognitionThreshold) {
                result.matchedName = bestMatchName;
                result.confidence = Math.max(0, 1 - bestDistance);
                result.identifiedCorrectly = bestMatchId === student.id;
              }

              console.log(
                `[${MODEL_LABELS[model]}] ${student.name}` +
                  ` | ownDist=${ownDistance.toFixed(4)}` +
                  ` | bestDist=${bestDistance.toFixed(4)} (${bestMatchName})` +
                  ` | threshold=${recognitionThreshold}` +
                  ` | correct=${result.identifiedCorrectly}`,
              );
            }
          } catch (err: any) {
            console.error(`Error testing ${student.name} with ${model}:`, err);
            setImageErrors((prev) => [
              ...prev,
              `${student.name}: ${err.message || "Unknown error"}`,
            ]);
          }

          allResults.push(result);
          setResults([...allResults]);
        }
      }

      setProgress({
        current: totalOps,
        total: totalOps,
        phase: "เสร็จสมบูรณ์",
      });

      const modelSummaries: ModelSummary[] = MODELS.map((model) => {
        const modelResults = allResults.filter(
          (r) => r.model === MODEL_LABELS[model],
        );
        const totalTests = modelResults.length;
        const facesDetected = modelResults.filter((r) => r.faceDetected).length;
        const correctIds = modelResults.filter(
          (r) => r.identifiedCorrectly,
        ).length;
        const falsePositives = modelResults.filter(
          (r) => r.matchedName !== null && !r.identifiedCorrectly,
        ).length;

        const truePositives = correctIds;
        const precision =
          truePositives + falsePositives > 0
            ? (truePositives / (truePositives + falsePositives)) * 100
            : 0;
        const recall = totalTests > 0 ? (truePositives / totalTests) * 100 : 0;
        const accuracy =
          totalTests > 0
            ? ((truePositives + (totalTests - facesDetected - falsePositives)) /
                totalTests) *
              100
            : 0;

        const processingTimes = modelResults
          .filter((r) => r.processingTimeMs > 0)
          .map((r) => r.processingTimeMs);
        const avgTime =
          processingTimes.length > 0
            ? processingTimes.reduce((a, b) => a + b, 0) /
              processingTimes.length
            : 0;

        const confidences = modelResults
          .filter((r) => r.confidence > 0)
          .map((r) => r.confidence);
        const avgConfidence =
          confidences.length > 0
            ? confidences.reduce((a, b) => a + b, 0) / confidences.length
            : 0;

        return {
          model: MODEL_LABELS[model],
          totalTests,
          facesDetected,
          correctIdentifications: correctIds,
          accuracy: Math.round(accuracy * 100) / 100,
          precision: Math.round(precision * 100) / 100,
          recall: Math.round(recall * 100) / 100,
          avgProcessingTimeMs: Math.round(avgTime),
          avgConfidence: Math.round(avgConfidence * 10000) / 10000,
        };
      });

      setSummaries(modelSummaries);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsRunning(false);
    }
  }, [loadImageToCanvas, recognitionThreshold, detectionThreshold]);

  const exportCSV = useCallback(() => {
    if (results.length === 0) return;
    const headers = [
      "Student ID",
      "Student Name",
      "Model",
      "Face Detected",
      "Identified Correctly",
      "Matched Name",
      "Confidence",
      "Distance",
      "Processing Time (ms)",
    ];
    const rows = results.map((r) => [
      r.studentId,
      r.studentName,
      r.model,
      r.faceDetected ? "Yes" : "No",
      r.identifiedCorrectly ? "Yes" : "No",
      r.matchedName || "N/A",
      r.confidence.toFixed(4),
      r.distance === Infinity ? "N/A" : r.distance.toFixed(4),
      r.processingTimeMs.toString(),
    ]);
    const summaryRows = [
      [],
      ["=== SUMMARY ==="],
      [
        "Model",
        "Total",
        "Detected",
        "Correct",
        "Accuracy%",
        "Precision%",
        "Recall%",
        "Avg ms",
        "Avg Conf",
      ],
      ...summaries.map((s) => [
        s.model,
        s.totalTests.toString(),
        s.facesDetected.toString(),
        s.correctIdentifications.toString(),
        s.accuracy.toFixed(2),
        s.precision.toFixed(2),
        s.recall.toFixed(2),
        s.avgProcessingTimeMs.toString(),
        s.avgConfidence.toFixed(4),
      ]),
    ];
    const csv =
      "\uFEFF" +
      [headers, ...rows, ...summaryRows]
        .map((row) => row.map((c) => `"${c}"`).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `benchmark_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, summaries]);

  const filteredResults =
    detailFilter === "all"
      ? results
      : results.filter((r) => r.model === detailFilter);

  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  const MetricCard = ({
    label,
    value,
    sub,
    accent,
  }: {
    label: string;
    value: string;
    sub?: string;
    accent?: "emerald" | "amber" | "rose" | "sky";
  }) => {
    const colors = {
      emerald:
        "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
      amber:
        "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400",
      rose: "from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-400",
      sky: "from-sky-500/10 to-sky-500/5 border-sky-500/20 text-sky-400",
    };
    const c = accent
      ? colors[accent]
      : "from-base-content/5 to-base-content/3 border-base-content/10 text-base-content";
    return (
      <div
        className={`bg-gradient-to-br ${c} border rounded-xl p-4 text-center`}
      >
        <p className="text-[11px] uppercase tracking-wider opacity-60 mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold font-mono">{value}</p>
        {sub && <p className="text-[11px] opacity-50 mt-0.5">{sub}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-base-content">
              Model Benchmark
            </h1>
          </div>

          <div className="flex gap-2">
            {results.length > 0 && (
              <button
                className="btn btn-sm btn-ghost gap-1.5 border-base-content/10"
                onClick={exportCSV}
                disabled={isRunning}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                CSV
              </button>
            )}
            <button
              className={`btn btn-sm btn-primary gap-1.5 ${isRunning ? "btn-disabled" : ""}`}
              onClick={runBenchmark}
              disabled={isRunning}
            >
              {isRunning ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
              {isRunning ? "กำลังทดสอบ..." : "เริ่มทดสอบ"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-base-200/30 rounded-xl border border-base-content/5 p-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-base-content/70">
                Recognition Threshold
              </span>
              <span className="text-xs font-mono bg-base-content/5 px-2 py-0.5 rounded">
                {recognitionThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.6"
              step="0.05"
              value={recognitionThreshold}
              onChange={(e) =>
                setRecognitionThreshold(parseFloat(e.target.value))
              }
              className="range range-xs range-primary"
              disabled={isRunning}
            />
            <div className="flex justify-between text-[10px] text-base-content/40 mt-1 px-0.5">
              <span>Strict</span>
              <span>Lenient</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-base-content/70">
                Detection Threshold
              </span>
              <span className="text-xs font-mono bg-base-content/5 px-2 py-0.5 rounded">
                {detectionThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.9"
              step="0.05"
              value={detectionThreshold}
              onChange={(e) =>
                setDetectionThreshold(parseFloat(e.target.value))
              }
              className="range range-xs"
              disabled={isRunning}
            />
            <div className="flex justify-between text-[10px] text-base-content/40 mt-1 px-0.5">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>

        {isRunning && (
          <div className="bg-base-200/30 rounded-xl border border-base-content/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="loading loading-ring loading-sm text-primary" />
                <span className="text-sm text-base-content/70">
                  {progress.phase}
                </span>
              </div>
              <span className="text-sm font-mono font-semibold text-primary">
                {pct}%
              </span>
            </div>
            <div className="w-full bg-base-content/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-rose-400 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {imageErrors.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              ภาพที่โหลดไม่สำเร็จ ({imageErrors.length} รายการ)
            </div>
            <ul className="text-xs text-amber-300/70 space-y-0.5 list-disc list-inside max-h-24 overflow-y-auto">
              {imageErrors.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {summaries.length > 0 && (
          <>
            <div className="flex items-center gap-1 bg-base-200/30 rounded-lg p-1 w-fit">
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "summary" ? "bg-primary text-primary-content shadow-sm" : "text-base-content/50 hover:text-base-content/80"}`}
              >
                สรุปผล
              </button>
              <button
                onClick={() => setActiveTab("detail")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "detail" ? "bg-primary text-primary-content shadow-sm" : "text-base-content/50 hover:text-base-content/80"}`}
              >
                รายละเอียด
              </button>
            </div>

            {activeTab === "summary" && (
              <div className="space-y-6">
                {summaries.map((s) => (
                  <div
                    key={s.model}
                    className="bg-base-200/20 rounded-2xl border border-base-content/5 overflow-hidden"
                  >
                    <div className="px-6 py-4 border-b border-base-content/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <h3 className="text-lg font-bold tracking-tight">
                          {s.model}
                        </h3>
                      </div>
                      <span className="text-xs text-base-content/40 font-mono">
                        {s.totalTests} tests
                      </span>
                    </div>

                    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <MetricCard
                        label="Accuracy"
                        value={`${s.accuracy.toFixed(1)}%`}
                        accent={
                          s.accuracy >= 90
                            ? "emerald"
                            : s.accuracy >= 70
                              ? "amber"
                              : "rose"
                        }
                      />
                      <MetricCard
                        label="Precision"
                        value={`${s.precision.toFixed(1)}%`}
                        accent={
                          s.precision >= 90
                            ? "emerald"
                            : s.precision >= 70
                              ? "amber"
                              : "rose"
                        }
                      />
                      <MetricCard
                        label="Recall"
                        value={`${s.recall.toFixed(1)}%`}
                        accent={
                          s.recall >= 90
                            ? "emerald"
                            : s.recall >= 70
                              ? "amber"
                              : "rose"
                        }
                      />
                      <MetricCard
                        label="Avg Time"
                        value={`${s.avgProcessingTimeMs}`}
                        sub="ms / image"
                        accent="sky"
                      />
                      <MetricCard
                        label="Avg Confidence"
                        value={`${(s.avgConfidence * 100).toFixed(1)}%`}
                      />
                    </div>

                    <div className="px-6 pb-5">
                      <div className="flex items-center gap-2 text-xs text-base-content/50 mb-2">
                        <span>ตรวจพบใบหน้า</span>
                        <span className="font-mono font-semibold text-base-content">
                          {s.facesDetected}/{s.totalTests}
                        </span>
                        <span className="mx-1">·</span>
                        <span>ระบุตัวตนถูกต้อง</span>
                        <span className="font-mono font-semibold text-base-content">
                          {s.correctIdentifications}/{s.totalTests}
                        </span>
                      </div>
                      <div className="w-full bg-base-content/5 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{
                            width: `${(s.correctIdentifications / s.totalTests) * 100}%`,
                          }}
                          title={`ระบุถูก ${s.correctIdentifications}`}
                        />
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{
                            width: `${((s.facesDetected - s.correctIdentifications) / s.totalTests) * 100}%`,
                          }}
                          title={`พบใบหน้าแต่ระบุไม่ถูก ${s.facesDetected - s.correctIdentifications}`}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-base-content/40">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                          ระบุถูกต้อง
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />{" "}
                          พบแต่ระบุผิด/ไม่ได้
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-base-content/10" />{" "}
                          ไม่พบใบหน้า
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

            
                <div className="text-[11px] text-base-content/30 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Recognition Threshold: {recognitionThreshold.toFixed(2)}
                  </span>
                  <span>
                    Detection Threshold: {detectionThreshold.toFixed(2)}
                  </span>
                  <span>Algorithm: Euclidean Distance</span>
                </div>
              </div>
            )}

            {activeTab === "detail" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-base-content/50">Filter:</span>
                  {["all", ...MODELS.map((m) => MODEL_LABELS[m])].map((f) => (
                    <button
                      key={f}
                      onClick={() => setDetailFilter(f)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${detailFilter === f ? "bg-primary/15 text-primary border border-primary/20" : "text-base-content/40 hover:text-base-content/70 border border-transparent"}`}
                    >
                      {f === "all" ? "ทั้งหมด" : f}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="bg-base-200/20 rounded-2xl border border-base-content/5 overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-base-200/80 backdrop-blur text-base-content/50 text-xs uppercase tracking-wider">
                          <th className="text-left px-4 py-3 font-medium">#</th>
                          <th className="text-left px-4 py-3 font-medium">
                            นักศึกษา
                          </th>
                          <th className="text-left px-4 py-3 font-medium">
                            โมเดล
                          </th>
                          <th className="text-center px-4 py-3 font-medium">
                            พบ
                          </th>
                          <th className="text-center px-4 py-3 font-medium">
                            ถูกต้อง
                          </th>
                          <th className="text-left px-4 py-3 font-medium">
                            Match
                          </th>
                          <th className="text-right px-4 py-3 font-medium">
                            Confidence
                          </th>
                          <th className="text-right px-4 py-3 font-medium">
                            Distance
                          </th>
                          <th className="text-right px-4 py-3 font-medium">
                            ms
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-base-content/5">
                        {filteredResults.map((r, i) => (
                          <tr
                            key={i}
                            className={`transition-colors hover:bg-base-content/3 ${!r.faceDetected ? "opacity-50" : r.identifiedCorrectly ? "" : "bg-rose-500/5"}`}
                          >
                            <td className="px-4 py-2.5 font-mono text-xs text-base-content/30">
                              {i + 1}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-base-content/5 flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={r.imageUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-sm leading-tight">
                                    {r.studentName}
                                  </p>
                                  <p className="text-[10px] text-base-content/30 font-mono">
                                    {r.studentId}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs px-2 py-0.5 rounded bg-base-content/5 text-base-content/60">
                                {r.model === "SSD MobileNetV1" ? "SSD" : "Tiny"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {r.faceDetected ? (
                                <span className="text-emerald-400 text-sm">
                                  ●
                                </span>
                              ) : (
                                <span className="text-rose-400 text-sm">●</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {r.identifiedCorrectly ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-4 h-4 text-emerald-400 mx-auto"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : r.matchedName ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-4 h-4 text-rose-400 mx-auto"
                                >
                                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                              ) : (
                                <span className="text-base-content/20">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-base-content/50">
                              {r.matchedName || (
                                <span className="text-base-content/20">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs">
                              {r.confidence > 0 ? (
                                <span
                                  className={
                                    r.confidence > 0.7
                                      ? "text-emerald-400"
                                      : r.confidence > 0.5
                                        ? "text-amber-400"
                                        : "text-rose-400"
                                  }
                                >
                                  {(r.confidence * 100).toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-base-content/20">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs">
                              {r.distance < Infinity ? (
                                <span
                                  className={
                                    r.distance <= recognitionThreshold
                                      ? "text-emerald-400"
                                      : "text-rose-400"
                                  }
                                >
                                  {r.distance.toFixed(4)}
                                </span>
                              ) : (
                                <span className="text-base-content/20">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs text-base-content/40">
                              {r.processingTimeMs || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!isRunning && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-primary/60"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-base-content/70 mb-1">
              พร้อมทดสอบ
            </h3>
            <p className="text-sm text-base-content/40 max-w-sm">
              กดปุ่ม{" "}
              <span className="font-semibold text-primary">
                &quot;เริ่มทดสอบ&quot;
              </span>{" "}
              เพื่อดึงภาพนักศึกษาจาก Database แล้วรัน Face Recognition
              ด้วยแต่ละโมเดล
            </p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
