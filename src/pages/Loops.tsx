import React, { useState } from 'react';
import { storage, Loop } from '../lib/storage';
import { Card } from '../ui/card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export default function LoopsPage() {
  const [items, setItems] = useState<Loop[]>(storage.getLoops());
  const [date, setDate] = useState('');
  const [course, setCourse] = useState('');
  const [notes, setNotes] = useState('');

  const add = () => {
    if (!date || !course.trim()) return;
    const next: Loop[] = [
      {
        id: crypto.randomUUID(),
        date,
        course: course.trim(),
        notes: notes.trim() || undefined,
      },
      ...items,
    ];
    setItems(next);
    storage.setLoops(next);
    setDate('');
    setCourse('');
    setNotes('');
  };

  const remove = (id: string) => {
    const next = items.filter(x => x.id !== id);
    setItems(next);
    storage.setLoops(next);
  };

  return (
    <>
      {/* Icon-only header (accessible via aria-label inside PageHeading) */}

      {/* Add form */}
      <Card>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <Input
            label="Course"
            value={course}
            onChange={e => setCourse(e.target.value)}
            placeholder="e.g., Fields Ranch"
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="players, bag count, etc."
          />
          <div style={{ alignSelf: 'end' }}>
            <Button onClick={add}>Add Loop</Button>
          </div>
        </div>
      </Card>

      {/* List */}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {items.map(it => (
          <Card key={it.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{it.course}</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>{it.date}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" onClick={() => remove(it.id)}>Delete</Button>
              </div>
            </div>
            {it.notes && <div style={{ marginTop: 8 }}>{it.notes}</div>}
          </Card>
        ))}
      </div>
    </>
  );
}
