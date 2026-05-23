import express from 'express';
import { getPeriods, createPeriod, updatePeriod, deletePeriod } from '../controllers/periodController.js';

const router = express.Router();

router.get('/', getPeriods);
router.post('/', createPeriod);
router.put('/:id', updatePeriod);
router.delete('/:id', deletePeriod);

export default router;
