import { Period } from './types';

export const initialPeriods: Period[] = [
  {
    id: "p1",
    name: "Arisan Keluarga Besar RT 05",
    targetMembers: 12,
    nominalArisan: 100000,
    nominalKonsumsi: 20000,
    currentRound: 3,
    members: [
      {
        id: "m1",
        name: "Ahmad Fauzi",
        hasWon: true,
        payments: [
          { round: 1, paidInRound: 1 },
          { round: 2, paidInRound: 2 },
          { round: 3, paidInRound: 3 }
        ]
      },
      {
        id: "m2",
        name: "Budi Santoso",
        hasWon: false,
        payments: [
          { round: 1, paidInRound: 1 },
          { round: 2, paidInRound: 2 },
          { round: 3, paidInRound: 3 }
        ]
      },
      {
        id: "m3",
        name: "Citra Lestari",
        hasWon: false,
        payments: [
          { round: 1, paidInRound: 1 },
          { round: 2, paidInRound: 2 }
          // missed round 3
        ]
      },
      {
        id: "m4",
        name: "Dewi Anggraini",
        hasWon: true,
        payments: [
          { round: 1, paidInRound: 1 },
          { round: 2, paidInRound: 2 },
          { round: 3, paidInRound: 3 }
        ]
      },
      {
        id: "m5",
        name: "Eko Prasetyo",
        hasWon: false,
        payments: [
          { round: 1, paidInRound: 1 }
          // missed round 2 and 3
        ]
      },
      {
        id: "m6",
        name: "Farida Putri",
        hasWon: false,
        payments: [
          { round: 1, paidInRound: 1 },
          { round: 2, paidInRound: 2 },
          { round: 3, paidInRound: 3 }
        ]
      },
      {
        id: "m7",
        name: "Guntur Wibowo",
        hasWon: false,
        payments: [
          { round: 1, paidInRound: 1 },
          { round: 2, paidInRound: 2 },
          { round: 3, paidInRound: 3 }
        ]
      },
      {
        id: "m8",
        name: "Heti Herawati",
        hasWon: false,
        payments: [
          { round: 1, paidInRound: 1 },
          { round: 2, paidInRound: 2 },
          { round: 3, paidInRound: 3 }
        ]
      },
      {
        id: "m9",
        name: "Iman Sulaiman",
        hasWon: false,
        payments: [
          { round: 1, paidInRound: 1 },
          { round: 2, paidInRound: 2 }
          // missed round 3
        ]
      },
      {
        id: "m10",
        name: "Joko Widodo",
        hasWon: false,
        payments: [
          { round: 1, paidInRound: 1 },
          { round: 2, paidInRound: 2 },
          { round: 3, paidInRound: 3 }
        ]
      }
    ],
    winners: [
      {
        id: "w1",
        memberId: "m1",
        name: "Ahmad Fauzi",
        date: "23 Mar 2026",
        round: 1,
        isPaid: true
      },
      {
        id: "w2",
        memberId: "m4",
        name: "Dewi Anggraini",
        date: "12 Apr 2026",
        round: 2,
        isPaid: false
      }
    ],
    expenses: [
      {
        id: "e1",
        description: "Konsumsi Kue & Air Mineral",
        amount: 80000,
        date: "23 Mar 2026"
      },
      {
        id: "e2",
        description: "Sewa Tenda & Sound System",
        amount: 150000,
        date: "12 Apr 2026"
      }
    ]
  },
  {
    id: "p2",
    name: "Arisan Bulanan Ibu-Ibu PKK",
    targetMembers: 6,
    nominalArisan: 50000,
    nominalKonsumsi: 10000,
    currentRound: 1,
    members: [
      {
        id: "m11",
        name: "Ibu Rahma",
        hasWon: false,
        payments: []
      },
      {
        id: "m12",
        name: "Ibu Ani",
        hasWon: false,
        payments: []
      },
      {
        id: "m13",
        name: "Ibu Siti",
        hasWon: false,
        payments: []
      }
    ],
    winners: [],
    expenses: []
  }
];
