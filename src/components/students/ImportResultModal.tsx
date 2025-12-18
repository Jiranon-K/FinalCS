import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimes, faTimesCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useLocale } from '@/hooks/useLocale';

interface ImportResult {
  success: boolean;
  message: string;
  errors?: string[];
  scannedCount?: number;
  successList?: { name: string; studentId: string }[];
}

interface ImportResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ImportResult | null;
}

export default function ImportResultModal({ isOpen, onClose, result }: ImportResultModalProps) {
  const { t } = useLocale();
  if (!isOpen || !result) return null;

  const isSuccess = result.success && (!result.errors || result.errors.length === 0);
  const isPartial = result.success && result.errors && result.errors.length > 0;
  const hasUnregistered = result.successList && result.successList.length > 0;

  return (
    <div className="modal modal-open" role="dialog">
      <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100 shadow-xl">
        
        {/* Header */}
        <div className={`p-4 flex items-center justify-between ${
          isSuccess ? 'bg-success/10 text-success' : 
          isPartial ? 'bg-warning/10 text-warning' : 
          'bg-error/10 text-error'
        }`}>
          <div className="flex items-center gap-3 font-bold text-lg">
            <FontAwesomeIcon icon={
              isSuccess ? faCheckCircle : 
              isPartial ? faInfoCircle : faTimesCircle
            } className="w-6 h-6" />
            <span>
              {isSuccess ? t.students.importResult.successTitle : 
               isPartial ? t.students.importResult.completeTitle : 
               t.students.importResult.failedTitle}
            </span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            


            {/* General Face Data Warning (Show if any success) */}
            {(result.success || hasUnregistered) && (
                <div className="alert alert-warning shadow-sm mt-4">
                     <FontAwesomeIcon icon={faInfoCircle} className="text-xl" />
                     <div className="text-sm font-medium">
                        {t.students.importResult.faceDescriptorError}
                     </div>
                </div>
            )}
        </div>

        <div className="modal-action p-4 bg-base-200/50 m-0">
             <button className="btn btn-primary px-8" onClick={onClose}>
                {t.common.close}
            </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </div>
  );
}
