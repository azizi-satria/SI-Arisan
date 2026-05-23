import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Trophy, Award, Sparkles, RefreshCw, CheckCircle, Volume2 } from 'lucide-react';
import { Period, Winner, Member } from '../types';

interface KocokModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: Period;
  onAddWinner: (memberId: string, name: string) => void;
}

export default function KocokModal({
  isOpen,
  onClose,
  period,
  onAddWinner,
}: KocokModalProps) {
  const [shuffling, setShuffling] = useState(false);
  const [currentName, setCurrentName] = useState('???');
  const [winnersThisRound, setWinnersThisRound] = useState<Winner[]>([]);
  const [drawnCount, setDrawnCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const eligibleMembers = period.members.filter((m) => !m.hasWon);
  const currentRound = period.currentRound || 1;
  const nArisan = period.nominalArisan || 0;
  const totalTargetPot = period.members.length * nArisan;

  // Sync winners count in this round when modal opens
  useEffect(() => {
    if (isOpen) {
      setWinnersThisRound(period.winners.filter((w) => w.round === currentRound));
      setDrawnCount(0);
      setShuffling(true);
      startShuffle();
    } else {
      stopShuffleTimer();
    }
    return () => stopShuffleTimer();
  }, [isOpen]);

  const stopShuffleTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startShuffle = () => {
    stopShuffleTimer();
    if (eligibleMembers.length === 0) {
      setCurrentName('Semua Sudah Menang');
      setShuffling(false);
      return;
    }

    setShuffling(true);
    let index = 0;
    timerRef.current = setInterval(() => {
      if (eligibleMembers.length > 0) {
        const item = eligibleMembers[index % eligibleMembers.length];
        setCurrentName(item.name);
        index++;
      }
    }, 85);
  };

  const handleStop = () => {
    if (!shuffling || eligibleMembers.length === 0) return;
    stopShuffleTimer();
    setShuffling(false);

    // Pick a truly random starting-point eligible member
    const winnerIndex = Math.floor(Math.random() * eligibleMembers.length);
    const chosenWinner = eligibleMembers[winnerIndex];

    setCurrentName(`🎉 ${chosenWinner.name} 🎉`);
    onAddWinner(chosenWinner.id, chosenWinner.name);
    setDrawnCount((prev) => prev + 1);

    // Update the local list of winners for instant render in this modal
    const tempWinner: Winner = {
      id: Math.random().toString(),
      memberId: chosenWinner.id,
      name: chosenWinner.name,
      date: 'Baru saja',
      round: currentRound,
      isPaid: false,
    };
    setWinnersThisRound((prev) => [...prev, tempWinner]);
  };

  const handleRerun = () => {
    startShuffle();
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  // Divide the total target pot by the number of winners in this specific round
  const currentWinnersCountInThisRound = period.winners.filter((w) => w.round === currentRound).length;
  const prizePerWinner = currentWinnersCountInThisRound > 0 ? totalTargetPot / currentWinnersCountInThisRound : totalTargetPot;

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-kocok-overlay" className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          {/* Confetti Particle Layer */}
          {!shuffling && drawnCount > 0 && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {Array.from({ length: 45 }).map((_, idx) => {
                const colors = ['bg-teal-400', 'bg-emerald-400', 'bg-amber-400', 'bg-blue-400', 'bg-pink-400'];
                const randomColor = colors[idx % colors.length];
                const left = `${Math.random() * 100}%`;
                const delay = `${Math.random() * 3}s`;
                const duration = `${Math.random() * 3 + 2}s`;
                return (
                  <div
                    key={idx}
                    className={`absolute w-2.5 h-2.5 rounded-sm ${randomColor}`}
                    style={{
                      left,
                      top: '-10px',
                      opacity: Math.random() * 0.8 + 0.2,
                      animation: `fall ${duration} linear infinite`,
                      animationDelay: delay,
                    }}
                  />
                );
              })}
              <style>{`
                @keyframes fall {
                  0% { transform: translateY(0) rotate(0deg); }
                  100% { transform: translateY(110vh) rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            id="modal-kocok-card"
            className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-2xl p-6 sm:p-10 relative z-10 flex flex-col items-center text-center overflow-hidden"
          >
            {/* Glowing orbs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 z-10 tracking-tight flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-400 animate-bounce" />
              Putaran Arisan
            </h2>
            <p id="kocok-round-info" className="text-slate-300 text-sm mb-6 z-10">
              Mengundi pemenang untuk Putaran {currentRound}
            </p>

            {/* Prize estimation cards */}
            <div className="grid grid-cols-2 gap-4 mb-6 z-10 w-full max-w-md">
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center">
                <span className="text-slate-400 text-xs block mb-1">Target Hadiah Putaran Ini</span>
                <span id="kocok-amount-display" className="font-bold text-teal-300 text-base sm:text-lg">
                  {formatRupiah(totalTargetPot)}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center">
                <span className="text-slate-400 text-xs block mb-1">Hadiah Per Orang (Penuh)</span>
                <span id="kocok-split-display" className="font-bold text-amber-300 text-base sm:text-lg">
                  {formatRupiah(prizePerWinner)}
                </span>
              </div>
            </div>

            {/* Shuffling Screen */}
            <div className="bg-slate-950/80 w-full rounded-3xl border-2 border-white/10 p-8 mb-6 z-10 h-44 sm:h-48 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/80 z-20 pointer-events-none" />
              
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono uppercase tracking-widest mb-2 z-10">
                <Volume2 className={`w-4 h-4 ${shuffling ? 'animate-pulse text-teal-400' : ''}`} />
                <span>{shuffling ? 'MENGACAK NAMA ANGGOTA' : 'ADA PEMENANG TERPILIH'}</span>
              </div>

              <motion.div
                id="kocok-result"
                key={currentName}
                initial={shuffling ? {} : { scale: 0.9, opacity: 0.5 }}
                animate={shuffling ? {} : { scale: [1, 1.15, 1], opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-2xl sm:text-4xl font-extrabold text-white z-10 truncate max-w-full px-2"
                style={{
                  background: shuffling ? 'none' : 'linear-gradient(to right, #2dd4bf, #60a5fa)',
                  WebkitBackgroundClip: shuffling ? 'none' : 'text',
                  WebkitTextFillColor: shuffling ? 'none' : 'transparent',
                }}
              >
                {currentName}
              </motion.div>
            </div>

            {/* Winners generated this round list */}
            {winnersThisRound.length > 0 && (
              <div id="current-round-winners-box" className="w-full max-w-md mb-6 z-10">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2 text-left flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Pemenang Putaran Ini ({winnersThisRound.length}):
                </h4>
                <div id="current-round-winners-list" className="flex flex-wrap gap-2 justify-start max-h-[100px] overflow-y-auto p-1 bg-white/5 rounded-xl border border-white/10">
                  {winnersThisRound.map((w, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-white/10 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-bold shadow-md"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {w.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center z-10">
              {shuffling ? (
                <button
                  id="btn-stop-kocok"
                  onClick={handleStop}
                  className="w-full sm:w-2/3 py-4 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white rounded-2xl font-black text-lg shadow-[0_0_35px_rgba(20,184,166,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  HENTIKAN PUTARAN!
                </button>
              ) : (
                <>
                  {eligibleMembers.length > 0 && (
                    <button
                      id="btn-kocok-again"
                      onClick={handleRerun}
                      className="flex-1 py-4 px-6 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      title="Kocok pemenang tambahan dalam putaran yang sama"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Kocok Lagi (Ganda)
                    </button>
                  )}
                  <button
                    id="btn-close-kocok"
                    onClick={onClose}
                    className="py-4 px-8 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Selesai & Tutup
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
