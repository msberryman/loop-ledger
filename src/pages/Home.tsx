// src/pages/Home.tsx
import React, { useMemo } from 'react';
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
// robust numeric coerce for old + new records
function toNum(v: unknown) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function Home() {
  // Pull from storage every render; if you want live reactive, lift to state and update on writes.
  const loops = (storage.getLoops?.() ?? []) as Array<{
    id: string;
    date?: string;
    bagFee?: number | string;
    tip?: number | string;
    pregrat?: number | string;
  }>;

  const expenses = (storage.getExpenses?.() ?? []) as Array<{
    id: string;
    date?: string;
    amount?: number | string;
  }>;

  const { totalLoops, totalCashMTD, totalExpensesMTD } = useMemo(() => {
    const loopsMTD = loops.filter(l => l.date && isInCurrentMonth(toDate(l.date!)));
    const totalLoops = loopsMTD.length;

    const totalCashMTD = loopsMTD.reduce((sum, l) => {
      // New model: bagFee + tip + pregrat; coerce old string values too
      return sum + toNum(l.bagFee) + toNum(l.tip) + toNum(l.pregrat);
    }, 0);

    const expensesMTD = expenses.filter(e => e.date && isInCurrentMonth(toDate(e.date!)));
    const totalExpensesMTD = expensesMTD.reduce((sum, e) => sum + toNum(e.amount), 0);

    return { totalLoops, totalCashMTD, totalExpensesMTD };
  }, [loops, expenses]);

  // ---- UI (keep your existing header/nav; this is just the body) ----
  return (
    <>
      {/* Your two top buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button onClick={() => (window.location.href = '/loops')}>Add Loop</Button>
        <Button variant="ghost" onClick={() => (window.location.href = '/expenses?mode=add')}>Add Expense</Button>
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