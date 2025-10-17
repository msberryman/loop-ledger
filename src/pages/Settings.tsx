import React, { useState } from 'react';
import { storage, Settings as SettingsType } from '../lib/storage';
import { Card } from '../ui/card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { flags } from '../lib/flags';


export default function SettingsPage() {
const [s, setS] = useState<SettingsType>(storage.getSettings());


const save = () => storage.setSettings(s);


return (
<>
<h1>Settings</h1>
<Card>
<div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
<Input label="Home address"
placeholder="123 Main St, City, ST"
value={s.homeAddress}
onChange={e => setS({ ...s, homeAddress: e.target.value })} />
<Input label="Mileage rate ($/mile)"
type="number" step="0.01"
value={s.mileageRate}
onChange={e => setS({ ...s, mileageRate: parseFloat(e.target.value || '0') })} />
<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
<input type="checkbox" checked={s.autoMileage} onChange={e => setS({ ...s, autoMileage: e.target.checked })} />
Auto-calculate mileage on Add Loop
</label>
<div>
<Button onClick={save}>Save</Button>
<button
  onClick={() => {
    const payload = {
      loops: JSON.parse(localStorage.getItem('loops') || '[]'),
      expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
      tips: JSON.parse(localStorage.getItem('tips') || '[]'),
      settings: JSON.parse(localStorage.getItem('settings') || '{}'),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loop-ledger-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }}
  style={{
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    cursor: 'pointer'
  }}
>
  Export All Data
</button>
</div>
</div>
</Card>


{flags.MAPS_AUTOCOMPLETE ? (
<Card className="mt-4" >
<strong>Maps Autocomplete (flagged)</strong>
<p style={{ opacity: 0.8 }}>UI placeholder — wire actual Google Places here without touching Settings contract.</p>
</Card>
) : null}
</>
);
}