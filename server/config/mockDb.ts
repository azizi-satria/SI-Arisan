// In-Memory Fallback Database for Arisan Pro when MongoDB Atlas is unreachable or unconfigured.

export interface IMemberMock {
  id: string;
  periodId: string;
  name: string;
  hasWon: boolean;
  payments: Array<{ round: number; paidInRound: number }>;
}

export interface IWinnerMock {
  id: string;
  periodId: string;
  memberId: string;
  name: string;
  date: string;
  round: number;
  isPaid: boolean;
}

export interface IExpenseMock {
  id: string;
  periodId: string;
  description: string;
  amount: number;
  date: string;
}

export interface IPeriodMock {
  id: string;
  name: string;
  targetMembers: number;
  nominalArisan: number;
  nominalKonsumsi: number;
  currentRound: number;
  isClosed: boolean;
  initialSisaKas: number;
  members: IMemberMock[];
  winners: IWinnerMock[];
  expenses: IExpenseMock[];
}

class MockDbStore {
  public periods: IPeriodMock[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    this.periods = [
      {
        id: "mock_p1",
        name: "Arisan Keluarga Besar RT 05",
        targetMembers: 12,
        nominalArisan: 100000,
        nominalKonsumsi: 20000,
        currentRound: 3,
        isClosed: false,
        initialSisaKas: 0,
        members: [
          { id: "mock_m1", periodId: "mock_p1", name: "Ahmad Fauzi", hasWon: true, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
          { id: "mock_m2", periodId: "mock_p1", name: "Budi Santoso", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
          { id: "mock_m3", periodId: "mock_p1", name: "Citra Lestari", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }] },
          { id: "mock_m4", periodId: "mock_p1", name: "Dewi Anggraini", hasWon: true, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
          { id: "mock_m5", periodId: "mock_p1", name: "Eko Prasetyo", hasWon: false, payments: [{ round: 1, paidInRound: 1 }] },
          { id: "mock_m6", periodId: "mock_p1", name: "Farida Putri", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
          { id: "mock_m7", periodId: "mock_p1", name: "Guntur Wibowo", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
          { id: "mock_m8", periodId: "mock_p1", name: "Heti Herawati", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] },
          { id: "mock_m9", periodId: "mock_p1", name: "Iman Sulaiman", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }] },
          { id: "mock_m10", periodId: "mock_p1", name: "Joko Widodo", hasWon: false, payments: [{ round: 1, paidInRound: 1 }, { round: 2, paidInRound: 2 }, { round: 3, paidInRound: 3 }] }
        ],
        winners: [
          { id: "mock_w1", periodId: "mock_p1", memberId: "mock_m1", name: "Ahmad Fauzi", date: "23 Mar 2026", round: 1, isPaid: true },
          { id: "mock_w2", periodId: "mock_p1", memberId: "mock_m4", name: "Dewi Anggraini", date: "12 Apr 2026", round: 2, isPaid: false }
        ],
        expenses: [
          { id: "mock_e1", periodId: "mock_p1", description: "Konsumsi Kue & Air Mineral", amount: 80000, date: "23 Mar 2026" },
          { id: "mock_e2", periodId: "mock_p1", description: "Sewa Tenda & Sound System", amount: 150000, date: "12 Apr 2026" }
        ]
      },
      {
        id: "mock_p2",
        name: "Arisan Bulanan Ibu-Ibu PKK",
        targetMembers: 6,
        nominalArisan: 50000,
        nominalKonsumsi: 10000,
        currentRound: 1,
        isClosed: false,
        initialSisaKas: 0,
        members: [
          { id: "mock_m11", periodId: "mock_p2", name: "Ibu Rahma", hasWon: false, payments: [] },
          { id: "mock_m12", periodId: "mock_p2", name: "Ibu Ani", hasWon: false, payments: [] },
          { id: "mock_m13", periodId: "mock_p2", name: "Ibu Siti", hasWon: false, payments: [] }
        ],
        winners: [],
        expenses: []
      }
    ];
  }

  // Generate safe random IDs
  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // --- PERIODS API ---
  public getPeriods(): IPeriodMock[] {
    return this.periods;
  }

  public getPeriodById(id: string): IPeriodMock | undefined {
    return this.periods.find(p => p.id === id);
  }

  public createPeriod(data: any): IPeriodMock {
    const newPeriod: IPeriodMock = {
      id: this.generateId('p'),
      name: data.name,
      targetMembers: data.targetMembers || 10,
      nominalArisan: data.nominalArisan || 0,
      nominalKonsumsi: data.nominalKonsumsi || 0,
      currentRound: data.currentRound || 1,
      isClosed: !!data.isClosed,
      initialSisaKas: data.initialSisaKas || 0,
      members: [],
      winners: [],
      expenses: []
    };

    if (Array.isArray(data.clonedMembers)) {
      newPeriod.members = data.clonedMembers.map((m: any) => ({
        id: this.generateId('m'),
        periodId: newPeriod.id,
        name: m.name,
        hasWon: false,
        payments: []
      }));
    }

    this.periods.unshift(newPeriod);
    return newPeriod;
  }

  public updatePeriod(id: string, updates: any): IPeriodMock | null {
    const period = this.getPeriodById(id);
    if (!period) return null;

    if (updates.name !== undefined) period.name = updates.name;
    if (updates.targetMembers !== undefined) period.targetMembers = Number(updates.targetMembers);
    if (updates.nominalArisan !== undefined) period.nominalArisan = Number(updates.nominalArisan);
    if (updates.nominalKonsumsi !== undefined) period.nominalKonsumsi = Number(updates.nominalKonsumsi);
    if (updates.currentRound !== undefined) period.currentRound = Number(updates.currentRound);
    if (updates.isClosed !== undefined) period.isClosed = !!updates.isClosed;
    if (updates.initialSisaKas !== undefined) period.initialSisaKas = Number(updates.initialSisaKas);

    return period;
  }

  public deletePeriod(id: string): boolean {
    const index = this.periods.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.periods.splice(index, 1);
    return true;
  }

  // --- MEMBERS API ---
  public getMembers(periodId: string): IMemberMock[] {
    const period = this.getPeriodById(periodId);
    return period ? period.members : [];
  }

  public addMember(periodId: string, name: string): IMemberMock | null {
    const period = this.getPeriodById(periodId);
    if (!period) return null;

    const newMember: IMemberMock = {
      id: this.generateId('m'),
      periodId,
      name,
      hasWon: false,
      payments: []
    };

    period.members.push(newMember);
    return newMember;
  }

  public editMember(memberId: string, name: string): IMemberMock | null {
    for (const period of this.periods) {
      const member = period.members.find(m => m.id === memberId);
      if (member) {
        member.name = name;
        return member;
      }
    }
    return null;
  }

  public deleteMember(periodId: string, memberId: string): boolean {
    const period = this.getPeriodById(periodId);
    if (!period) return false;

    period.members = period.members.filter(m => m.id !== memberId);
    period.winners = period.winners.filter(w => w.memberId !== memberId);
    return true;
  }

  // --- PAYMENTS API ---
  public togglePayment(memberId: string, round: number, paidInRound: number): IMemberMock | null {
    for (const period of this.periods) {
      const member = period.members.find(m => m.id === memberId);
      if (member) {
        const index = member.payments.findIndex(pay => pay.round === round);
        if (index > -1) {
          member.payments.splice(index, 1);
        } else {
          member.payments.push({ round, paidInRound });
        }
        return member;
      }
    }
    return null;
  }

  public payAllCurrentRound(periodId: string, currentRound: number): IMemberMock[] | null {
    const period = this.getPeriodById(periodId);
    if (!period) return null;

    for (const m of period.members) {
      const hasPaid = m.payments.some(pay => pay.round === currentRound);
      if (!hasPaid) {
        m.payments.push({ round: currentRound, paidInRound: currentRound });
      }
    }
    return period.members;
  }

  // --- WINNERS API ---
  public getWinners(periodId: string): IWinnerMock[] {
    const period = this.getPeriodById(periodId);
    return period ? period.winners : [];
  }

  public addWinner(periodId: string, winnerData: any): IWinnerMock | null {
    const period = this.getPeriodById(periodId);
    if (!period) return null;

    const newWinner: IWinnerMock = {
      id: this.generateId('w'),
      periodId,
      memberId: winnerData.memberId,
      name: winnerData.name,
      date: winnerData.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      round: Number(winnerData.round),
      isPaid: false
    };

    // Mark having won
    const member = period.members.find(m => m.id === winnerData.memberId);
    if (member) member.hasWon = true;

    period.winners.push(newWinner);
    return newWinner;
  }

  public updateWinnerPayment(winnerId: string, isPaid: boolean): IWinnerMock | null {
    for (const period of this.periods) {
      const winner = period.winners.find(w => w.id === winnerId);
      if (winner) {
        winner.isPaid = isPaid;
        return winner;
      }
    }
    return null;
  }

  public deleteWinner(periodId: string, winnerId: string): boolean {
    const period = this.getPeriodById(periodId);
    if (!period) return false;

    const winner = period.winners.find(w => w.id === winnerId);
    if (!winner) return false;

    const member = period.members.find(m => m.id === winner.memberId);
    if (member) member.hasWon = false;

    period.winners = period.winners.filter(w => w.id !== winnerId);
    return true;
  }

  // --- EXPENSES API ---
  public getExpenses(periodId: string): IExpenseMock[] {
    const period = this.getPeriodById(periodId);
    return period ? period.expenses : [];
  }

  public addExpense(periodId: string, expenseData: any): IExpenseMock | null {
    const period = this.getPeriodById(periodId);
    if (!period) return null;

    const newExpense: IExpenseMock = {
      id: this.generateId('e'),
      periodId,
      description: expenseData.description,
      amount: Number(expenseData.amount),
      date: expenseData.date
    };

    period.expenses.push(newExpense);
    return newExpense;
  }

  public editExpense(expenseId: string, data: any): IExpenseMock | null {
    for (const period of this.periods) {
      const expense = period.expenses.find(e => e.id === expenseId);
      if (expense) {
        if (data.description !== undefined) expense.description = data.description;
        if (data.amount !== undefined) expense.amount = Number(data.amount);
        if (data.date !== undefined) expense.date = data.date;
        return expense;
      }
    }
    return null;
  }

  public deleteExpense(expenseId: string): boolean {
    for (const period of this.periods) {
      const index = period.expenses.findIndex(e => e.id === expenseId);
      if (index > -1) {
        period.expenses.splice(index, 1);
        return true;
      }
    }
    return false;
  }
}

export const mockDb = new MockDbStore();
