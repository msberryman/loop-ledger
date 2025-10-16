import React, { useState } from 'react';
import { storage, Loop } from '../lib/storage';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';


export default function LoopsPage() {
const [items, setItems] = useState<Loop[]>(storage.getLoops());
const [date, setDate] = useState('');
const [course, setCourse] = useState('');
const [notes, setNotes] = useState('');


const add = () => {
if (!date || !course) return;
const next = [{ id: crypto.randomUUID(), date, course, notes }, ...items];
setItems(next); storage.setLoops(next);
setDate(''); setCourse(''); setNotes('');
};


return (
<>
<h1>Loops</h1>
<Card>
<div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
<Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
<Input label="Course" placeholder="Course name" value={course} onChange={e => setCourse(e.target.value)} />
<Input label="Notes" placeholder="Optional" value={notes} onChange={e => setNotes(e.target.value)} />
<div style={{ alignSelf: 'end' }}><Button onClick={add}>Add Loop</Button></div>
</div>
</Card>


<div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
{items.map(it => (
<Card key={it.id}>
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
<strong>{it.course}</strong>
<span>{it.date}</span>
</div>
{it.notes && <div style={{ opacity: 0.8, marginTop: 6 }}>{it.notes}</div>}
</Card>
))}
</div>
</>
);
}