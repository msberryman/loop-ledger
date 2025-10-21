// src/pages/Expenses.tsx
import React, { useState } from 'react';
import { storage, Expense } from '../lib/storage';
import { Card } from '../ui/card';           // use '../ui/Card' if your file is capitalized
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>(storage.getExpenses());
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const add = () => {
    const value = parseFloat(amount);
    if (!date || !category.trim() || isNaN(value)) return;
    const next: Expense[] = [
      {
        id: crypto.randomUUID(),
        date,
        category: category.trim(),
        amount: value,
        notes: notes.trim() || undefined,
      },
      ...items,
    ];
    setItems(next);
    storage.setExpenses(next);
    setDate('');
    setCategory('');
    setAmount('');
    setNotes('');
  };

  const remove = (id: string) => {
    const next = items.filter(x => x.id !== id);
    setItems(next);
    storage.setExpenses(next);
  };

  // ⬇️ This return wrapper was missing
  return (
    <>
      {/* Add expense form */}
      <Card>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input label="Category" value={category} onChange={e => setCategory(e.target.value)} placeholder="Fuel, Meals, etc." />
          <Input label="Amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <div style={{ alignSelf: 'end' }}>
            <Button onClick={add}>Add Expense</Button>
          </div>
        </div>
      </Card>

      {/* Expense list */}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {items.map(it => (
          <Card key={it.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{it.category}</strong>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{it.date}</div>
              </div>
              <div>
                <span>${it.amount.toFixed(2)}</span>
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

