import { Request, Response } from 'express';
import Period from '../models/Period.js';
import Member from '../models/Member.js';
import Winner from '../models/Winner.js';
import Expense from '../models/Expense.js';
import { isDbReady } from '../config/db.js';
import { mockDb } from '../config/mockDb.js';

// Seed data based on initialData
const listInitialPeriods = [
  {
    name: "Arisan Keluarga Besar RT 05",
    targetMembers: 12,
    nominalArisan: 100000,
    nominalKonsumsi: 20000,
    currentRound: 3,
    isClosed: false,
    initialSisaKas: 0,
    members: [
      { name: "Ahmad Fauzi", hasWon: true, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
      { name: "Budi Santoso", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
      { name: "Citra Lestari", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }] },
      { name: "Dewi Anggraini", hasWon: true, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
      { name: "Eko Prasetyo", hasWon: false, payments: [{ round: 1, paidInRound: 1 }] },
      { name: "Farida Putri", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
      { name: "Guntur Wibowo", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
      { name: "Heti Herawati", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
      { name: "Iman Sulaiman", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }] },
      { name: "Joko Widodo", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] }
    ],
    winners: [
      { name: "Ahmad Fauzi", date: "23 Mar 2026", round: 1, isPaid: true },
      { name: "Dewi Anggraini", date: "12 Apr 2026", round: 2, isPaid: false }
    ],
    expenses: [
      { description: "Konsumsi Kue & Air Mineral", amount: 80000, date: "23 Mar 2026" },
      { description: "Sewa Tenda & Sound System", amount: 150000, date: "12 Apr 2026" }
    ]
  },
  {
    name: "Arisan Bulanan Ibu-Ibu PKK",
    targetMembers: 6,
    nominalArisan: 50000,
    nominalKonsumsi: 10000,
    currentRound: 1,
    isClosed: false,
    initialSisaKas: 0,
    members: [
      { name: "Ibu Rahma", hasWon: false, payments: [] },
      { name: "Ibu Ani", hasWon: false, payments: [] },
      { name: "Ibu Siti", hasWon: false, payments: [] }
    ],
    winners: [],
    expenses: []
  }
];

// Helper to seed database
export async function seedIfNeeded() {
  if (!isDbReady()) return;
  try {
    const count = await Period.countDocuments();
    if (count > 0) return;

    console.log('🌱 Seeding database with initial arisan periods...');
    for (const p of listInitialPeriods) {
      const newPeriod = await Period.create({
        name: p.name,
        targetMembers: p.targetMembers,
        nominalArisan: p.nominalArisan,
        nominalKonsumsi: p.nominalKonsumsi,
        currentRound: p.currentRound,
        isClosed: p.isClosed,
        initialSisaKas: p.initialSisaKas
      });

      const memberIdMap: Record<string, string> = {};

      // Seed members
      for (const m of p.members) {
        const createdMember = await Member.create({
          periodId: newPeriod._id,
          name: m.name,
          hasWon: m.hasWon,
          payments: m.payments
        });
        memberIdMap[m.name] = createdMember._id.toString();
      }

      // Seed winners
      for (const w of p.winners) {
        const mappedMemberId = memberIdMap[w.name] || 'unknown';
        await Winner.create({
          periodId: newPeriod._id,
          memberId: mappedMemberId,
          name: w.name,
          date: w.date,
          round: w.round,
          isPaid: w.isPaid
        });
      }

      // Seed expenses
      for (const e of p.expenses) {
        await Expense.create({
          periodId: newPeriod._id,
          description: e.description,
          amount: e.amount,
          date: e.date
        });
      }
    }
    console.log('✅ Seeding completed!');
  } catch (err) {
    console.error('❌ Failed to seed default data:', err);
  }
}

// 1. Get all periods (assembled with subdocuments)
export const getPeriods = async (req: Request, res: Response): Promise<void> => {
  if (!isDbReady()) {
    res.json(mockDb.getPeriods());
    return;
  }
  try {
    // Check connection first
    await seedIfNeeded();

    const periodsList = await Period.find({}).sort({ createdAt: -1 });
    const assembledPeriods = [];

    for (const p of periodsList) {
      const members = await Member.find({ periodId: p._id });
      const winners = await Winner.find({ periodId: p._id }).sort({ round: 1 });
      const expenses = await Expense.find({ periodId: p._id }).sort({ createdAt: 1 });

      assembledPeriods.push({
        id: p._id.toString(),
        name: p.name,
        targetMembers: p.targetMembers,
        nominalArisan: p.nominalArisan,
        nominalKonsumsi: p.nominalKonsumsi,
        currentRound: p.currentRound,
        isClosed: p.isClosed,
        initialSisaKas: p.initialSisaKas,
        members: members.map(m => ({
          id: m._id.toString(),
          name: m.name,
          payments: m.payments,
          hasWon: m.hasWon
        })),
        winners: winners.map(w => ({
          id: w._id.toString(),
          memberId: w.memberId,
          name: w.name,
          date: w.date,
          round: w.round,
          isPaid: w.isPaid
        })),
        expenses: expenses.map(e => ({
          id: e._id.toString(),
          description: e.description,
          amount: e.amount,
          date: e.date
        }))
      });
    }

    res.json(assembledPeriods);
  } catch (error: any) {
    console.error('getPeriods error:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil data periode arisan.' });
  }
};

// 2. Create modern period
export const createPeriod = async (req: Request, res: Response): Promise<void> => {
  if (!isDbReady()) {
    const newlyCreated = mockDb.createPeriod(req.body);
    res.status(201).json(newlyCreated);
    return;
  }
  try {
    const { name, targetMembers, nominalArisan, nominalKonsumsi, initialSisaKas, clonedMembers } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Nama periode harus diisi.' });
      return;
    }

    const newPeriod = await Period.create({
      name,
      targetMembers: targetMembers || 10,
      nominalArisan: nominalArisan || 0,
      nominalKonsumsi: nominalKonsumsi || 0,
      currentRound: 1,
      isClosed: false,
      initialSisaKas: initialSisaKas || 0
    });

    // If cloning members from previous period
    if (Array.isArray(clonedMembers) && clonedMembers.length > 0) {
      for (const m of clonedMembers) {
        await Member.create({
          periodId: newPeriod._id,
          name: m.name,
          payments: [],
          hasWon: false
        });
      }
    }

    // Return the completed period item
    const members = await Member.find({ periodId: newPeriod._id });
    res.status(201).json({
      id: newPeriod._id.toString(),
      name: newPeriod.name,
      targetMembers: newPeriod.targetMembers,
      nominalArisan: newPeriod.nominalArisan,
      nominalKonsumsi: newPeriod.nominalKonsumsi,
      currentRound: newPeriod.currentRound,
      isClosed: newPeriod.isClosed,
      initialSisaKas: newPeriod.initialSisaKas,
      members: members.map(m => ({
        id: m._id.toString(),
        name: m.name,
        payments: m.payments,
        hasWon: m.hasWon
      })),
      winners: [],
      expenses: []
    });
  } catch (error: any) {
    console.error('createPeriod error:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat periode baru.' });
  }
};

// 3. Update Period generic details or round increments
export const updatePeriod = async (req: Request, res: Response): Promise<void> => {
  if (!isDbReady()) {
    const { id } = req.params;
    const updated = mockDb.updatePeriod(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Periode tidak ditemukan.' });
      return;
    }
    res.json(updated);
    return;
  }
  try {
    const { id } = req.params;
    const { name, targetMembers, nominalArisan, nominalKonsumsi, currentRound, isClosed, initialSisaKas } = req.body;

    const period = await Period.findById(id);
    if (!period) {
      res.status(404).json({ error: 'Periode tidak ditemukan.' });
      return;
    }

    if (name !== undefined) period.name = name;
    if (targetMembers !== undefined) period.targetMembers = targetMembers;
    if (nominalArisan !== undefined) period.nominalArisan = nominalArisan;
    if (nominalKonsumsi !== undefined) period.nominalKonsumsi = nominalKonsumsi;
    if (currentRound !== undefined) period.currentRound = currentRound;
    if (isClosed !== undefined) period.isClosed = isClosed;
    if (initialSisaKas !== undefined) period.initialSisaKas = initialSisaKas;

    await period.save();

    // Re-fetch everything assembled
    const members = await Member.find({ periodId: period._id });
    const winners = await Winner.find({ periodId: period._id }).sort({ round: 1 });
    const expenses = await Expense.find({ periodId: period._id });

    res.json({
      id: period._id.toString(),
      name: period.name,
      targetMembers: period.targetMembers,
      nominalArisan: period.nominalArisan,
      nominalKonsumsi: period.nominalKonsumsi,
      currentRound: period.currentRound,
      isClosed: period.isClosed,
      initialSisaKas: period.initialSisaKas,
      members: members.map(m => ({
        id: m._id.toString(),
        name: m.name,
        payments: m.payments,
        hasWon: m.hasWon
      })),
      winners: winners.map(w => ({
        id: w._id.toString(),
        memberId: w.memberId,
        name: w.name,
        date: w.date,
        round: w.round,
        isPaid: w.isPaid
      })),
      expenses: expenses.map(e => ({
        id: e._id.toString(),
        description: e.description,
        amount: e.amount,
        date: e.date
      }))
    });
  } catch (error: any) {
    console.error('updatePeriod error:', error);
    res.status(500).json({ error: error.message || 'Gagal mengubah periode.' });
  }
};

// 4. Delete Period entirely
export const deletePeriod = async (req: Request, res: Response): Promise<void> => {
  if (!isDbReady()) {
    const { id } = req.params;
    const success = mockDb.deletePeriod(id);
    if (!success) {
      res.status(404).json({ error: 'Periode tidak ditemukan.' });
      return;
    }
    res.json({ message: 'Periode arisan dan seluruh data terkait berhasil dihapus.', id });
    return;
  }
  try {
    const { id } = req.params;

    const period = await Period.findById(id);
    if (!period) {
      res.status(404).json({ error: 'Periode tidak ditemukan.' });
      return;
    }

    // Terminate associated objects
    await Member.deleteMany({ periodId: period._id });
    await Winner.deleteMany({ periodId: period._id });
    await Expense.deleteMany({ periodId: period._id });
    await Period.findByIdAndDelete(id);

    res.json({ message: 'Periode arisan dan seluruh data terkait berhasil dihapus.', id });
  } catch (error: any) {
    console.error('deletePeriod error:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus periode.' });
  }
};
