import React, { useState } from 'react';
import { storage, Tip } from '../lib/storage';
import { Card } from '../ui/card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';


export default function TipsPage() {
const [items, setItems] = useState<Tip[]>(storage.getTips());
const [date, setDate] = useState('');
const [source, setSource] = useState('Cash');
const [amount, setAmount] = useState('');


const add = () => {
const a = parseFloat(amount);
if (!date || !source || isNaN(a)) return;
const next = [{ id: crypto.randomUUID(), date, source, amount: a }, ...items];
setItems(next); storage.setTips(next);
setDate(''); setSource('Cash'); setAmount('');
};


return (
<>
<h1>Tips</h1>
<Card>
<div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
<Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
<Input label="Source" value={source} onChange={e => setSource(e.target.value)} />
<Input label="Amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
<div style={{ alignSelf: 'end' }}><Button onClick={add}>Add Tip</Button></div>
</div>
</Card>


<div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
{items.map(it => (
<Card key={it.id}>
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
<strong>{it.source}</strong>
<span>{it.date}</span>
</div>
<div style={{ marginTop: 6 }}>${it.amount.toFixed(2)}</div>
</Card>
))}
</div>
</>
);
}