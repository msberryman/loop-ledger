import React from 'react';
import { Card } from '../ui/Card';
import { storage } from '../lib/storage';


export default function HomePage() {
const loops = storage.getLoops();
const tips = storage.getTips();
const expenses = storage.getExpenses();
const gross = tips.reduce((a, t) => a + t.amount, 0);
const spend = expenses.reduce((a, e) => a + e.amount, 0);
return (
<>
<h1 style={{ marginBottom: '1rem' }}>Loop Ledger</h1>
<div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
<Card>
<div>Loops</div>
<div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{loops.length}</div>
</Card>
<Card>
<div>Tips</div>
<div style={{ fontSize: '1.75rem', fontWeight: 700 }}>${gross.toFixed(2)}</div>
</Card>
<Card>
<div>Expenses</div>
<div style={{ fontSize: '1.75rem', fontWeight: 700 }}>${spend.toFixed(2)}</div>
</Card>
</div>
</>
);
}