export type Loop = { id: string; date: string; course: string; miles?: number; notes?: string };
export type Expense = { id: string; date: string; category: string; amount: number; notes?: string };
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
const raw = localStorage.getItem(key);
if (!raw) return fallback;
try { return JSON.parse(raw) as T; } catch { return fallback; }
}


function write<T>(key: string, value: T) {
localStorage.setItem(key, JSON.stringify(value));
}

(function migrateTipsToIncomeOnce() {
  const income = read<Income[]>(k.income, []);
  if (income.length > 0) return;
  const oldTips = read<any[]>(k.tipsOld, []);
  if (oldTips.length > 0) {
    write(k.income, oldTips);
  }
})();

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
};