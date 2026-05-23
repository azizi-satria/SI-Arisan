import express from 'express';
import {
  getMembers,
  addMember,
  editMember,
  deleteMember,
  togglePayment,
  payAllCurrentRound,
  getWinners,
  addWinner,
  updateWinnerPayment,
  deleteWinner,
  getExpenses,
  addExpense,
  editExpense,
  deleteExpense
} from '../controllers/memberController.js';

const router = express.Router();

// Member CRUD
router.get('/:periodId/members', getMembers);
router.post('/:periodId/members', addMember);
router.put('/:periodId/members/:memberId', editMember);
router.delete('/:periodId/members/:memberId', deleteMember);

// Payments (Pembayaran Arisan / Verifikasi status)
router.post('/:periodId/members/:memberId/payments', togglePayment);
router.post('/:periodId/members/pay-all', payAllCurrentRound);

// Winners (Histori Pemenang Arisan)
router.get('/:periodId/winners', getWinners);
router.post('/:periodId/winners', addWinner);
router.put('/:periodId/winners/:winnerId', updateWinnerPayment);
router.delete('/:periodId/winners/:winnerId', deleteWinner);

// Expenses (Pengeluaran Kas Konsumsi)
router.get('/:periodId/expenses', getExpenses);
router.post('/:periodId/expenses', addExpense);
router.put('/:periodId/expenses/:expenseId', editExpense);
router.delete('/:periodId/expenses/:expenseId', deleteExpense);

export default router;
