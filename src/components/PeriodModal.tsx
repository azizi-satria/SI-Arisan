import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Trash2, Calendar, Target, DollarSign } from 'lucide-react';
import { Period } from '../types';

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: Period | null;
  onSave: (
    id: string | null,
    name: string,
    targetMembers: number,
    nominalArisan: number,
    nominalKonsumsi: number
  ) => void;
  onDelete?: () => void;
  clonedSisaKas?: number | null;
}

export default function PeriodModal({
  isOpen,
  onClose,
  period,
  onSave,
  onDelete,
  clonedSisaKas,
}: PeriodModalProps) {
  const [name, setName] = useState('');
  const [targetMembers, setTargetMembers] = useState(10);
  const [nominalArisan, setNominalArisan] = useState(100000);
  const [nominalKonsumsi, setNominalKonsumsi] = useState(20000);

  useEffect(() => {
    if (period) {
      setName(period.name);
      setTargetMembers(period.targetMembers);
      setNominalArisan(period.nominalArisan);
      setNominalKonsumsi(period.nominalKonsumsi);
    } else {
      setName('');
      setTargetMembers(10);
      setNominalArisan(100000);
      setNominalKonsumsi(20000);
    }
  }, [period, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(period ? period.id : null, name, targetMembers, nominalArisan, nominalKonsumsi);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-period-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
            id="modal-period-card"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 id="modal-period-title" className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                {period ? 'Pengaturan Periode' : 'Tambah Periode Baru'}
              </h2>
              <button
                id="btn-close-period-modal"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="form-period" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nama Periode
                  </label>
                  <input
                    type="text"
                    id="period-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow text-slate-800"
                    placeholder="Contoh: Arisan RT 05 Tahun 2024"
                  />
                  {clonedSisaKas !== undefined && clonedSisaKas !== null && (
                    <div className="mt-2.5 p-3.5 bg-teal-50 border border-teal-200 text-teal-850 rounded-xl text-xs leading-relaxed font-medium">
                      🎁 <strong>Continuation Carry-Over:</strong> Saldo sisa kas konsumsi sebesar{' '}
                      <strong className="font-extrabold text-teal-700">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(clonedSisaKas)}
                      </strong>{' '}
                      dari periode sebelumnya telah disiapkan dan akan dipindahkan secara otomatis ketika Anda menyimpan periode ini.
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Target className="w-4 h-4 text-slate-400" />
                    Target Jumlah Anggota
                  </label>
                  <input
                    type="number"
                    id="period-target"
                    required
                    min="2"
                    value={targetMembers}
                    onChange={(e) => setTargetMembers(Math.max(2, parseInt(e.target.value) || 0))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow text-slate-800"
                    placeholder="Contoh: 20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      Uang Arisan (Kocok)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-medium text-sm">Rp</span>
                      <input
                        type="number"
                        id="period-nominal-arisan"
                        required
                        min="0"
                        value={nominalArisan}
                        onChange={(e) => setNominalArisan(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800 text-sm"
                        placeholder="100000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      Uang Kas (Konsumsi)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-medium text-sm">Rp</span>
                      <input
                        type="number"
                        id="period-nominal-konsumsi"
                        required
                        min="0"
                        value={nominalKonsumsi}
                        onChange={(e) => setNominalKonsumsi(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800 text-sm"
                        placeholder="20000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center gap-3">
                {period && onDelete && (
                  <button
                    type="button"
                    id="btn-delete-period"
                    onClick={onDelete}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Periode
                  </button>
                )}
                <div className="flex gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-period"
                    className="px-5 py-2.5 text-white bg-slate-900 hover:bg-slate-800 rounded-xl font-semibold shadow-lg shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
                  >
                    Simpan Periode
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
