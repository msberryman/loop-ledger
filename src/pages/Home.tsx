import React from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { tokens } from '../ui/tokens';
import { Button } from '../ui/Button';

// money/date helpers
const fmtMoney = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const toDate = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
};
const isInCurrentMonth = (d: Date) => {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-box" style={{ borderColor: tokens.color.border, borderRadius: tokens.radius.lg }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  // Pull data
  const loops = storage.getLoops();
  const income = storage.getIncome ? storage.getIncome() : storage.getTips(); // back-compat if you haven't refactored yet
  const expenses = storage.getExpenses();

  // Month-to-date
  const mtdLoops = loops.filter(l => isInCurrentMonth(toDate(l.date)));
  const mtdIncome = income.filter((i: any) => isInCurrentMonth(toDate(i.date)));
  const mtdExpenses = expenses.filter(e => isInCurrentMonth(toDate(e.date)));

  // Totals
  const totalLoops = mtdLoops.length;

  // Total Cash = income + optional loop monetary fields
  const loopCash = mtdLoops.reduce((sum, l: any) => {
    const fee = typeof l.fee === 'number' ? l.fee : 0;
    const pre = typeof l.pregrat === 'number' ? l.pregrat : 0;
    const tip = typeof l.tip === 'number' ? l.tip : 0;
    return sum + fee + pre + tip;
  }, 0);
  const incomeCash = mtdIncome.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
  const totalCash = loopCash + incomeCash;

  const totalExpenses = mtdExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="home-wrap">
      {/* Icon-only page heading, still accessible via aria-label inside PageHeading */}

      {/* Centered primary actions */}
      <div className="home-actions">
        <div className="home-actions-inner">
          <Button onClick={() => navigate('/loops')}>Add Loop</Button>
          <Button onClick={() => navigate('/expenses')} variant="ghost">Add Expense</Button>
        </div>
      </div>

      {/* Month-to-Date stats, centered */}
      <div className="stat-grid-wrap">
        <div className="stat-grid">
          <Stat label="Total Loops (MTD)" value={String(totalLoops)} />
          <Stat label="Total Cash (MTD)" value={fmtMoney.format(totalCash)} />
          <Stat label="Total Expenses (MTD)" value={fmtMoney.format(totalExpenses)} />
        </div>
      </div>
    </div>
  );
}

