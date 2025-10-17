// src/pages/Income.tsx
import React, { useState } from 'react';
import { storage, Income as IncomeEntry } from '../lib/storage';
import { Card } from '../ui/card';            // use '../ui/Card' if your file is capitalized
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export default function IncomePage() {
  // If you completed the data-layer rename, these will be defined.
  // Otherwise we fall back to tips under the hood.
  const readIncome = () =>
    typeof storage.getIncome === 'function' ? storage.getIncome() : (storage.getTips() as IncomeEntry[]);
  const writeIncome = (next: IncomeEntry[]) =>
    typeof storage.setIncome === 'function' ? storage.setIncome(next) : storage.setTips(next);

  const [items, setItems] = useState<IncomeEntry[]>(readIncome());
  const [date, setDate] = useState('');
  const [source, setSource] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const add = () => {
    const value = parseFloat(amount);
    if (!date || !source.trim() || isNaN(value)) return;
    const next: IncomeEntry[] = [
      {
        id: crypto.randomUUID(),
        date,
        source: source.trim(),
        amount: value,
        notes: notes.trim() || undefined,
      } as IncomeEntry,
      ...items,
    ];
    setItems(next);
    writeIncome(next);
    setDate('');
    setSource('Cash');
    setAmount('');
    setNotes('');
  };

  const remove = (id: string) => {
    const next = items.filter(x => x.id !== id);
    setItems(next);
    writeIncome(next);
  };

  return (
    <>
      <h1>Income</h1>

      <Card>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input label="Source" value={source} onChange={e => setSource(e.target.value)} placeholder="Cash, Bag fee, Venmo, etc." />
          <Input label="Amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <div style={{ alignSelf: 'end' }}>
            <Button onClick={add}>Add Income</Button>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {items.map(it => (
          <Card key={it.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{it.source}</strong>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{it.date}</div>
              </div>
              <div>
                <span>${(it.amount ?? 0).toFixed(2)}</span>
              </div>
              <Button variant="ghost" onClick={() => remove(it.id)}>Delete</Button>
            </div>
            {it.notes && <div style={{ marginTop: 8 }}>{it.notes}</div>}
          </Card>
        ))}
      </div>
    </>
  );
}
