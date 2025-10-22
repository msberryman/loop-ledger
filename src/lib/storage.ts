export type Loop = { id: string; date: string; course: string; miles?: number; notes?: string };

// Extended Expense type: optional merchant and receiptUrl for receipts.
// Backward compatible with existing data already in localStorage.
export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  notes?: string;
  merchant?: string;
  receiptUrl?: string; // data URL for MVP; can be swapped to remote URL later
};

export type Income = { id: string; date: string; source: string; amount: number; notes?: string };
export type Settings = { homeAddress: string; mileageRate: number; autoMileage: boolean };


const k = {
  loops: 'loops',
  expenses: 'expenses',
  income: 'income',
  tipsOld: 'tips',
  settings: 'settings',
} as const;


function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors in MVP
  }
}

// simple id helper
function id() {
  return Math.random().toString(36).slice(2, 10);
}

// Provide simple CRUD helpers in one place
export const storage = {
  getLoops: () => read<Loop[]>(k.loops, []),
  setLoops: (v: Loop[]) => write(k.loops, v),

  getExpenses: () => read<Expense[]>(k.expenses, []),
  setExpenses: (v: Expense[]) => write(k.expenses, v),

  getIncome: () => read<Income[]>(k.income, []),
  setIncome: (v: Income[]) => write(k.income, v),

  getTips: () => read<Income[]>(k.income, []),
  setTips: (v: Income[]) => write(k.income, v),

  getSettings: () => read<Settings>(k.settings, { homeAddress: '', mileageRate: 0.67, autoMileage: false }),
  setSettings: (v: Settings) => write(k.settings, v),

  // lightweight id factory for convenience
  newId: id,
};
