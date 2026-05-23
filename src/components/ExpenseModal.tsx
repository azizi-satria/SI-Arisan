import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Receipt, DollarSign } from 'lucide-react';
import { Expense } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSave: (id: string | null, description: string, amount: number) => void;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  expense,
  onSave,
}: ExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(expense.amount);
    } else {
      setDescription('');
      setAmount('');
    }
  }, [expense, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount === '' || amount <= 0) return;
    onSave(expense ? expense.id : null, description.trim(), Number(amount));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-expense-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
            id="modal-expense-card"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 id="modal-expense-title" className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                {expense ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran'}
              </h2>
              <button
                id="btn-close-expense-modal"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="form-expense" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Keperluan Beli / Bayar Apa?
                  </label>
                  <input
                    type="text"
                    id="expense-desc"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow text-slate-800 text-sm"
                    placeholder="Contoh: Kue Basah & Air Mineral"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Nominal Pengeluaran
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-medium text-sm">Rp</span>
                    <input
                      type="number"
                      id="expense-amount"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmount(val === '' ? '' : Math.max(0, parseInt(val) || 0));
                      }}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow text-slate-800 text-sm"
                      placeholder="50000"
                    />
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
                  id="btn-submit-expense"
                  className="px-5 py-2.5 text-white bg-slate-900 hover:bg-slate-800 rounded-xl font-semibold shadow-lg shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
                >
                  Simpan Kas
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
