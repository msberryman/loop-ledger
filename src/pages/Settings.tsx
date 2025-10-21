import React, { useState } from 'react';
import { storage, Settings as SettingsModel } from '../lib/storage';
import { Card } from '../ui/card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export default function SettingsPage() {
  // Load persisted settings (with safe defaults)
  const initial = storage.getSettings
    ? storage.getSettings()
    : ({ homeAddress: '', mileageRate: 0.67, autoMileage: false } as SettingsModel);

  const [homeAddress, setHomeAddress] = useState(initial.homeAddress ?? '');
  const [mileageRate, setMileageRate] = useState(
    typeof initial.mileageRate === 'number' && !Number.isNaN(initial.mileageRate)
      ? initial.mileageRate
      : 0.67
  );
  const [autoMileage, setAutoMileage] = useState(!!initial.autoMileage);

  const save = () => {
    const next: SettingsModel = {
      homeAddress: homeAddress.trim(),
      mileageRate: Number.isFinite(mileageRate) ? mileageRate : 0.67,
      autoMileage,
    };
    storage.setSettings(next);
    // (Optional) add a tiny visual acknowledgement; keeping it minimal here.
  };

  // Optional: Export All Data (loops, expenses, income/tips, settings)
  const exportAll = () => {
    const payload = {
      loops: storage.getLoops ? storage.getLoops() : [],
      expenses: storage.getExpenses ? storage.getExpenses() : [],
      // use income if available, else tips for back-compat
      income: typeof storage.getIncome === 'function' ? storage.getIncome() : storage.getTips?.() ?? [],
      settings: storage.getSettings ? storage.getSettings() : initial,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loop-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Icon-only heading (accessible via aria-label inside PageHeading) */}

      <Card>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Input
            label="Home address"
            value={homeAddress}
            onChange={e => setHomeAddress(e.target.value)}
            placeholder="123 Main St, City, ST"
          />

          <Input
            label="Mileage rate"
            type="number"
            step="0.01"
            value={String(mileageRate)}
            onChange={e => setMileageRate(parseFloat(e.target.value))}
          />

          {/* Auto-mileage toggle (simple checkbox) */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'end' }}>
            <input
              type="checkbox"
              checked={autoMileage}
              onChange={e => setAutoMileage(e.target.checked)}
            />
            Auto-mileage
          </label>

          <div style={{ alignSelf: 'end', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={save}>Save</Button>
            <Button variant="ghost" onClick={exportAll}>Export All Data</Button>
          </div>
        </div>
      </Card>
    </>
  );
}
