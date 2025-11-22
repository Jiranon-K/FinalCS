import { useState, useRef, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faFileExcel,
  faUpload,
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faDownload,
  faArrowLeft,
  faArrowRight,
  faColumns,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/hooks/useToast";

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PreviewData {
  headers: string[];
  previewRows: string[][];
  detectedMapping: Record<string, string>;
  systemFields: { key: string; label: string; required: boolean }[];
  totalDataRows: number;
}

interface ImportError {
  row: number;
  studentId: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    created: number;
    updated: number;
    failed: number;
    success: number;
    errors: ImportError[];
    successList: { name: string; studentId: string; status: string }[];
  };
}

type WizardStep = "upload" | "preview" | "importing" | "result";

export default function ImportStudentsModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportStudentsModalProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {},
  );
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        showToast({
          message: t.students.importModal.selectFileError,
          type: "error",
        });
        return;
      }
      setFile(selectedFile);
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("/api/students/import/preview", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setPreviewData(data);
          setColumnMapping(data.detectedMapping || {});
          setStep("preview");
        } else {
          showToast({
            message: data.error || t.students.importModal.failed,
            type: "error",
          });
          setFile(null);
        }
      } catch {
        showToast({
          message: t.students.importModal.networkError,
          type: "error",
        });
        setFile(null);
      } finally {
        setLoading(false);
      }
    },
    [showToast, t],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/students/import/template");
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_import_template.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast({ message: "Failed to download template", type: "error" });
    }
  };

  const handleMappingChange = (excelHeader: string, fieldKey: string) => {
    setColumnMapping((prev) => ({ ...prev, [excelHeader]: fieldKey }));
  };

  const isMappingValid = (): boolean => {
    const mappedValues = Object.values(columnMapping);
    return mappedValues.includes("studentId") && mappedValues.includes("name");
  };

  const handleImport = async () => {
    if (!file) return;
    setStep("importing");
    setImportProgress(0);

    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("columnMapping", JSON.stringify(columnMapping));

      const response = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        setImportResult({
          success: true,
          message: t.students.importModal.success,
          details: data.details,
        });
        showToast({ message: t.students.importModal.success, type: "success" });
        if (onSuccess) onSuccess();
      } else {
        setImportResult({
          success: false,
          message: data.error || t.students.importModal.failed,
          details: data.details,
        });
        showToast({
          message: data.error || t.students.importModal.failed,
          type: "error",
        });
      }

      setTimeout(() => setStep("result"), 500);
    } catch {
      clearInterval(progressInterval);
      setImportResult({
        success: false,
        message: t.students.importModal.networkError,
      });
      setStep("result");
      showToast({
        message: t.students.importModal.networkError,
        type: "error",
      });
    }
  };

  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setPreviewData(null);
    setColumnMapping({});
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isOpen) return null;

  const stepTitles: Record<WizardStep, string> = {
    upload: t.students.importModal.title,
    preview:
      t.students.importModal.previewTitle || "ตรวจสอบข้อมูลและจับคู่คอลัมน์",
    importing: t.students.importModal.progressTitle || "กำลังนำเข้าข้อมูล...",
    result: t.students.importModal.title,
  };

  return (
    <div className="modal modal-open bg-black/50 backdrop-blur-sm z-50">
      <div className="modal-box w-11/12 max-w-6xl p-0 overflow-hidden bg-base-100 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="bg-base-200/50 p-5 border-b border-base-200 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-xl flex items-center gap-3">
            <FontAwesomeIcon icon={faFileExcel} className="text-success" />
            {stepTitles[step]}
          </h3>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 text-xs">
              {(
                ["upload", "preview", "importing", "result"] as WizardStep[]
              ).map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s
                        ? "bg-primary text-primary-content scale-110"
                        : ["upload", "preview", "importing", "result"].indexOf(
                              step,
                            ) > i
                          ? "bg-success text-success-content"
                          : "bg-base-300 text-base-content/50"
                    }`}
                  >
                    {["upload", "preview", "importing", "result"].indexOf(
                      step,
                    ) > i
                      ? "✓"
                      : i + 1}
                  </div>
                  {i < 3 && (
                    <div
                      className={`w-6 h-0.5 mx-0.5 ${
                        ["upload", "preview", "importing", "result"].indexOf(
                          step,
                        ) > i
                          ? "bg-success"
                          : "bg-base-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === "upload" && (
            <div className="flex flex-col md:flex-row h-full min-h-[500px]">
              <div className="w-full md:w-1/3 bg-base-200/30 p-6 border-r border-base-200 overflow-y-auto">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-info" />
                  {t.students.importModal.instructions}
                </h4>
                <div className="space-y-5">
                  <div className="text-sm space-y-2">
                    <p className="font-semibold text-base-content/80">
                      {t.students.importModal.fileFormat}
                    </p>
                    <p className="opacity-70">
                      {t.students.importModal.supportedFormats}
                    </p>
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="font-semibold text-base-content/80">
                      {t.students.importModal.dataStructure}
                    </p>
                    <ul className="list-disc list-inside opacity-70 space-y-1">
                      <li>{t.students.importModal.skipRows}</li>
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t.students.importModal.headerRow,
                        }}
                      ></li>
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t.students.importModal.dataRow,
                        }}
                      ></li>
                    </ul>
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="font-semibold text-base-content/80">
                      {t.students.importModal.requiredColumns}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge badge-neutral badge-sm">
                        รหัสนักศึกษา
                      </span>
                      <span className="badge badge-neutral badge-sm">
                        ชื่อ-นามสกุล
                      </span>
                    </div>
                  </div>
                  <div className="alert bg-warning/10 border-warning/20 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-warning flex items-center gap-1">
                        <FontAwesomeIcon icon={faExclamationCircle} />
                        {t.students.importModal.important}
                      </span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: t.students.importModal.activationNote,
                        }}
                      ></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3 p-8 flex flex-col justify-center items-center gap-6 bg-base-100">
                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="text-sm opacity-70">
                      {t.students.importModal.previewLoading ||
                        "กำลังวิเคราะห์ไฟล์..."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-full max-h-[350px] border-3 border-dashed border-base-300 rounded-3xl flex flex-col items-center justify-center gap-4 bg-base-200/20 hover:bg-base-200/40 transition-colors cursor-pointer group p-12"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div className="p-5 bg-base-100 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                        <FontAwesomeIcon
                          icon={faUpload}
                          className="text-3xl text-primary"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">
                          {t.students.importModal.uploadTitle}
                        </p>
                        <p className="text-sm opacity-50 mt-1">
                          {t.students.importModal.uploadSubtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      className="btn btn-outline btn-success gap-2"
                      onClick={handleDownloadTemplate}
                    >
                      <FontAwesomeIcon icon={faDownload} />
                      {t.students.importModal.downloadTemplate ||
                        "ดาวน์โหลดไฟล์ตัวอย่าง"}
                    </button>
                  </>
                )}

                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {step === "preview" && previewData && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 bg-base-200/30 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faFileExcel}
                    className="text-xl text-success"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{file?.name}</p>
                  <p className="text-xs opacity-50">
                    {previewData.totalDataRows}{" "}
                    {t.students.importModal.rowsFound || "แถวข้อมูล"}
                    {file && ` · ${(file.size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
              </div>

              <div className="bg-base-200/20 rounded-xl p-5 border border-base-200">
                <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faColumns} className="text-primary" />
                  {t.students.importModal.columnMappingTitle || "จับคู่คอลัมน์"}
                </h4>
                <p className="text-sm opacity-60 mb-4">
                  {t.students.importModal.columnMappingDesc ||
                    "ระบบตรวจจับชื่อคอลัมน์อัตโนมัติ คุณสามารถปรับได้ตามต้องการ"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {previewData.headers.map((header) => (
                    <div key={header} className="flex flex-col gap-1">
                      <label
                        className="text-xs font-semibold text-base-content/70 truncate"
                        title={header}
                      >
                        📄 {header}
                      </label>
                      <select
                        className={`select select-bordered select-sm w-full ${
                          columnMapping[header]
                            ? "select-success"
                            : "select-warning"
                        }`}
                        value={columnMapping[header] || ""}
                        onChange={(e) =>
                          handleMappingChange(header, e.target.value)
                        }
                      >
                        <option value="">
                          — {t.students.importModal.unmapped || "ไม่จับคู่"} —
                        </option>
                        {previewData.systemFields.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.label} {field.required ? "(*)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {!isMappingValid() && (
                  <div className="alert alert-warning mt-4 text-sm">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>
                      {t.students.importModal.mappingRequired ||
                        'จำเป็นต้องจับคู่คอลัมน์ "รหัสนักศึกษา" และ "ชื่อ-นามสกุล" เป็นอย่างน้อย'}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-base-200/20 rounded-xl p-5 border border-base-200">
                <h4 className="font-bold text-base mb-3">
                  👀{" "}
                  {t.students.importModal.previewTableTitle || "ตัวอย่างข้อมูล"}{" "}
                  ({Math.min(previewData.previewRows.length, 5)}{" "}
                  {t.students.importModal.rowsShown || "แถว"})
                </h4>
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm w-full">
                    <thead>
                      <tr>
                        {previewData.headers.map((header) => (
                          <th
                            key={header}
                            className="text-xs whitespace-nowrap"
                          >
                            {header}
                            {columnMapping[header] && (
                              <div className="badge badge-success badge-xs ml-1 font-normal">
                                → {columnMapping[header]}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.previewRows.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="text-sm max-w-[200px] truncate"
                              title={cell}
                            >
                              {cell || <span className="opacity-30">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button className="btn btn-ghost gap-2" onClick={handleReset}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                  {t.students.importModal.backToUpload || "กลับ"}
                </button>
                <button
                  className="btn btn-primary gap-2 shadow-lg shadow-primary/20"
                  onClick={handleImport}
                  disabled={!isMappingValid()}
                >
                  <FontAwesomeIcon icon={faArrowRight} />
                  {t.students.importModal.startImport}
                </button>
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px] gap-6">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="text-6xl text-primary animate-spin"
                />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-xl mb-2">
                  {t.students.importModal.progressTitle ||
                    "กำลังนำเข้าข้อมูล..."}
                </h4>
                <p className="text-sm opacity-60">
                  {t.students.importModal.progressDesc ||
                    "กรุณารอสักครู่ อย่าปิดหน้าต่างนี้"}
                </p>
              </div>

              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs mb-1">
                  <span>{t.students.importModal.processing}</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <progress
                  className="progress progress-primary w-full h-3"
                  value={importProgress}
                  max="100"
                />
              </div>

              {previewData && (
                <p className="text-sm opacity-50">
                  {previewData.totalDataRows}{" "}
                  {t.students.importModal.totalRows || "รายการทั้งหมด"}
                </p>
              )}
            </div>
          )}

          {step === "result" && importResult && (
            <div className="p-6 space-y-6">
              <div
                className={`alert ${importResult.success ? "alert-success" : "alert-error"} shadow-sm`}
              >
                <FontAwesomeIcon
                  icon={
                    importResult.success ? faCheckCircle : faExclamationCircle
                  }
                  className="text-xl"
                />
                <div>
                  <h3 className="font-bold text-lg">{importResult.message}</h3>
                  {importResult.details && (
                    <p className="text-sm mt-1">
                      {t.students.importModal.created}:{" "}
                      {importResult.details.created} ·{" "}
                      {t.students.importModal.updated}:{" "}
                      {importResult.details.updated} ·{" "}
                      {t.students.importModal.failedCount}:{" "}
                      {importResult.details.failed}
                    </p>
                  )}
                </div>
              </div>

              {importResult.details && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-success/10 rounded-xl p-4 text-center border border-success/20">
                    <p className="text-3xl font-bold text-success">
                      {importResult.details.created}
                    </p>
                    <p className="text-xs font-semibold mt-1 opacity-70">
                      {t.students.importModal.created}
                    </p>
                  </div>
                  <div className="bg-info/10 rounded-xl p-4 text-center border border-info/20">
                    <p className="text-3xl font-bold text-info">
                      {importResult.details.updated}
                    </p>
                    <p className="text-xs font-semibold mt-1 opacity-70">
                      {t.students.importModal.updated}
                    </p>
                  </div>
                  <div className="bg-error/10 rounded-xl p-4 text-center border border-error/20">
                    <p className="text-3xl font-bold text-error">
                      {importResult.details.failed}
                    </p>
                    <p className="text-xs font-semibold mt-1 opacity-70">
                      {t.students.importModal.failedCount}
                    </p>
                  </div>
                </div>
              )}

              {importResult.details &&
                importResult.details.errors.length > 0 && (
                  <div className="bg-error/5 rounded-xl p-5 border border-error/20">
                    <h4 className="font-bold text-error mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      {t.students.importModal.errors} (
                      {importResult.details.errors.length})
                    </h4>
                    <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                      <table className="table table-sm w-full">
                        <thead className="sticky top-0 bg-base-100">
                          <tr>
                            <th className="text-xs">
                              {t.students.importModal.errorRow || "แถว"}
                            </th>
                            <th className="text-xs">{t.students.studentId}</th>
                            <th className="text-xs">
                              {t.students.importModal.errorMessage || "สาเหตุ"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.details.errors.map((err, idx) => (
                            <tr key={idx} className="text-error/80">
                              <td className="font-mono text-xs font-bold">
                                {err.row}
                              </td>
                              <td className="font-mono text-xs">
                                {err.studentId}
                              </td>
                              <td className="text-xs">{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              <div className="flex justify-end gap-3 pt-2">
                <button className="btn btn-outline" onClick={handleReset}>
                  {t.students.importModal.importAnother}
                </button>
                {importResult.success && (
                  <button className="btn btn-primary" onClick={onClose}>
                    {t.students.importModal.done}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
