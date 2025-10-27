import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { Card } from '../ui/card';
import { Button } from '../ui/Button';

const fmtMoney = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });

function toDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
}
function isInCurrentMonth(d: Date) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
function toNum(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function Home() {
  const navigate = useNavigate();

  const loops = storage.getLoops?.() ?? [];
  const expenses = storage.getExpenses?.() ?? [];

  const { totalLoops, totalCashMTD, totalExpensesMTD } = useMemo(() => {
    const loopsMTD = loops.filter((l: any) => l.date && isInCurrentMonth(toDate(l.date)));
    const totalLoops = loopsMTD.length;

    const totalCashMTD = loopsMTD.reduce(
      (sum: number, l: any) => sum + toNum(l.bagFee) + toNum(l.tip) + toNum(l.pregrat),
      0
    );

    const expensesMTD = expenses.filter((e: any) => e.date && isInCurrentMonth(toDate(e.date)));
    const totalExpensesMTD = expensesMTD.reduce((sum: number, e: any) => sum + toNum(e.amount), 0);

    return { totalLoops, totalCashMTD, totalExpensesMTD };
  }, [loops, expenses]);

  return (
    <>
      {/* Navigation CTAs */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button onClick={() => navigate('/loops')}>Add Loop</Button>
        <Button variant="ghost" onClick={() => navigate('/expenses?mode=add')}>Add Expense</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 12 }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ opacity: 0.85, marginBottom: 8 }}>Total Loops (MTD)</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{totalLoops}</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ opacity: 0.85, marginBottom: 8 }}>Total Cash (MTD)</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{fmtMoney.format(totalCashMTD)}</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ opacity: 0.85, marginBottom: 8 }}>Total Expenses (MTD)</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{fmtMoney.format(totalExpensesMTD)}</div>
          </div>
        </Card>
      </div>
    </>
  );
}
