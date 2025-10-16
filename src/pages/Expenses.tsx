import React, { useState } from 'react';
import { storage, Expense } from '../lib/storage';
import { Card } from '../ui/card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';


export default function ExpensesPage() {
const [items, setItems] = useState<Expense[]>(storage.getExpenses());
const [date, setDate] = useState('');
const [category, setCategory] = useState('Mileage');
const [amount, setAmount] = useState('');


const add = () => {
const a = parseFloat(amount);
if (!date || !category || isNaN(a)) return;
const next = [{ id: crypto.randomUUID(), date, category, amount: a }, ...items];
setItems(next); storage.setExpenses(next);
setDate(''); setCategory('Mileage'); setAmount('');
};


return (
<>
<h1>Expenses</h1>
<Card>
<div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
<Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
<Input label="Category" value={category} onChange={e => setCategory(e.target.value)} />
<Input label="Amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
<div style={{ alignSelf: 'end' }}><Button onClick={add}>Add Expense</Button></div>
</div>
</Card>


<div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
{items.map(it => (
<Card key={it.id}>
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
<strong>{it.category}</strong>
<span>{it.date}</span>
</div>
<div style={{ marginTop: 6 }}>${it.amount.toFixed(2)}</div>
</Card>
))}
</div>
</>
);
}