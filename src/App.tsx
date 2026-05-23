import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Users,
  Coins,
  Coffee,
  Calculator,
  TrendingUp,
  Search,
  Check,
  Plus,
  Trash2,
  Edit2,
  Settings2,
  PlusCircle,
  Play,
  Trophy,
  History,
  Receipt,
  ChevronRight,
  Landmark,
  X,
  AlertTriangle,
  Award,
  Sparkles,
  DollarSign
} from 'lucide-react';

import { Period, Member, Winner, Expense, Payment } from './types';
import { initialPeriods } from './data';

// Import our custom sub-components
import Sidebar from './components/Sidebar';
import ConfirmModal from './components/ConfirmModal';
import PeriodModal from './components/PeriodModal';
import MemberModal from './components/MemberModal';
import ExpenseModal from './components/ExpenseModal';
import DebtModal from './components/DebtModal';
import KocokModal from './components/KocokModal';

export default function App() {
  // ---------------- STATE READ / WRITE ----------------
  const [periods, setPeriods] = useState<Period[]>(() => {
    const saved = localStorage.getItem('arisan_pro_periods');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading periods from localStorage", e);
      }
    }
    return initialPeriods;
  });

  const [activePeriodId, setActivePeriodId] = useState<string | null>(() => {
    const saved = localStorage.getItem('arisan_pro_active_id');
    if (saved) {
      return saved;
    }
    return periods.length > 0 ? periods[0].id : null;
  });

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem('arisan_pro_periods', JSON.stringify(periods));
  }, [periods]);

  useEffect(() => {
    if (activePeriodId) {
      localStorage.setItem('arisan_pro_active_id', activePeriodId);
    } else {
      localStorage.removeItem('arisan_pro_active_id');
    }
  }, [activePeriodId]);

  // Sidebar controls
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // ---------------- TOAST SYSTEM ----------------
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'warning' | 'error' }>>([]);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // ---------------- MODALS TRIGGER STATE ----------------
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtMember, setDebtMember] = useState<Member | null>(null);

  const [isKocokModalOpen, setIsKocokModalOpen] = useState(false);

  // Cloned states for Carry over/Reset arisan period
  const [clonedMembersTemp, setClonedMembersTemp] = useState<Member[] | null>(null);
  const [clonedSisaKasTemp, setClonedSisaKasTemp] = useState<number | null>(null);

  // Universal Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState<() => void>(() => {});

  // ---------------- DERIVED STATE / FORMULAS ----------------
  const activePeriod = useMemo(() => {
    return periods.find((p) => p.id === activePeriodId) || null;
  }, [periods, activePeriodId]);

  // Handle fallback if activePeriod disappears
  useEffect(() => {
    if (periods.length > 0 && !activePeriod) {
      setActivePeriodId(periods[0].id);
    } else if (periods.length === 0) {
      setActivePeriodId(null);
    }
  }, [periods, activePeriod]);

  // Bookkeeping Metrics
  const metrics = useMemo(() => {
    if (!activePeriod) {
      return {
        targetArisanTerkumpul: 0,
        kasSisa: 0,
        moneyInAdminHand: 0,
        totalRealIuranCurrentCollected: 0,
        unpaidMembers: [],
      };
    }

    const currentR = activePeriod.currentRound || 1;
    const nArisan = activePeriod.nominalArisan || 0;
    const nKonsumsi = activePeriod.nominalKonsumsi || 0;
    const nTotal = nArisan + nKonsumsi;
    const initialSisaKas = activePeriod.initialSisaKas || 0;

    // 1. Target Pot Arisan Penuh = jumlah anggota * nominal arisan
    const targetArisanTerkumpul = activePeriod.members.length * nArisan;

    // 2. Sisa Kas Konsumsi = (Carry over) + (Total Kas Terkumpul) - (Total Kas Keluar)
    let totalPaymentsCount = 0;
    activePeriod.members.forEach((m) => {
      if (m.payments) totalPaymentsCount += m.payments.length;
    });
    const kasTerkumpul = totalPaymentsCount * nKonsumsi;

    let kasKeluar = 0;
    if (activePeriod.expenses) {
      activePeriod.expenses.forEach((e) => {
        kasKeluar += e.amount;
      });
    }
    const kasSisa = initialSisaKas + kasTerkumpul - kasKeluar;

    // 3. Iuran Riil Masuk Bulan Ini (Normal + Pelunasan Tunggakan)
    // Counts payments where paidInRound === currentRound
    let paymentsInCurrentRoundCount = 0;
    activePeriod.members.forEach((m) => {
      if (m.payments) {
        const matching = m.payments.filter((p) => p.paidInRound === currentR);
        paymentsInCurrentRoundCount += matching.length;
      }
    });
    const totalRealIuranCurrentCollected = paymentsInCurrentRoundCount * nTotal;

    // 4. Uang di Tangan Admin (FISIK rill)
    // Formula: (Semua uang masuk) - (Seluruh pengeluaran kas) - (Seluruh Hadiah Arisan yang SUDAH DISERAHKAN)
    const totalArisanCollectedFromAllRounds = totalPaymentsCount * nArisan;
    const totalAllMoneyCollected = totalArisanCollectedFromAllRounds + kasTerkumpul + initialSisaKas;

    // Subtract target prize draw value for actual handovers (where winner.isPaid === true)
    let totalArisanPaidOut = 0;
    activePeriod.winners.forEach((w) => {
      if (w.isPaid) {
        // Calculate the target pool prize for that round
        const roundWinners = activePeriod.winners.filter((win) => win.round === w.round);
        const prizeForRound = (activePeriod.members.length * nArisan) / (roundWinners.length || 1);
        totalArisanPaidOut += prizeForRound;
      }
    });

    const moneyInAdminHand = totalAllMoneyCollected - kasKeluar - totalArisanPaidOut;

    // 5. Unpaid members in current round
    const unpaidMembers = activePeriod.members.filter(
      (m) => !m.payments || !m.payments.some((p) => p.round === currentR)
    );

    return {
      targetArisanTerkumpul,
      kasSisa,
      moneyInAdminHand,
      totalRealIuranCurrentCollected,
      unpaidMembers,
    };
  }, [activePeriod]);

  // Helper function to format IDR
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  // Helper calculating specific winner's prize pool values
  const getWinnerPrizeValues = (winner: Winner) => {
    if (!activePeriod) return { targetPrize: 0, realCollectedPrize: 0, debtGap: 0, roundWinnersCount: 1 };
    
    const nArisan = activePeriod.nominalArisan || 0;
    const totalTargetPot = activePeriod.members.length * nArisan;
    
    // Total winners in that round
    const roundWinners = activePeriod.winners.filter((w) => w.round === winner.round);
    const roundWinnersCount = roundWinners.length || 1;

    // Target prize is target pot split equally among winners of that round
    const targetPrize = totalTargetPot / roundWinnersCount;

    // Real collected prize: only based on members that already paid for that round
    const paidCount = activePeriod.members.filter((m) =>
      m.payments?.some((p) => p.round === winner.round)
    ).length;
    const realCollectedPrize = (paidCount * nArisan) / roundWinnersCount;
    const debtGap = Math.max(0, targetPrize - realCollectedPrize);

    return { targetPrize, realCollectedPrize, debtGap, roundWinnersCount };
  };

  // Filtered members list based on query
  const filteredMembers = useMemo(() => {
    if (!activePeriod) return [];
    return activePeriod.members.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activePeriod, searchQuery]);

  // ---------------- EVENT HANDLERS ----------------

  // Confirm actions helper
  const triggerConfirmation = (title: string, message: string, callback: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmCallback(() => callback);
    setIsConfirmOpen(true);
  };

  // --- Periods ---
  const handleOpenNewPeriod = () => {
    setEditingPeriod(null);
    setIsPeriodModalOpen(true);
  };

  const handleEditPeriod = () => {
    if (!activePeriod) return;
    setEditingPeriod(activePeriod);
    setIsPeriodModalOpen(true);
  };

  const handleSavePeriod = (
    id: string | null,
    name: string,
    targetMembers: number,
    nominalArisan: number,
    nominalKonsumsi: number
  ) => {
    if (id) {
      // Edit mode
      setPeriods((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, name, targetMembers, nominalArisan, nominalKonsumsi } : p
        )
      );
      showToast('Konfigurasi Pengaturan Periode Berhasil Disimpan.', 'success');
    } else {
      // Create mode
      const newPeriod: Period = {
        id: 'p_' + Math.random().toString(36).substring(2, 9),
        name,
        targetMembers,
        nominalArisan,
        nominalKonsumsi,
        currentRound: 1,
        members: clonedMembersTemp || [],
        winners: [],
        expenses: [],
        initialSisaKas: clonedSisaKasTemp || 0,
        isClosed: false,
      };
      setPeriods((prev) => [...prev, newPeriod]);
      setActivePeriodId(newPeriod.id);
      showToast(`Periode "${name}" Berhasil Dibentuk!`, 'success');
    }
    // Reset temp cloning state
    setClonedMembersTemp(null);
    setClonedSisaKasTemp(null);
    setIsPeriodModalOpen(false);
  };

  const handleDeletePeriod = () => {
    if (!activePeriod) return;
    setIsPeriodModalOpen(false);
    triggerConfirmation(
      'Hapus Periode Arisan',
      `Tindakan ini permanen. Semua data anggota, riwayat pemenang, kas konsumsi, dan laporan keuangan rill dari "${activePeriod.name}" akan terhapus sepenuhnya.`,
      () => {
        const idToRemove = activePeriod.id;
        const updated = periods.filter((p) => p.id !== idToRemove);
        setPeriods(updated);
        showToast('Periode Arisan Berhasil Dihapus.', 'warning');
        if (updated.length > 0) {
          setActivePeriodId(updated[0].id);
        } else {
          setActivePeriodId(null);
        }
      }
    );
  };

  const handleClosePeriodClick = () => {
    if (!activePeriod) return;
    triggerConfirmation(
      'Tutup & Arsipkan Periode',
      `Apakah Anda yakin ingin menutup dan mengarsipkan Periode "${activePeriod.name}"? Aktivitas iuran, kocok pemenang, pengeluaran kas, dan manipulasi anggota akan dikunci secara permanen.`,
      () => {
        setPeriods((prev) =>
          prev.map((p) =>
            p.id === activePeriod.id ? { ...p, isClosed: true } : p
          )
        );
        showToast(`Periode "${activePeriod.name}" Berhasil Ditutup & Diarsipkan!`, 'success');
      }
    );
  };

  const handleResetAndContinuePeriodClick = () => {
    if (!activePeriod) return;
    triggerConfirmation(
      'Reset & Lanjutkan Periode Baru',
      `Apakah Anda bersedia melanjutkan arisan ke periode kelanjutan baru? Kami akan secara otomatis menyalin (${activePeriod.members.length}) anggota dari "${activePeriod.name}" dan mentransfer sisa kas konsumsi akhir sebesar ${formatRupiah(metrics.kasSisa)} sebagai saldo awal kas baru.`,
      () => {
        const clonedMembers: Member[] = activePeriod.members.map((m) => ({
          id: 'm_' + Math.random().toString(36).substring(2, 9),
          name: m.name,
          payments: [],
          hasWon: false,
        }));

        setClonedMembersTemp(clonedMembers);
        setClonedSisaKasTemp(metrics.kasSisa);

        // Prep continuation period modal fields (editingPeriod is empty ID but filled settings)
        setEditingPeriod({
          id: '',
          name: `${activePeriod.name} - Putaran Selanjutnya`,
          targetMembers: activePeriod.targetMembers,
          nominalArisan: activePeriod.nominalArisan,
          nominalKonsumsi: activePeriod.nominalKonsumsi,
          currentRound: 1,
          members: [],
          winners: [],
          expenses: [],
        });
        setIsPeriodModalOpen(true);
      }
    );
  };

  // --- Members ---
  const handleOpenMemberModal = () => {
    if (!activePeriod) return;
    if (activePeriod.members.length >= activePeriod.targetMembers) {
      showToast('Kapasitas Penuh! Jumlah anggota sudah mencapai target maksimal terdaftar.', 'error');
      return;
    }
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (id: string | null, name: string, isPaidCurrentRound: boolean) => {
    if (!activePeriod) return;
    const currentR = activePeriod.currentRound || 1;

    if (id) {
      // Edit existing member
      setPeriods((prev) =>
        prev.map((p) => {
          if (p.id !== activePeriod.id) return p;
          const updatedMembers = p.members.map((m) => {
            if (m.id !== id) return m;
            
            let updatedPayments = [...(m.payments || [])];
            const hasPaidInCurrentRound = updatedPayments.some((pay) => pay.round === currentR);

            if (isPaidCurrentRound && !hasPaidInCurrentRound) {
              updatedPayments.push({ round: currentR, paidInRound: currentR });
            } else if (!isPaidCurrentRound && hasPaidInCurrentRound) {
              updatedPayments = updatedPayments.filter((pay) => pay.round !== currentR);
            }

            return { ...m, name, payments: updatedPayments };
          });

          return { ...p, members: updatedMembers };
        })
      );
      showToast(`Data anggota "${name}" berhasil diperbarui.`, 'success');
    } else {
      // Create new member
      const newMember: Member = {
        id: 'm_' + Math.random().toString(36).substring(2, 9),
        name,
        payments: isPaidCurrentRound ? [{ round: currentR, paidInRound: currentR }] : [],
        hasWon: false,
      };

      setPeriods((prev) =>
        prev.map((p) => {
          if (p.id !== activePeriod.id) return p;
          return { ...p, members: [...p.members, newMember] };
        })
      );
      showToast(`${name} berhasil didaftarkan sebagai anggota arisan!`, 'success');
    }
    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = (memberId: string, name: string) => {
    if (!activePeriod) return;
    triggerConfirmation(
      'Keluarkan Anggota',
      `Apakah Anda yakin ingin mengeluarkan "${name}" dari periode ini? Semua histori pemenang & pembayaran iuran miliknya akan ikut dibersihkan.`,
      () => {
        setPeriods((prev) =>
          prev.map((p) => {
            if (p.id !== activePeriod.id) return p;
            return {
              ...p,
              members: p.members.filter((m) => m.id !== memberId),
              winners: p.winners.filter((w) => w.memberId !== memberId),
            };
          })
        );
        showToast(`Anggota "${name}" berhasil dikeluarkan dari arisan.`, 'warning');
      }
    );
  };

  // --- Toggle Monthly Fee Settlement ---
  const handleToggleIuranCurrentRound = (memberId: string) => {
    if (!activePeriod) return;
    const currentR = activePeriod.currentRound || 1;
    const member = activePeriod.members.find((m) => m.id === memberId);
    if (!member) return;

    const hasPaid = member.payments?.some((pay) => pay.round === currentR) || false;

    if (hasPaid) {
      showToast(`Status iuran ditarik kembali untuk ${member.name}.`, 'warning');
    } else {
      showToast(`Pembayaran iuran ${member.name} diverifikasi Lunas.`, 'success');
    }

    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== activePeriod.id) return p;
        const updatedMembers = p.members.map((m) => {
          if (m.id !== memberId) return m;
          
          let updatedPayments = m.payments ? [...m.payments] : [];

          if (hasPaid) {
            // Remove current payment
            updatedPayments = updatedPayments.filter((pay) => pay.round !== currentR);
          } else {
            // Add current payment
            updatedPayments.push({ round: currentR, paidInRound: currentR });
          }

          return { ...m, payments: updatedPayments };
        });

        return { ...p, members: updatedMembers };
      })
    );
  };

  // --- Mass Settlement Lunas Semua ---
  const handlePayAllCurrentRound = () => {
    if (!activePeriod) return;
    if (activePeriod.members.length === 0) {
      showToast('Tidak ada anggota terdaftar untuk ditandai lunas.', 'warning');
      return;
    }

    triggerConfirmation(
      'Tandai Semua Lunas',
      `Apakah Anda yakin ingin memverifikasi pelunasan massal iuran (arisan & kas konsumsi) untuk seluruh (${activePeriod.members.length}) anggota pada Putaran ${activePeriod.currentRound} ini?`,
      () => {
        const currentR = activePeriod.currentRound || 1;
        setPeriods((prev) =>
          prev.map((p) => {
            if (p.id !== activePeriod.id) return p;
            const updatedMembers = p.members.map((m) => {
              const alreadyPaid = m.payments?.some((pay) => pay.round === currentR) || false;
              if (alreadyPaid) return m;

              const updatedPayments = m.payments ? [...m.payments] : [];
              updatedPayments.push({ round: currentR, paidInRound: currentR });
              return { ...m, payments: updatedPayments };
            });

            return { ...p, members: updatedMembers };
          })
        );
        showToast('Kas Berhasil Diperbarui: Seluruh anggota ditandai Lunas masal!', 'success');
      }
    );
  };

  // --- Mass Increment Round ---
  const handleIncrementRound = () => {
    if (!activePeriod) return;
    const currentR = activePeriod.currentRound || 1;

    // Check if drawing has completed for the current round (must have at least one registered winner in this round)
    const winnersInCurrentRoundCount = activePeriod.winners.filter((w) => w.round === currentR).length;
    if (winnersInCurrentRoundCount === 0 && activePeriod.members.length > 0) {
      showToast(
        'Putaran belum dikocok! Anda wajib mengundi pemenang putaran ini terlebih dahulu sebelum membuka putaran berikutnya.',
        'error'
      );
      return;
    }

    triggerConfirmation(
      'Buka Putaran Baru',
      `Apakah Anda bersedia menutup Putaran ${currentR} dan membuka Putaran Baru ${currentR + 1}? Iuran bulanan anggota akan kembali ke status 'Belum Bayar' dan iuran tertinggal otomatis dilacak sebagai tunggakan.`,
      () => {
        setPeriods((prev) =>
          prev.map((p) => {
            if (p.id !== activePeriod.id) return p;
            return { ...p, currentRound: currentR + 1 };
          })
        );
        showToast(`Selamat! Putaran ${currentR + 1} resmi diaktifkan.`, 'success');
      }
    );
  };

  // --- Historical Debt Settlement ---
  const handleOpenDebtModal = (member: Member) => {
    setDebtMember(member);
    setIsDebtModalOpen(true);
  };

  const handlePayDebtRound = (round: number) => {
    if (!activePeriod || !debtMember) return;
    const currentR = activePeriod.currentRound || 1;

    // Record payment for that historical round, marked as paidInRound = currentRound
    let updatedMemberName = '';
    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== activePeriod.id) return p;
        const updatedMembers = p.members.map((m) => {
          if (m.id !== debtMember.id) return m;
          
          updatedMemberName = m.name;
          const updatedPayments = m.payments ? [...m.payments] : [];
          // Double safeguard to make sure we don't duplicate
          if (!updatedPayments.some((pay) => pay.round === round)) {
            updatedPayments.push({ round, paidInRound: currentR });
          }
          return { ...m, payments: updatedPayments };
        });

        return { ...p, members: updatedMembers };
      })
    );

    showToast(`Tunggakan Putaran ${round} untuk "${updatedMemberName}" berhasil dilunasi. Cashflow diperbarui.`, 'success');

    // Instantly sync the localized state of the debt member to review any further debts
    setPeriods((latestPeriods) => {
      const freshPeriod = latestPeriods.find((p) => p.id === activePeriod.id);
      const freshMember = freshPeriod?.members.find((m) => m.id === debtMember.id);
      if (freshMember) {
        setDebtMember(freshMember);
        // If they have no missed rounds left, auto-close modal
        let missedCount = 0;
        for (let r = 1; r < currentR; r++) {
          if (!freshMember.payments?.some((pay) => pay.round === r)) {
            missedCount++;
          }
        }
        if (missedCount === 0) {
          setIsDebtModalOpen(false);
          setDebtMember(null);
        }
      }
      return latestPeriods;
    });
  };

  // --- Expenses ---
  const handleOpenExpenseModal = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (id: string | null, description: string, amount: number) => {
    if (!activePeriod) return;
    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (id) {
      // Edit expense
      setPeriods((prev) =>
        prev.map((p) => {
          if (p.id !== activePeriod.id) return p;
          return {
            ...p,
            expenses: p.expenses.map((e) =>
              e.id === id ? { ...e, description, amount, date: dateStr } : e
            ),
          };
        })
      );
      showToast('Catatan pengeluaran kas berhasil diperbarui.', 'success');
    } else {
      // Create expense
      const newExp: Expense = {
        id: 'e_' + Math.random().toString(36).substring(2, 9),
        description,
        amount,
        date: dateStr,
      };

      setPeriods((prev) =>
        prev.map((p) => {
          if (p.id !== activePeriod.id) return p;
          return { ...p, expenses: [...p.expenses, newExp] };
        })
      );
      showToast('Pengeluaran kas berhasil dicatat dan diposting.', 'success');
    }
    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!activePeriod) return;
    triggerConfirmation(
      'Hapus Catatan Kas Keluar',
      'Hapus catatan pengeluaran kas konsumsi ini? Saldo admin dan kas konsumsi akan dikalkulasi ulang.',
      () => {
        setPeriods((prev) =>
          prev.map((p) => {
            if (p.id !== activePeriod.id) return p;
            return { ...p, expenses: p.expenses.filter((e) => e.id !== expenseId) };
          })
        );
        showToast('Catatan kas pengeluaran berhasil dihapus.', 'warning');
      }
    );
  };

  // --- Drawing Winner (Lottery) ---
  const handleOpenKocok = () => {
    if (!activePeriod) return;
    const eligibleCount = activePeriod.members.filter((m) => !m.hasWon).length;
    if (activePeriod.members.length === 0) {
      showToast('Belum ada anggota arisan terdaftar.', 'warning');
      return;
    }
    if (eligibleCount === 0) {
      showToast('Hebat! Semua anggota yang terdaftar di periode ini sudah pernah memenangkan arisan.', 'warning');
      return;
    }
    setIsKocokModalOpen(true);
  };

  const handleAddWinner = (memberId: string, name: string) => {
    if (!activePeriod) return;
    const currentR = activePeriod.currentRound || 1;
    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const newWinner: Winner = {
      id: 'w_' + Math.random().toString(36).substring(2, 9),
      memberId,
      name,
      date: dateStr,
      round: currentR,
      isPaid: false, // default to false (managed by admin handovers)
    };

    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== activePeriod.id) return p;
        return {
          ...p,
          // Add winner record
          winners: [...p.winners, newWinner],
          // Mark member as having won
          members: p.members.map((m) => (m.id === memberId ? { ...m, hasWon: true } : m)),
        };
      })
    );
  };

  const handleBatalMenang = (memberId: string, name: string) => {
    if (!activePeriod) return;
    triggerConfirmation(
      'Batalkan Status Pemenang',
      `Apakah Anda yakin ingin menganulir kemenangan "${name}"? Status anggota akan dikembalikan menjadi 'Belum Menang' dan data ditarik dari riwayat.`,
      () => {
        setPeriods((prev) =>
          prev.map((p) => {
            if (p.id !== activePeriod.id) return p;
            return {
              ...p,
              winners: p.winners.filter((w) => w.memberId !== memberId),
              members: p.members.map((m) => (m.id === memberId ? { ...m, hasWon: false } : m)),
            };
          })
        );
        showToast(`Status pemenang "${name}" dibatalkan.`, 'warning');
      }
    );
  };

  const handleHandoverWinnerCek = (winnerId: string, name: string) => {
    if (!activePeriod) return;
    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== activePeriod.id) return p;
        return {
          ...p,
          winners: p.winners.map((w) => (w.id === winnerId ? { ...w, isPaid: true } : w)),
        };
      })
    );
    showToast(`Uang arisan diserahkan penuh kepada "${name}". Saldo fisik admin berkurang.`, 'success');
  };

  const handleCancelHandoverWinnerCek = (winnerId: string, name: string) => {
    if (!activePeriod) return;
    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== activePeriod.id) return p;
        return {
          ...p,
          winners: p.winners.map((w) => (w.id === winnerId ? { ...w, isPaid: false } : w)),
        };
      })
    );
    showToast(`Penyerahan iuran ditarik kembali. Saldo arisan "${name}" kembali dipegang admin.`, 'warning');
  };

  return (
    <div className="text-slate-800 h-screen flex overflow-hidden bg-slate-50 font-sans selection:bg-teal-200">
      {/* Toast Notification Mount */}
      <div id="toast-container" className="fixed bottom-6 right-6 z-[120] flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => {
            let bgClass = 'bg-teal-600';
            if (t.type === 'error') bgClass = 'bg-rose-600';
            if (t.type === 'warning') bgClass = 'bg-amber-500';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 50, y: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`${bgClass} text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 font-semibold pointer-events-auto text-sm border border-white/15`}
              >
                {t.type === 'success' && <Check className="w-4.5 h-4.5 text-teal-100 shrink-0" />}
                {t.type === 'error' && <X className="w-4.5 h-4.5 text-rose-100 shrink-0" />}
                {t.type === 'warning' && <AlertTriangle className="w-4.5 h-4.5 text-amber-100 shrink-0" />}
                <span>{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Sidebar Desktop component */}
      <Sidebar
        periods={periods}
        activePeriodId={activePeriodId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(true)}
        onSelectPeriod={(id) => {
          setActivePeriodId(id);
          setIsMobileMenuOpen(false);
        }}
        onOpenNewPeriod={handleOpenNewPeriod}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 shadow-md z-30 px-5 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="bg-teal-500 text-white p-1.5 rounded-lg">
            <Landmark className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-black tracking-tight">
            Arisan<span className="text-teal-400">Pro</span>
          </h1>
        </div>
        <button
          id="btn-mobile-menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-300 hover:text-white p-1 rounded-lg focus:outline-none cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div id="mobile-menu" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="bg-slate-900 w-4/5 max-w-sm h-full p-6 flex flex-col shadow-2xl text-slate-300 relative"
            >
              <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4 text-white">
                <span className="text-base font-bold flex items-center gap-2">
                  <Menu className="w-4 h-4 text-teal-400" />
                  Menu Periode
                </span>
                <button
                  id="btn-close-mobile-menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <button
                id="btn-mobile-create-period"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleOpenNewPeriod();
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3.5 rounded-xl mb-6 font-bold shadow-lg shadow-teal-500/30 text-center cursor-pointer text-sm"
              >
                + Buat Periode Baru
              </button>

              <div className="flex-1 overflow-y-auto space-y-2">
                <p className="text-[10px] uppercase text-slate-500 tracking-wider font-bold mb-3">Daftar Periode</p>
                {periods.map((p) => {
                  const isActive = p.id === activePeriodId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setActivePeriodId(p.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                        isActive
                          ? 'bg-slate-800 text-teal-300 border-l-4 border-teal-400 font-bold'
                          : 'hover:bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate text-sm flex items-center gap-1.5">
                          {p.isClosed && <span className="text-rose-500">🔒</span>}
                          {p.name}
                        </span>
                        {p.isClosed && (
                          <span className="text-[9px] text-rose-400 font-bold tracking-tight">Selesai & Diarsipkan</span>
                        )}
                      </div>
                      <span className="text-xs bg-slate-950 px-2 py-0.5 rounded-full text-slate-500 shrink-0">
                        {p.members.length}/{p.targetMembers}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 pt-16 md:pt-0 relative w-full overflow-hidden">
        {/* Expand-sidebar Floating Button */}
        {isSidebarCollapsed && (
          <button
            id="sidebar-expand-btn"
            onClick={() => setIsSidebarCollapsed(false)}
            className="hidden md:flex absolute top-6 left-6 z-30 bg-slate-900 hover:bg-slate-800 text-teal-400 p-2.5 rounded-xl shadow-lg hover:shadow-teal-500/10 border border-slate-800 transition-all transform hover:scale-105 items-center justify-center cursor-pointer"
            title="Tampilkan Panel"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* ---------------- WELCOME SCREEN ---------------- */}
        {!activePeriod && (
          <div id="welcome-screen" className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="bg-white p-6 rounded-full mb-6 shadow-xl shadow-teal-100 ring-4 ring-teal-50">
              <Landmark className="w-16 h-16 text-teal-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-3 tracking-tight">
              Selamat Datang di ArisanPro
            </h2>
            <p className="text-slate-500 mb-8 max-w-md text-base leading-relaxed">
              Platform modern kearsipan yang mempermudah Anda dalam mengelola dana arisan keluarga, kantor, atau PKK dengan pembukuan transparan dan instan.
            </p>
            <button
              id="btn-welcome-create-period"
              onClick={handleOpenNewPeriod}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl shadow-lg shadow-slate-900/20 font-bold transition-transform transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer test-sm"
            >
              <PlusCircle className="w-5 h-5 text-teal-400" />
              Mulai Buat Periode Baru
            </button>
          </div>
        )}

        {/* ---------------- ACTIVE DASHBOARD SCREEN ---------------- */}
        {activePeriod && (
          <div id="dashboard-screen" className="flex-1 flex flex-col h-full overflow-y-auto">
            {/* Header section */}
            <div id="dashboard-header" className="bg-white border-b border-slate-200 px-6 lg:px-10 py-6 shrink-0 z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 id="current-period-title" className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-none">
                      {activePeriod.name}
                    </h2>
                    <span id="current-round-badge" className="bg-slate-900 text-teal-300 text-[10px] font-extrabold font-mono uppercase px-3 py-1 rounded-full border border-teal-500/20 shadow-sm">
                      Putaran {activePeriod.currentRound || 1}
                    </span>
                    {activePeriod.isClosed && (
                      <span id="closed-badge" className="bg-rose-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-rose-500 shadow-sm flex items-center gap-1.5 animate-pulse">
                        🔒 Selesai & Ditutup
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span id="hdr-members">{activePeriod.members.length}/{activePeriod.targetMembers}</span> Anggota
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      Total Iuran: {formatRupiah((activePeriod.nominalArisan || 0) + (activePeriod.nominalKonsumsi || 0))} /Bulan
                    </span>
                  </div>
                </div>

                {/* Top header action button block */}
                <div className="flex gap-3 w-full md:w-auto shrink-0 flex-wrap">
                  {activePeriod && !activePeriod.isClosed && (
                    <button
                      id="btn-close-period-header"
                      onClick={handleClosePeriodClick}
                      className="flex-1 md:flex-none text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Akhiri putaran arisan & kunci seluruh transaksi pembukuan periode ini"
                    >
                      <X className="w-4 h-4 text-rose-500" />
                      <span>Akhiri Periode</span>
                    </button>
                  )}
                  <button
                    id="btn-settings-period"
                    onClick={handleEditPeriod}
                    className="flex-1 md:flex-none bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-4.5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Settings2 className="w-4 h-4 text-slate-500" />
                    <span>Pengaturan</span>
                  </button>
                  <button
                    id="btn-kocok"
                    onClick={() => {
                      if (activePeriod.isClosed) {
                        showToast('Periode telah ditutup. Tidak dapat melakukan kocok pemenang lagi.', 'error');
                        return;
                      }
                      handleOpenKocok();
                    }}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl shadow-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      activePeriod.isClosed
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
                        : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-teal-500/30 transform hover:-translate-y-0.5 cursor-pointer'
                    }`}
                  >
                    <Play className={`w-4 h-4 text-amber-305 fill-amber-305 ${activePeriod.isClosed ? 'text-slate-400 fill-none' : 'animate-pulse text-amber-300 fill-amber-300'}`} />
                    Kocok Pemenang
                  </button>
                </div>
              </div>

              {/* STATS BENTO CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {/* Stat block 1 */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">Target Pot Arisan (Penuh)</p>
                    <Calculator className="w-4 h-4 text-slate-400 self-start" />
                  </div>
                  <h3 id="stat-arisan" className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight font-mono">
                    {formatRupiah(metrics.targetArisanTerkumpul)}
                  </h3>
                  <p className="text-[10px] text-teal-600 mt-1 font-bold bg-teal-55/65 inline-block px-2.5 py-0.5 rounded-full">
                    Target wajib bagi pemenang
                  </p>
                </div>

                {/* Stat block 2 */}
                <div className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-2xl p-4.5 shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center justify-between gap-1 text-teal-100 mb-2">
                    <p className="text-[11px] font-bold text-teal-100 uppercase tracking-widest truncate">Uang di Tangan Admin</p>
                    <Coins className="w-4 h-4 text-teal-200 self-start" />
                  </div>
                  <h3 id="stat-admin-phys" className="text-xl lg:text-2xl font-black tracking-tight font-mono">
                    {formatRupiah(metrics.moneyInAdminHand)}
                  </h3>
                  <p className="text-[10px] text-teal-50 mt-1 font-bold">
                    Pegang fisik kas saat ini
                  </p>
                </div>

                {/* Stat block 3 */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">Sisa Kas Konsumsi</p>
                    <Coffee className="w-4 h-4 text-slate-400 self-start" />
                  </div>
                  <h3
                    id="stat-kas"
                    className={`text-xl lg:text-2xl font-black tracking-tight font-mono ${
                      metrics.kasSisa < 0 ? 'text-rose-500' : 'text-slate-800'
                    }`}
                  >
                    {formatRupiah(metrics.kasSisa)}
                  </h3>
                  <p id="stat-kas-info" className="text-[10px] text-slate-500 mt-1 font-medium">
                    {metrics.kasSisa < 0 ? 'Kas minus (utang konsumsi)' : 'Saldo kas konsumsi aman'}
                  </p>
                </div>

                {/* Stat block 4 */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">Iuran Rill Masuk Bulan Ini</p>
                    <TrendingUp className="w-4 h-4 text-teal-500 self-start" />
                  </div>
                  <h3 id="stat-iuran-count" className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight font-mono">
                    {formatRupiah(metrics.totalRealIuranCurrentCollected)}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    Termasuk tebus tunggakan rill
                  </p>
                </div>
              </div>
            </div>

            {/* Content body space */}
            <div className="p-6 lg:p-10 space-y-6">
              
              {/* Closed period archive banner */}
              {activePeriod.isClosed && (
                <div id="closed-archive-banner" className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-teal-500/20">
                  <div className="flex items-start gap-4">
                    <div className="bg-teal-500/10 text-teal-400 p-3 rounded-2xl border border-teal-500/20 shrink-0">
                      <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black tracking-tight flex items-center gap-1.5 text-teal-300">
                        🔒 Periode Resmi Ditutup & Diarsipkan
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                        Seluruh putaran arisan pada periode ini telah selesai diselenggarakan. Laporan keuangan dan daftar pemenang dikunci untuk pembukuan yang sah. Ingin melanjutkan keseruan arisan dengan tim/anggota yang sama?
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="btn-reset-continue"
                    onClick={handleResetAndContinuePeriodClick}
                    className="w-full md:w-auto bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 px-6 py-3 rounded-xl font-extrabold text-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 shrink-0 border border-teal-305"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                    Reset & Lanjutkan Periode
                  </button>
                </div>
              )}
              
              {/* Unpaid Warning Banner */}
              {metrics.unpaidMembers.length > 0 && activePeriod.members.length > 0 && (
                <div id="unpaid-info-box" className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                  <div className="bg-amber-100 text-amber-800 p-2 rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">
                      Belum Membayar Iuran Putaran {activePeriod.currentRound || 1}:
                    </h4>
                    <div id="unpaid-members-list" className="flex flex-wrap gap-2 mt-2.5">
                      {metrics.unpaidMembers.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-100/80 text-amber-800 border border-amber-200 shadow-sm"
                        >
                          👤 {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Grid: Left Members (2 cols) & Right Log history (1 col) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* LEFT BLOCK: Members management list */}
                <div className="lg:col-span-2 space-y-6">
                  <div id="members-list-card" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
                    
                    {/* Toolbar filtering */}
                    <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 w-4 h-4 top-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          id="search-member"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari nama anggota..."
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow bg-white text-slate-800"
                        />
                      </div>
                      
                      {/* Action buttons list */}
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                          id="btn-lunas-semua"
                          onClick={() => {
                            if (activePeriod.isClosed) {
                              showToast('Periode ditutup: Tidak dapat mengubah status pembayaran.', 'error');
                              return;
                            }
                            handlePayAllCurrentRound();
                          }}
                          className={`flex-1 sm:flex-none text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                            activePeriod.isClosed ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : 'cursor-pointer'
                          }`}
                          title="Tandai seluruh anggota lunas membayar iuran untuk putaran ini"
                        >
                          <Check className="w-4 h-4" />
                          Lunas Semua
                        </button>
                        <button
                          id="btn-increment-round"
                          onClick={() => {
                            if (activePeriod.isClosed) {
                              showToast('Periode ditutup: Tidak dapat membuka putaran baru.', 'error');
                              return;
                            }
                            handleIncrementRound();
                          }}
                          className={`flex-1 sm:flex-none text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                            activePeriod.isClosed ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-404 border-slate-200' : 'cursor-pointer'
                          }`}
                          title="Lanjut melangkah ke putaran berikutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                          Putaran Baru
                        </button>
                        <button
                          id="btn-add-member"
                          onClick={() => {
                            if (activePeriod.isClosed) {
                              showToast('Periode ditutup: Tidak dapat menambah anggota baru.', 'error');
                              return;
                            }
                            handleOpenMemberModal();
                          }}
                          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                            activePeriod.isClosed
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
                              : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-slate-900/10'
                          }`}
                        >
                          <Plus className="w-4 h-4 text-teal-300" />
                          Anggota
                        </button>
                      </div>
                    </div>

                    {/* Members Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                            <th className="px-5 py-4 w-12 text-center">No</th>
                            <th className="px-5 py-4">Info Anggota</th>
                            <th className="px-5 py-4 text-center w-36">Iuran Bulan Ini</th>
                            <th className="px-5 py-4 text-center w-28">Aksi</th>
                          </tr>
                        </thead>
                        <tbody id="member-table-body" className="text-sm divide-y divide-slate-100">
                          {activePeriod.members.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-12 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center">
                                  <Users className="w-12 h-12 text-slate-300 mb-3" />
                                  <p className="text-sm">Belum ada anggota terdaftar. Tambahkan anggota pertama Anda!</p>
                                </div>
                              </td>
                            </tr>
                          ) : filteredMembers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-12 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center">
                                  <Search className="w-12 h-12 text-slate-200 mb-2" />
                                  <p className="text-sm">Tidak ada anggota dengan nama "{searchQuery}".</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredMembers.map((m, index) => {
                              const currentR = activePeriod.currentRound || 1;
                              const isPaidCurrent = m.payments?.some((p) => p.round === currentR) || false;

                              // Calculate missed previous rounds to see if they have debt warnings
                              const missedRounds: number[] = [];
                              for (let i = 1; i < currentR; i++) {
                                if (!m.payments?.some((p) => p.round === i)) {
                                  missedRounds.push(i);
                                }
                              }

                              return (
                                <tr key={m.id} className="hover:bg-slate-50/55 transition-colors group">
                                  {/* Row index */}
                                  <td className="px-5 py-4 text-center text-slate-400 font-medium font-mono">
                                    {activePeriod.members.findIndex((orig) => orig.id === m.id) + 1}
                                  </td>
                                  
                                  {/* Name & status badge pill */}
                                  <td className="px-5 py-4">
                                    <div className="font-extrabold text-slate-800 text-sm leading-tight">
                                      {m.name}
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap mt-1.5">
                                      {m.hasWon && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200 shadow-sm ring-1 ring-amber-400/10">
                                          <Trophy className="w-3 h-3 mr-1 text-amber-500 fill-amber-500" /> Pemenang
                                        </span>
                                      )}
                                      
                                      {missedRounds.length > 0 && (
                                        <button
                                          id={`btn-open-debt-${m.id}`}
                                          onClick={() => {
                                            if (activePeriod.isClosed) {
                                              showToast('Periode ditutup: Status piutang/tunggakan dikunci.', 'error');
                                              return;
                                            }
                                            handleOpenDebtModal(m);
                                          }}
                                          className={`inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold uppercase tracking-wider transition-colors border border-rose-200 shadow-sm ${
                                            activePeriod.isClosed ? 'opacity-65 cursor-not-allowed' : 'hover:bg-rose-100 cursor-pointer'
                                          }`}
                                          title="Terdapat iuran bulanan yang terlewat. Klik untuk melunasi."
                                        >
                                          ⚠️ Tunggakan: {missedRounds.length} Bln
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Bullet Toggle payment status */}
                                  <td className="px-5 py-4 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1 select-none">
                                      <button
                                        id={`btn-toggle-pay-${m.id}`}
                                        onClick={() => {
                                          if (activePeriod.isClosed) {
                                            showToast('Periode ditutup: Tidak dapat mengubah status iuran.', 'error');
                                            return;
                                          }
                                          handleToggleIuranCurrentRound(m.id);
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                          activePeriod.isClosed ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
                                        } ${
                                          isPaidCurrent ? 'bg-teal-500' : 'bg-slate-200'
                                        }`}
                                      >
                                        <span
                                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${
                                            isPaidCurrent ? 'translate-x-5' : 'translate-x-0'
                                          }`}
                                        />
                                      </button>
                                      <span className={`text-[10px] font-black ${isPaidCurrent ? 'text-teal-600' : 'text-slate-400'}`}>
                                        {isPaidCurrent ? 'Lunas' : 'Belum'}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Table row action buttons */}
                                  <td className="px-5 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        id={`btn-edit-member-${m.id}`}
                                        onClick={() => {
                                          if (activePeriod.isClosed) {
                                            showToast('Periode ditutup: Tidak dapat mengubah data anggota.', 'error');
                                            return;
                                          }
                                          handleEditMember(m);
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${
                                          activePeriod.isClosed
                                            ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100/30'
                                            : 'bg-slate-100/50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                                        }`}
                                        title="Ubah Anggota"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        id={`btn-del-member-${m.id}`}
                                        onClick={() => {
                                          if (activePeriod.isClosed) {
                                            showToast('Periode ditutup: Tidak dapat mengeluarkan anggota.', 'error');
                                            return;
                                          }
                                          handleDeleteMember(m.id, m.name);
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${
                                          activePeriod.isClosed
                                            ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100/30'
                                            : 'bg-slate-100/50 text-slate-600 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                                        }`}
                                        title="Keluarkan dari Arisan"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* RIGHT BLOCK: Winners Log & Expenses (1 col) */}
                <div className="space-y-6">
                  
                  {/* Riwayat Pemenang List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[460px]">
                    <div className="p-4.5 border-b border-slate-200 bg-white flex justify-between items-center z-10">
                      <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-700 p-1.5 rounded-lg shadow-sm">
                          <Trophy className="w-4 h-4 fill-amber-500 text-amber-500" />
                        </span>
                        Riwayat Pemenang
                      </h3>
                    </div>
                    <div className="p-0 overflow-y-auto flex-1 bg-slate-50/20 divide-y divide-slate-100">
                      {activePeriod.winners.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-xs">
                          <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          Belum ada undian pemenang.
                        </div>
                      ) : (
                        [...activePeriod.winners].reverse().map((w, index, arr) => {
                          const drawNumber = arr.length - index;
                          const { targetPrize, realCollectedPrize, debtGap, roundWinnersCount } = getWinnerPrizeValues(w);

                          return (
                            <div key={w.id} className="p-4 flex items-start gap-3 hover:bg-white transition-colors relative">
                              <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg rounded-xl w-10 h-10 flex items-center justify-center font-black text-xs shrink-0 self-center">
                                #{drawNumber}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-slate-800 text-xs truncate mb-1">
                                  {w.name}
                                </p>
                                <p className="text-[10px] text-teal-600 font-black">
                                  Target Hadiah: {formatRupiah(targetPrize)}
                                </p>
                                
                                {w.isPaid ? (
                                  <p className="text-[9px] text-emerald-600 font-extrabold mt-0.5 flex items-center gap-1.5">
                                    <span className="bg-emerald-50 px-1 rounded border border-emerald-200 text-[8px] text-emerald-700 inline-block font-bold">LUNAS</span>
                                    <span>Sudah Serah Uang: {formatRupiah(targetPrize)}</span>
                                  </p>
                                ) : (
                                  <p className="text-[9px] mt-0.5 leading-tight">
                                    {debtGap > 0 ? (
                                      <span className="text-rose-500 font-extrabold">
                                        ⚠️ Menunggu Dana: {formatRupiah(realCollectedPrize)} (Selisih: -{formatRupiah(debtGap)})
                                      </span>
                                    ) : (
                                      <span className="text-amber-600 font-bold">
                                        Dana Siap Diserahkan: {formatRupiah(realCollectedPrize)}
                                      </span>
                                    )}
                                  </p>
                                )}
                                
                                {roundWinnersCount > 1 && (
                                  <p className="text-[8px] text-amber-600 font-bold block mt-0.5">
                                    *(Hadiah dibagi rata {roundWinnersCount} pemenang)
                                  </p>
                                )}
                                
                                <p className="text-[9px] text-slate-400 mt-1 font-medium font-mono">
                                  Putaran {w.round} | {w.date}
                                </p>
                              </div>

                              {/* Handover Winner verification button */}
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {w.isPaid ? (
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-850 text-[9px] font-extrabold border border-green-200">
                                      Terima
                                    </span>
                                    <button
                                      id={`btn-cancel-pay-win-${w.id}`}
                                      onClick={() => {
                                        if (activePeriod.isClosed) {
                                          showToast('Periode ditutup: Status pemenang dikunci.', 'error');
                                          return;
                                        }
                                        handleCancelHandoverWinnerCek(w.id, w.name);
                                      }}
                                      className={`text-[8px] underline ${
                                        activePeriod.isClosed
                                          ? 'text-slate-400 cursor-not-allowed'
                                          : 'text-slate-400 hover:text-slate-600 cursor-pointer'
                                      }`}
                                      title="Kembalikan status ke kas belum diserahkan"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    id={`btn-pay-win-${w.id}`}
                                    onClick={() => {
                                      if (activePeriod.isClosed) {
                                        showToast('Periode ditutup: Status serah terima kas dikunci.', 'error');
                                        return;
                                      }
                                      handleHandoverWinnerCek(w.id, w.name);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black shadow-sm transition-colors ${
                                      activePeriod.isClosed
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-teal-500 hover:bg-teal-600 text-white cursor-pointer'
                                    }`}
                                    title="Catat penyerahan penuh uang hadiah ke pemenang"
                                  >
                                    Serahkan
                                  </button>
                                )}
                                
                                {/* Anulir Winner Button */}
                                <button
                                  id={`btn-del-winner-${w.id}`}
                                  onClick={() => {
                                    if (activePeriod.isClosed) {
                                      showToast('Periode ditutup: Tidak dapat menganulir pemenang.', 'error');
                                      return;
                                    }
                                    handleBatalMenang(w.memberId, w.name);
                                  }}
                                  className={`p-1 rounded-md transition-all ${
                                    activePeriod.isClosed
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer'
                                  }`}
                                  title="Batalkan Pemenang"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Cash Expenditures List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-fit">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg shadow-sm">
                          <Receipt className="w-4 h-4 text-emerald-650" />
                        </span>
                        Pengeluaran Kas
                      </h3>
                      <button
                        id="btn-add-expense"
                        onClick={() => {
                          if (activePeriod.isClosed) {
                            showToast('Periode ditutup: Tidak dapat mencatat pengeluaran kas.', 'error');
                            return;
                          }
                          handleOpenExpenseModal();
                        }}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors ${
                          activePeriod.isClosed
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                        }`}
                      >
                        + Catat Baru
                      </button>
                    </div>

                    <div className="overflow-y-auto max-h-56 rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100">
                      {activePeriod.expenses?.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          Belum ada pengeluaran kas dicatat.
                        </div>
                      ) : (
                        [...(activePeriod.expenses || [])].reverse().map((e) => (
                          <div key={e.id} className="p-3 flex items-center justify-between hover:bg-slate-100/40 transition-colors group">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-extrabold text-slate-700 truncate text-xs">
                                {e.description}
                              </p>
                              <p className="text-[9px] text-slate-400 font-medium font-mono mt-0.5">
                                {e.date}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-1.5">
                              <span className="font-bold text-rose-550 text-xs font-mono shrink-0">
                                - {formatRupiah(e.amount)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  id={`btn-edit-exp-${e.id}`}
                                  onClick={() => {
                                    if (activePeriod.isClosed) {
                                      showToast('Periode ditutup: Tidak dapat mengubah catatan pengeluaran.', 'error');
                                      return;
                                    }
                                    handleEditExpense(e);
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    activePeriod.isClosed
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 cursor-pointer'
                                  }`}
                                  title="Ubah Pengeluaran"
                                >
                                  <Edit2 className="w-3" />
                                </button>
                                <button
                                  id={`btn-del-exp-${e.id}`}
                                  onClick={() => {
                                    if (activePeriod.isClosed) {
                                      showToast('Periode ditutup: Tidak dapat menghapus catatan pengeluaran.', 'error');
                                      return;
                                    }
                                    handleDeleteExpense(e.id);
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    activePeriod.isClosed
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 cursor-pointer'
                                  }`}
                                  title="Hapus Pengeluaran"
                                >
                                  <Trash2 className="w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}
      </main>

      {/* ---------------- SUB-COMPONENTS PORTALS ---------------- */}

      {/* Universal Confirmation modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={() => {
          setIsConfirmOpen(false);
          onConfirmCallback();
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* Period Create/Edit modal */}
      <PeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        period={editingPeriod}
        onSave={handleSavePeriod}
        onDelete={handleDeletePeriod}
        clonedSisaKas={clonedSisaKasTemp}
      />

      {/* Member Create/Edit modal */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        member={editingMember}
        currentRound={activePeriod ? activePeriod.currentRound : 1}
        onSave={handleSaveMember}
      />

      {/* Expense Create/Edit modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expense={editingExpense}
        onSave={handleSaveExpense}
      />

      {/* Outstanding Historical Debt modal */}
      {activePeriod && (
        <DebtModal
          isOpen={isDebtModalOpen}
          onClose={() => {
            setIsDebtModalOpen(false);
            setDebtMember(null);
          }}
          member={debtMember}
          period={activePeriod}
          onPayDebt={handlePayDebtRound}
        />
      )}

      {/* Shuffling Lottery Kocok Winner modal */}
      {activePeriod && (
        <KocokModal
          isOpen={isKocokModalOpen}
          onClose={() => setIsKocokModalOpen(false)}
          period={activePeriod}
          onAddWinner={handleAddWinner}
        />
      )}
    </div>
  );
}
