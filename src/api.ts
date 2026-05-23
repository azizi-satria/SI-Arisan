import { Period, Member, Winner, Expense, Payment } from './types';

const API_BASE = '/api';

/**
 * Helper to fetch and auto-parse JSON from the backend
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Periods (Kelompok Arisan)
  getPeriods: (): Promise<Period[]> => 
    request<Period[]>('/periods'),

  createPeriod: (data: {
    name: string;
    targetMembers: number;
    nominalArisan: number;
    nominalKonsumsi: number;
    initialSisaKas: number;
    clonedMembers?: any[];
  }): Promise<Period> => 
    request<Period>('/periods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePeriod: (id: string, data: Partial<Period>): Promise<Period> => 
    request<Period>(`/periods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePeriod: (id: string): Promise<{ message: string; id: string }> => 
    request<{ message: string; id: string }>(`/periods/${id}`, {
      method: 'DELETE',
    }),

  // Members
  getMembers: (periodId: string): Promise<Member[]> => 
    request<Member[]>(`/periods/${periodId}/members`),

  addMember: (periodId: string, name: string): Promise<Member> => 
    request<Member>(`/periods/${periodId}/members`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  editMember: (periodId: string, memberId: string, name: string): Promise<Member> => 
    request<Member>(`/periods/${periodId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  deleteMember: (periodId: string, memberId: string): Promise<{ message: string; memberId: string }> => 
    request<{ message: string; memberId: string }>(`/periods/${periodId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  // Payments (Pembayaran Arisan)
  togglePayment: (periodId: string, memberId: string, round: number, paidInRound: number): Promise<Member> => 
    request<Member>(`/periods/${periodId}/members/${memberId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ round, paidInRound }),
    }),

  payAllCurrentRound: (periodId: string, currentRound: number): Promise<Member[]> => 
    request<Member[]>(`/periods/${periodId}/members/pay-all`, {
      method: 'POST',
      body: JSON.stringify({ currentRound }),
    }),

  // Winners (Histori Pemenang / Kocok)
  getWinners: (periodId: string): Promise<Winner[]> => 
    request<Winner[]>(`/periods/${periodId}/winners`),

  addWinner: (periodId: string, data: {
    memberId: string;
    name: string;
    date: string;
    round: number;
  }): Promise<Winner> => 
    request<Winner>(`/periods/${periodId}/winners`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWinnerPayment: (periodId: string, winnerId: string, isPaid: boolean): Promise<Winner> => 
    request<Winner>(`/periods/${periodId}/winners/${winnerId}`, {
      method: 'PUT',
      body: JSON.stringify({ isPaid }),
    }),

  deleteWinner: (periodId: string, winnerId: string): Promise<{ message: string; winnerId: string }> => 
    request<{ message: string; winnerId: string }>(`/periods/${periodId}/winners/${winnerId}`, {
      method: 'DELETE',
    }),

  // Expenses (Pengeluaran Kas)
  getExpenses: (periodId: string): Promise<Expense[]> => 
    request<Expense[]>(`/periods/${periodId}/expenses`),

  addExpense: (periodId: string, data: {
    description: string;
    amount: number;
    date: string;
  }): Promise<Expense> => 
    request<Expense>(`/periods/${periodId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  editExpense: (periodId: string, expenseId: string, data: {
    description?: string;
    amount?: number;
    date?: string;
  }): Promise<Expense> => 
    request<Expense>(`/periods/${periodId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteExpense: (periodId: string, expenseId: string): Promise<{ message: string; expenseId: string }> => 
    request<{ message: string; expenseId: string }>(`/periods/${periodId}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),
};
