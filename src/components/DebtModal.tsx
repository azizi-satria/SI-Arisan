import { AnimatePresence, motion } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import { Member, Period } from '../types';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  period: Period;
  onPayDebt: (round: number) => void;
}

export default function DebtModal({
  isOpen,
  onClose,
  member,
  period,
  onPayDebt,
}: DebtModalProps) {
  if (!member) return null;

  // Calculate missed historical rounds
  const currentRound = period.currentRound || 1;
  const missedRounds: number[] = [];
  for (let r = 1; r < currentRound; r++) {
    const paid = member.payments?.some((p) => p.round === r) || false;
    if (!paid) {
      missedRounds.push(r);
    }
  }

  const nArisan = period.nominalArisan || 0;
  const nKas = period.nominalKonsumsi || 0;
  const nTotal = nArisan + nKas;

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-debt-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35 }}
            id="modal-debt-card"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Pelunasan Tunggakan</h2>
                <p id="debt-member-name" className="text-sm text-slate-500 font-medium mt-1">
                  {member.name}
                </p>
              </div>
              <button
                id="btn-close-debt-modal"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4 font-medium flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Sistem tunggakan melacak iuran bulanan (arisan + kas konsumsi) yang terlewat dari putaran sebelumnya. Klik bayar untuk melunasinya secara rill.
              </span>
            </div>

            <div id="debt-list" className="overflow-y-auto flex-1 space-y-2 pr-1 min-h-[150px]">
              {missedRounds.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm font-medium">Semua lunas! Tidak ada sisa tunggakan.</p>
                </div>
              ) : (
                missedRounds.map((r) => (
                  <div
                    key={r}
                    className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-700 block text-sm">Putaran {r}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {formatRupiah(nTotal)}{' '}
                        <span className="text-slate-400 font-normal">
                          ({formatRupiah(nArisan)} Arisan + {formatRupiah(nKas)} Kas)
                        </span>
                      </span>
                    </div>
                    <button
                      id={`btn-pay-debt-r${r}`}
                      onClick={() => onPayDebt(r)}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Bayar Lunas
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
