export type Loop = { id: string; date: string; course: string; miles?: number; notes?: string };
export type Expense = { id: string; date: string; category: string; amount: number; notes?: string };
export type Tip = { id: string; date: string; source: string; amount: number; notes?: string };
export type Settings = { homeAddress: string; mileageRate: number; autoMileage: boolean };


const k = {
loops: 'loops',
expenses: 'expenses',
tips: 'tips',
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


export const storage = {
getLoops: () => read<Loop[]>(k.loops, []),
setLoops: (v: Loop[]) => write(k.loops, v),
getExpenses: () => read<Expense[]>(k.expenses, []),
setExpenses: (v: Expense[]) => write(k.expenses, v),
getTips: () => read<Tip[]>(k.tips, []),
setTips: (v: Tip[]) => write(k.tips, v),
getSettings: () => read<Settings>(k.settings, { homeAddress: '', mileageRate: 0.67, autoMileage: false }),
setSettings: (v: Settings) => write(k.settings, v),
};