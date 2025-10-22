// src/pages/Expenses.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { storage, Expense } from '../lib/storage';
import { Card } from '../ui/card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const fmtMoney = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });

function toDate(s: string) {
  const m = /^\d{4}-\d{2}-\d{2}$/.exec(s || '');
  return m ? new Date(Number(s.slice(0,4)), Number(s.slice(5,7)) - 1, Number(s.slice(8,10))) : new Date(s);
}
function isInCurrentMonth(d: Date) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const CATEGORY_OPTIONS = ['Fuel','Food','Supplies','Tolls','Parking','Repairs','Misc','Mileage'] as const;
type ViewMode = 'MTD' | 'LAST20' | 'ALL';

// Local currency field with a $ prefix (keeps the rest of the app untouched)
function CurrencyField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { label, value, onChange, placeholder = '$0.00' } = props;

  // accept digits/decimal; ignore commas/$
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[,$]/g, ''); // keep decimals, strip $ and commas
    onChange(cleaned);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ opacity: 0.85, marginBottom: 4 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.9,
            pointerEvents: 'none',
            fontWeight: 600,
          }}
        >
          $
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px 12px 10px 24px', // left padding to make room for $
            borderRadius: 10,
            border: '1px solid #232931',
            background: 'rgba(255,255,255,0.06)',
            color: 'inherit',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>(storage.getExpenses());

  // --- Add Expense form state
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [category, setCategory] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [amount, setAmount] = useState<string>(''); // raw string; we parse on submit
  const [notes, setNotes] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  // --- List view state (pills like Loops)
  const [view, setView] = useState<ViewMode>('MTD');

  const dateRef = useRef<HTMLInputElement>(null);

  // Deep link from Home: /expenses?mode=add
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'add') {
      dateRef.current?.focus();
      dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Month-to-date total (top card)
  const totalMTD = useMemo(() => {
    return items
      .filter(it => isInCurrentMonth(toDate(it.date)))
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  }, [items]);

  // Visible items based on view (match Loops’ logic)
  const visibleItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (view === 'ALL') return sorted;
    if (view === 'LAST20') return sorted.slice(0, 20);
    return sorted.filter(it => isInCurrentMonth(toDate(it.date))); // MTD
  }, [items, view]);

  async function add() {
    // parse amount; allow "$", commas in the field
    const normalized = (amount || '').replace(/[$,]/g, '');
    const value = parseFloat(normalized);

    if (!date || !category || !merchant || !normalized || isNaN(value) || value <= 0) {
      alert('Please fill Date, Category, Merchant and a positive Amount.');
      return;
    }

    setBusy(true);
    try {
      let receiptUrl: string | undefined;
      if (receiptFile) {
        receiptUrl = await fileToDataURL(receiptFile); // MVP: data URL
      }

      const next: Expense = {
        id: storage.newId?.() ?? Math.random().toString(36).slice(2,10),
        date,
        category,
        amount: value,
        merchant,
        notes: notes || undefined,
        receiptUrl,
      };

      const nextList = [next, ...items].sort((a,b) => (a.date < b.date ? 1 : -1));
      storage.setExpenses(nextList);
      setItems(nextList);

      // reset form
      setDate(new Date().toISOString().slice(0,10));
      setCategory('');
      setMerchant('');
      setAmount('');
      setNotes('');
      setReceiptFile(null);
    } finally {
      setBusy(false);
    }
  }

  function remove(id: string) {
    const next = items.filter(it => it.id !== id);
    storage.setExpenses(next);
    setItems(next);
  }

  return (
    <div className="expenses-page">
      {/* local style override to unify borders with Loops pill aesthetic */}
      <style>{`
        .expenses-page input[type="text"],
        .expenses-page input[type="date"],
        .expenses-page input[type="number"],
        .expenses-page input[type="file"],
        .expenses-page textarea,
        .expenses-page select {
          border: 1px solid #232931 !important;
          background: rgba(255,255,255,0.06);
          border-radius: 10px;
        }
      `}</style>

      {/* Month-to-Date Total */}
      <Card>
        <div style={{ textAlign: 'center' }}>
          <div style={{ opacity: 0.85, marginBottom: 8 }}>Total Expenses (MTD)</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{fmtMoney.format(totalMTD)}</div>
        </div>
      </Card>

      {/* Add Expense bubble */}
      <Card>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            inputRef={dateRef}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ opacity: 0.85, marginBottom: 4 }}>Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #232931',
                background: 'rgba(255,255,255,0.06)',
                color: 'inherit',
                outline: 'none',
              }}
            >
              <option value="" disabled>Select a category…</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <Input
            label="Merchant"
            placeholder="e.g., Shell, Chick-fil-A"
            value={merchant}
            onChange={e => setMerchant(e.target.value)}
          />

          {/* Currency field with $ prefix + $0.00 placeholder */}
          <CurrencyField
            label="Amount"
            value={amount}
            onChange={setAmount}
            placeholder="$0.00"
          />

          <Input
            label="Notes (optional)"
            placeholder="Add details…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ opacity: 0.85, marginBottom: 4 }}>Receipt (optional)</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
              style={{ padding: 8, borderRadius: 10, border: '1px solid #232931' }}
            />
          </div>
        </div>

        {/* Center the Add button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Button onClick={add} disabled={busy}>{busy ? 'Adding…' : 'Add Expense'}</Button>
        </div>
      </Card>

      {/* View switcher (pills) */}
      <div style={{ display: 'flex', marginTop: 12, justifyContent: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            border: '1px solid #232931',
            borderRadius: 10,
            overflow: 'hidden',
          }}
          aria-label="View"
        >
          {(['MTD', 'LAST20', 'ALL'] as const).map((v, i, arr) => {
            const active = view === v;
            const isLast = i === arr.length - 1;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                style={{
                  padding: '6px 10px',
                  background: active ? 'rgba(92,200,255,0.12)' : 'transparent',
                  color: 'inherit',
                  border: 'none',
                  borderRight: isLast ? 'none' : '1px solid #232931',
                  cursor: 'pointer',
                }}
                aria-pressed={active}
              >
                {v === 'MTD' ? 'Month-to-Date' : v === 'LAST20' ? 'Last 20' : 'All'}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: 12 }}>
        {visibleItems.map(it => (
          <Card key={it.id}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, alignItems: 'center' }}>
              <div style={{ opacity: 0.8 }}>
                <div style={{ fontWeight: 600 }}>{it.date}</div>
                <div>
                  {it.category}{it.merchant ? ` • ${it.merchant}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 600 }}>
                {fmtMoney.format(Number(it.amount) || 0)}
              </div>
              {it.receiptUrl ? (
                <a href={it.receiptUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                  Receipt
                </a>
              ) : <div />}
              <Button variant="ghost" onClick={() => remove(it.id)}>Delete</Button>
            </div>
            {it.notes && <div style={{ marginTop: 8 }}>{it.notes}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

// helper: file -> data URL
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
