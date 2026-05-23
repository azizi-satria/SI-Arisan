import { Request, Response } from 'express';
import Member from '../models/Member.js';
import Winner from '../models/Winner.js';
import Expense from '../models/Expense.js';
import Period from '../models/Period.js';
import { isDbReady } from '../config/db.js';
import { mockDb } from '../config/mockDb.js';

// --- MEMBERS CRUD ---

// Get all members for a period
export const getMembers = async (req: Request, res: Response): Promise<void> => {
  const { periodId } = req.params;
  if (!periodId) {
    res.status(400).json({ error: 'ID Periode harus diberikan.' });
    return;
  }

  if (!isDbReady()) {
    res.json(mockDb.getMembers(periodId));
    return;
  }

  try {
    const members = await Member.find({ periodId });
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal memuat daftar anggota.' });
  }
};

// Add member
export const addMember = async (req: Request, res: Response): Promise<void> => {
  const { periodId } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'Nama anggota tidak boleh kosong.' });
    return;
  }

  if (!isDbReady()) {
    const result = mockDb.addMember(periodId, name.trim());
    if (!result) {
      res.status(404).json({ error: 'Periode tidak ditemukan.' });
      return;
    }
    res.status(201).json(result);
    return;
  }

  try {
    const newMember = await Member.create({
      periodId,
      name: name.trim(),
      payments: [],
      hasWon: false
    });

    res.status(201).json(newMember);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal menambahkan anggota.' });
  }
};

// Update member name
export const editMember = async (req: Request, res: Response): Promise<void> => {
  const { memberId } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'Nama anggota tidak boleh kosong.' });
    return;
  }

  if (!isDbReady()) {
    const result = mockDb.editMember(memberId, name.trim());
    if (!result) {
      res.status(404).json({ error: 'Anggota tidak ditemukan.' });
      return;
    }
    res.json(result);
    return;
  }

  try {
    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ error: 'Anggota tidak ditemukan.' });
      return;
    }

    member.name = name.trim();
    await member.save();

    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal mengubah anggota.' });
  }
};

// Delete member
export const deleteMember = async (req: Request, res: Response): Promise<void> => {
  const { periodId, memberId } = req.params;

  if (!isDbReady()) {
    const success = mockDb.deleteMember(periodId, memberId);
    if (!success) {
      res.status(404).json({ error: 'Anggota tidak ditemukan.' });
      return;
    }
    res.json({ message: 'Anggota berhasil dikeluarkan dari arisan.', memberId });
    return;
  }

  try {
    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ error: 'Anggota tidak ditemukan.' });
      return;
    }

    // Delete member and their associated winner references if any
    await Member.findByIdAndDelete(memberId);
    await Winner.deleteMany({ periodId, memberId });

    res.json({ message: 'Anggota berhasil dikeluarkan dari arisan.', memberId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal menghapus anggota.' });
  }
};


// --- ARISAN PAYMENTS ENDPOINTS ---

// Pembayaran iuran / toggle status lunas
export const togglePayment = async (req: Request, res: Response): Promise<void> => {
  const { memberId } = req.params;
  const { round, paidInRound } = req.body;

  if (round === undefined || paidInRound === undefined) {
    res.status(400).json({ error: 'Data putaran iuran tidak lengkap.' });
    return;
  }

  if (!isDbReady()) {
    const result = mockDb.togglePayment(memberId, Number(round), Number(paidInRound));
    if (!result) {
      res.status(404).json({ error: 'Anggota tidak ditemukan.' });
      return;
    }
    res.json(result);
    return;
  }

  try {
    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ error: 'Anggota tidak ditemukan.' });
      return;
    }

    // Check if they already paid this round
    const existingIndex = member.payments.findIndex(p => p.round === Number(round));

    if (existingIndex > -1) {
      // Remove payment (unverify)
      member.payments.splice(existingIndex, 1);
    } else {
      // Add payment
      member.payments.push({
        round: Number(round),
        paidInRound: Number(paidInRound)
      });
    }

    await member.save();
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal mengubah status pembayaran.' });
  }
};

// Pay all members for current round (bulk verification)
export const payAllCurrentRound = async (req: Request, res: Response): Promise<void> => {
  const { periodId } = req.params;
  const { currentRound } = req.body;

  if (!currentRound) {
    res.status(400).json({ error: 'Putaran aktif saat ini harus dikirim.' });
    return;
  }

  if (!isDbReady()) {
    const results = mockDb.payAllCurrentRound(periodId, Number(currentRound));
    if (!results) {
      res.status(404).json({ error: 'Periode tidak ditemukan.' });
      return;
    }
    res.json(results);
    return;
  }

  try {
    const members = await Member.find({ periodId });
    const roundNum = Number(currentRound);

    for (const member of members) {
      const hasPaid = member.payments.some(pay => pay.round === roundNum);
      if (!hasPaid) {
        member.payments.push({
          round: roundNum,
          paidInRound: roundNum
        });
        await member.save();
      }
    }

    const updatedMembers = await Member.find({ periodId });
    res.json(updatedMembers);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal melunasi seluruh iuran.' });
  }
};


// --- HISTORI WINNER ENDPOINTS (KOCOK) ---

export const getWinners = async (req: Request, res: Response): Promise<void> => {
  const { periodId } = req.params;

  if (!isDbReady()) {
    res.json(mockDb.getWinners(periodId));
    return;
  }

  try {
    const winners = await Winner.find({ periodId }).sort({ round: 1 });
    res.json(winners);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal memuat histori pemenang.' });
  }
};

export const addWinner = async (req: Request, res: Response): Promise<void> => {
  const { periodId } = req.params;
  const { memberId, name, date, round } = req.body;

  if (!memberId || !name || !round) {
    res.status(400).json({ error: 'Informasi pemenang tidak lengkap.' });
    return;
  }

  if (!isDbReady()) {
    const result = mockDb.addWinner(periodId, { memberId, name, date, round });
    if (!result) {
      res.status(404).json({ error: 'Periode tidak ditemukan.' });
      return;
    }
    res.status(201).json(result);
    return;
  }

  try {
    // 1. Create winner record
    const winner = await Winner.create({
      periodId,
      memberId,
      name,
      date: date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      round,
      isPaid: false
    });

    // 2. Mark member hasWon as true
    await Member.findByIdAndUpdate(memberId, { hasWon: true });

    res.status(201).json(winner);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal mencatat pemenang arisan.' });
  }
};

export const updateWinnerPayment = async (req: Request, res: Response): Promise<void> => {
  const { winnerId } = req.params;
  const { isPaid } = req.body;

  if (!isDbReady()) {
    const result = mockDb.updateWinnerPayment(winnerId, !!isPaid);
    if (!result) {
      res.status(404).json({ error: 'Pemenang tidak ditemukan.' });
      return;
    }
    res.json(result);
    return;
  }

  try {
    const winner = await Winner.findById(winnerId);
    if (!winner) {
      res.status(404).json({ error: 'Pemenang tidak ditemukan.' });
      return;
    }

    winner.isPaid = !!isPaid;
    await winner.save();

    res.json(winner);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal mengubah status serah terima.' });
  }
};

export const deleteWinner = async (req: Request, res: Response): Promise<void> => {
  const { periodId, winnerId } = req.params;

  if (!isDbReady()) {
    const success = mockDb.deleteWinner(periodId, winnerId);
    if (!success) {
      res.status(404).json({ error: 'Data pemenang tidak ditemukan.' });
      return;
    }
    res.json({ message: 'Pembatalan pemenang berhasil.', winnerId });
    return;
  }

  try {
    const winner = await Winner.findById(winnerId);
    if (!winner) {
      res.status(404).json({ error: 'Data pemenang tidak ditemukan.' });
      return;
    }

    // Demote member hasWon state
    await Member.findOneAndUpdate(
      { periodId, _id: winner.memberId },
      { hasWon: false }
    );

    await Winner.findByIdAndDelete(winnerId);

    res.json({ message: 'Pembatalan pemenang berhasil.', winnerId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal menganulir pemenang.' });
  }
};


// --- CONSUMPTION EXPENSES ENDPOINTS ---

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  const { periodId } = req.params;

  if (!isDbReady()) {
    res.json(mockDb.getExpenses(periodId));
    return;
  }

  try {
    const expenses = await Expense.find({ periodId }).sort({ createdAt: 1 });
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal memuat pengeluaran kas.' });
  }
};

export const addExpense = async (req: Request, res: Response): Promise<void> => {
  const { periodId } = req.params;
  const { description, amount, date } = req.body;

  if (!description || !amount || !date) {
    res.status(400).json({ error: 'Data pengeluaran tidak lengkap.' });
    return;
  }

  if (!isDbReady()) {
    const result = mockDb.addExpense(periodId, { description, amount, date });
    if (!result) {
      res.status(404).json({ error: 'Periode tidak ditemukan.' });
      return;
    }
    res.status(201).json(result);
    return;
  }

  try {
    const expense = await Expense.create({
      periodId,
      description,
      amount: Number(amount),
      date
    });

    res.status(201).json(expense);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal mencatat pengeluaran kas.' });
  }
};

export const editExpense = async (req: Request, res: Response): Promise<void> => {
  const { expenseId } = req.params;
  const { description, amount, date } = req.body;

  if (!isDbReady()) {
    const result = mockDb.editExpense(expenseId, { description, amount, date });
    if (!result) {
      res.status(404).json({ error: 'Pengeluaran tidak ditemukan.' });
      return;
    }
    res.json(result);
    return;
  }

  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      res.status(404).json({ error: 'Pengeluaran tidak ditemukan.' });
      return;
    }

    if (description !== undefined) expense.description = description;
    if (amount !== undefined) expense.amount = Number(amount);
    if (date !== undefined) expense.date = date;

    await expense.save();
    res.json(expense);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal mengubah pengeluaran.' });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  const { expenseId } = req.params;

  if (!isDbReady()) {
    const success = mockDb.deleteExpense(expenseId);
    if (!success) {
      res.status(404).json({ error: 'Pengeluaran tidak ditemukan.' });
      return;
    }
    res.json({ message: 'Pengeluaran berhasil dihapus.', expenseId });
    return;
  }

  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      res.status(404).json({ error: 'Pengeluaran tidak ditemukan.' });
      return;
    }

    await Expense.findByIdAndDelete(expenseId);
    res.json({ message: 'Pengeluaran berhasil dihapus.', expenseId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal menghapus pengeluaran.' });
  }
};
