import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-confirm-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          {/* Backdrop wrapper */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onCancel}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            id="modal-confirm-card"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h3 id="confirm-title" className="text-lg font-bold text-center text-slate-800 mb-2">
              {title}
            </h3>
            
            <p id="confirm-message" className="text-sm text-center text-slate-500 mb-6">
              {message}
            </p>
            
            <div className="flex gap-3">
              <button
                id="btn-confirm-cancel"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-yes"
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors shadow-lg shadow-red-500/30 cursor-pointer"
              >
                Ya, Yakin
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
