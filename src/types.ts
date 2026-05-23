export interface Payment {
  round: number;       // The arisan round/month this payment covers
  paidInRound: number; // The active arisan round/month when this payment was actually made (helps track real current income)
}

export interface Member {
  id: string;
  name: string;
  payments: Payment[];
  hasWon: boolean;
}

export interface Winner {
  id: string;
  memberId: string;
  name: string;
  date: string;
  round: number;
  isPaid: boolean; // Indicates if the admin has handed over the cash pot to the winner
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface Period {
  id: string;
  name: string;
  targetMembers: number;
  nominalArisan: number;
  nominalKonsumsi: number;
  currentRound: number;
  members: Member[];
  winners: Winner[];
  expenses: Expense[];
  isClosed?: boolean;
  initialSisaKas?: number;
}
