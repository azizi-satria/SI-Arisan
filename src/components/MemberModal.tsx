import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, UserPlus, CheckSquare, Square } from 'lucide-react';
import { Member } from '../types';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  currentRound: number;
  onSave: (id: string | null, name: string, isPaidCurrentRound: boolean) => void;
}

export default function MemberModal({
  isOpen,
  onClose,
  member,
  currentRound,
  onSave,
}: MemberModalProps) {
  const [name, setName] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name);
      const paidInCurrent = member.payments?.some((p) => p.round === currentRound) || false;
      setIsPaid(paidInCurrent);
    } else {
      setName('');
      setIsPaid(false);
    }
  }, [member, isOpen, currentRound]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(member ? member.id : null, name.trim(), isPaid);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-member-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
            id="modal-member-card"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 id="modal-member-title" className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                {member ? 'Edit Info Anggota' : 'Tambah Anggota'}
              </h2>
              <button
                id="btn-close-member-modal"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="form-member" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="member-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow text-slate-800 text-sm"
                    placeholder="Masukkan nama..."
                  />
                </div>

                <div
                  id="checkbox-tile-lunas"
                  onClick={() => setIsPaid(!isPaid)}
                  className="flex items-start gap-3 p-3 border border-slate-200 hover:border-teal-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-all select-none"
                >
                  <div className="flex items-center h-5 mt-0.5 text-teal-600">
                    {isPaid ? (
                      <CheckSquare className="w-5 h-5 text-teal-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-slate-800">
                      Langsung Lunas Bulanan
                    </span>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Tandai sudah membayar iuran (arisan & kas) untuk Putaran {currentRound} ini.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-member"
                  className="px-5 py-2.5 text-white bg-slate-900 hover:bg-slate-800 rounded-xl font-semibold shadow-lg shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
