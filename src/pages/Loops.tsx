// src/pages/Loops.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { storage, Loop as BaseLoop } from '../lib/storage';
import { Card } from '../ui/card'; // use '../ui/Card' if your file is capitalized
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

type LoopType = 'Single Bag' | 'Double Bag' | 'Forecaddie';
type TipType = 'Cash' | 'Digital';

type Loop = BaseLoop & {
  reportTime?: string;
  teeTime?: string;
  loopType?: LoopType;
  bagFee?: number;
  tip?: number;
  tipType?: TipType;
  pregrat?: number;
  placeId?: string;
};

const fmtMoney = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const toDate = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
};
const isInCurrentMonth = (d: Date) => {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};
const toNum = (v: string) => (v.trim() === '' ? undefined : Number(v));
const calcTotal = (l: Partial<Loop>) => (l.bagFee ?? 0) + (l.tip ?? 0) + (l.pregrat ?? 0);

// Safe ID for older mobile browsers without crypto.randomUUID()
function safeId() {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch {}
  return `ll_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Google Places loader + Autocomplete ----------
let placesLoading: Promise<void> | null = null;
function ensurePlacesLoaded(): Promise<void> {
  if ((window as any).google?.maps?.places?.Autocomplete) return Promise.resolve();
  if (placesLoading) return placesLoading;

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.resolve(); // fallback to plain input

  placesLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return placesLoading;
}

function usePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement>,
  onPick: (name: string, placeId?: string) => void
) {
  useEffect(() => {
    let ac: any;
    let listener: any;
    let cancelled = false;

    ensurePlacesLoaded().then(() => {
      if (cancelled) return;
      const el = inputRef.current;
      if (!el || !(window as any).google?.maps?.places?.Autocomplete) return;
      ac = new (window as any).google.maps.places.Autocomplete(el, {
        types: ['establishment'],
        fields: ['name', 'place_id'],
      });
      listener = ac.addListener('place_changed', () => {
        const place = ac.getPlace?.();
        if (place?.name) onPick(place.name, place.place_id);
      });
    });

    return () => {
      cancelled = true;
      if (listener) listener.remove?.();
    };
  }, [inputRef, onPick]);
}

export default function LoopsPage() {
  const [items, setItems] = useState<Loop[]>(storage.getLoops() as Loop[]);

  // form state (keep empty string so mobile shows placeholder "$-")
  const [date, setDate] = useState('');
  const [course, setCourse] = useState('');
  const [placeId, setPlaceId] = useState<string | undefined>(undefined);
  const [reportTime, setReportTime] = useState('');
  const [teeTime, setTeeTime] = useState('');
  const [loopType, setLoopType] = useState<LoopType | undefined>(undefined);
  const [bagFee, setBagFee] = useState('');
  const [tip, setTip] = useState('');
  const [tipType, setTipType] = useState<TipType | undefined>(undefined);
  const [pregrat, setPregrat] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // list view
  const [view, setView] = useState<'MTD' | 'LAST20' | 'ALL'>('MTD');

  // Google Autocomplete
  const courseRef = useRef<HTMLInputElement>(null);
  usePlacesAutocomplete(courseRef, (name, pid) => {
    setCourse(name);
    setPlaceId(pid);
  });

  // derived list
  const visibleItems = useMemo(() => {
    if (view === 'ALL') return items;
    if (view === 'LAST20') return items.slice(0, 20);
    return items.filter(l => l.date && isInCurrentMonth(toDate(l.date))); // MTD
  }, [items, view]);

  // ---------- ADD (single definition) ----------
  const add = () => {
    const newErrors: string[] = [];
    if (!date) newErrors.push('Date is required.');
    if (!course.trim()) newErrors.push('Course is required.');
    if (!loopType) newErrors.push('Loop Type is required.');
    setErrors(newErrors);
    if (newErrors.length) return;

    try {
      const loop: Loop = {
        id: safeId(),
        date,
        course: course.trim(),
        notes: notes.trim() || undefined,
        reportTime: reportTime || undefined,
        teeTime: teeTime || undefined,
        loopType,
        bagFee: toNum(bagFee),
        tip: toNum(tip),
        tipType,
        pregrat: toNum(pregrat),
        placeId,
      };

      const next = [loop, ...items];
      setItems(next);
      storage.setLoops(next);

      // ensure you see the new item even if date isn't MTD
      try {
        const d = toDate(date);
        if (view === 'MTD' && !isInCurrentMonth(d)) setView('ALL');
      } catch {}

      // clear form
      setDate('');
      setCourse('');
      setPlaceId(undefined);
      setReportTime('');
      setTeeTime('');
      setLoopType(undefined);
      setBagFee('');
      setTip('');
      setTipType(undefined);
      setPregrat('');
      setNotes('');
      setErrors([]);
    } catch (err: any) {
      setErrors([`Could not add loop: ${err?.message || String(err)}`]);
    }
  };

  const save = (id: string, patch: Partial<Loop>) => {
    const next = items.map(it => (it.id === id ? { ...it, ...patch } : it));
    setItems(next);
    storage.setLoops(next);
  };

  const remove = (id: string) => {
    const next = items.filter(x => x.id !== id);
    setItems(next);
    storage.setLoops(next);
  };

  const currentTotal = calcTotal({
    bagFee: toNum(bagFee),
    tip: toNum(tip),
    pregrat: toNum(pregrat),
  });

  return (
    <>
      {/* Form */}
      <Card>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />

          {/* Course (Google Places Autocomplete if available) */}
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Course</label>
            <input
              ref={courseRef}
              value={course}
              onChange={e => setCourse(e.target.value)}
              placeholder="Search course"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                background: 'transparent',
                color: 'inherit',
                border: '1px solid #232931',
                outline: 'none',
              }}
            />
          </div>

          <Input label="Report Time" type="time" step={60} value={reportTime} onChange={e => setReportTime(e.target.value)} />
          <Input label="Tee Time" type="time" step={60} value={teeTime} onChange={e => setTeeTime(e.target.value)} />

          {/* Loop Type */}
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Loop Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['Single Bag', 'Double Bag', 'Forecaddie'] as LoopType[]).map(t => {
                const active = loopType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLoopType(t)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: `1px solid ${active ? '#5CC8FF' : '#232931'}`,
                      background: active ? 'rgba(92,200,255,0.12)' : 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                    aria-pressed={active}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Money inputs: mobile numeric keyboard + "$-" placeholder */}
          <LabeledMoney label="Bag Fee" value={bagFee} onChange={setBagFee} placeholder="$-" />
          <LabeledMoney label="Tip"     value={tip}     onChange={setTip}     placeholder="$-" />

          {/* Tip Type (metadata only) */}
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Tip Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Cash', 'Digital'] as TipType[]).map(t => {
                const active = tipType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipType(t)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: `1px solid ${active ? '#5CC8FF' : '#232931'}`,
                      background: active ? 'rgba(92,200,255,0.12)' : 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                    aria-pressed={active}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <LabeledMoney label="Pre-Grat" value={pregrat} onChange={setPregrat} placeholder="$-" />

          <Input
            label="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="players, bag count, etc."
          />
        </div>
      </Card>

      {/* Total preview + Add Loop */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ opacity: 0.85 }}>
          Total (current entry): {fmtMoney.format(currentTotal)}
        </div>
        <div>
          <Button type="button" onClick={add}>Add Loop</Button>
        </div>
      </div>

      {/* Validation messages */}
      {errors.length > 0 && (
        <div style={{ marginTop: 8, color: '#f87171' }}>
          {errors.map(e => <div key={e}>• {e}</div>)}
        </div>
      )}

      {/* View switcher BELOW total + add button */}
      <div style={{ display: 'flex', marginTop: 12 }}>
        <div style={{ display: 'inline-flex', border: '1px solid #232931', borderRadius: 10, overflow: 'hidden' }} aria-label="View">
          {(['MTD', 'LAST20', 'ALL'] as const).map(v => {
            const active = view === v;
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
                  borderRight: '1px solid #232931',
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
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {visibleItems.map(it => (
          <LoopRow key={it.id} loop={it} onSave={patch => save(it.id, patch)} onDelete={() => remove(it.id)} />
        ))}
      </div>
    </>
  );
}

/** Money input that keeps empty as '' and shows numeric keypad on mobile */
function LabeledMoney({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type="text"                 // keep as text to control formatting
        inputMode="decimal"         // mobile numeric keyboard
        pattern="[0-9]*[.,]?[0-9]*" // allow decimals
        placeholder={placeholder || '$-'}
        value={value}
        onChange={e => {
          const v = e.target.value.replace(/[^0-9.,]/g, '');
          onChange(v);
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          background: 'transparent',
          color: 'inherit',
          border: '1px solid #232931',
          outline: 'none',
        }}
      />
    </div>
  );
}

// ---------- Row with inline edit ----------
function LoopRow({
  loop,
  onSave,
  onDelete,
}: {
  loop: Loop;
  onSave: (patch: Partial<Loop>) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const total = calcTotal(loop);

  return (
    <Card>
      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{loop.course}</div>
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            {loop.date}
            {loop.loopType ? ` • ${loop.loopType}` : ''}
            {loop.tipType ? ` • ${loop.tipType}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>{fmtMoney.format(total)}</strong>
          <Button variant="ghost" onClick={() => setOpen(v => !v)}>{open ? 'Close' : 'Edit'}</Button>
          <Button variant="ghost" onClick={onDelete}>Delete</Button>
        </div>
      </div>

      {/* Expand to edit */}
      {open && (
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: 12 }}>
          <Field label="Date" type="date" value={loop.date} onChange={v => onSave({ date: v })} />
          <Field label="Course" value={loop.course} onChange={v => onSave({ course: v })} />
          <Field label="Report Time" type="time" step={60} value={loop.reportTime || ''} onChange={v => onSave({ reportTime: v || undefined })} />
          <Field label="Tee Time" type="time" step={60} value={loop.teeTime || ''} onChange={v => onSave({ teeTime: v || undefined })} />

          {/* Loop Type */}
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Loop Type</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['Single Bag', 'Double Bag', 'Forecaddie'] as LoopType[]).map(t => {
                const active = loop.loopType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onSave({ loopType: t })}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 10,
                      border: `1px solid ${active ? '#5CC8FF' : '#232931'}`,
                      background: active ? 'rgba(92,200,255,0.12)' : 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                    aria-pressed={active}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Bag Fee" type="text" inputMode="decimal" value={moneyStr(loop.bagFee)} onChange={v => onSave({ bagFee: toNum(v) })} />
          <Field label="Tip"     type="text" inputMode="decimal" value={moneyStr(loop.tip)}     onChange={v => onSave({ tip: toNum(v) })} />

          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Tip Type</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['Cash', 'Digital'] as TipType[]).map(t => {
                const active = loop.tipType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onSave({ tipType: t })}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 10,
                      border: `1px solid ${active ? '#5CC8FF' : '#232931'}`,
                      background: active ? 'rgba(92,200,255,0.12)' : 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                    aria-pressed={active}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <Field
            label="Pre-Grat"
            type="text"
            inputMode="decimal"
            value={moneyStr(loop.pregrat)}
            onChange={v => onSave({ pregrat: toNum(v) })}
          />
          <Field label="Notes (optional)" value={loop.notes || ''} onChange={v => onSave({ notes: v || undefined })} />
        </div>
      )}
    </Card>
  );
}

function moneyStr(v?: number) { return v == null ? '' : String(v); }

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const { label, value, onChange, type = 'text', step, inputMode } = props;
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          background: 'transparent',
          color: 'inherit',
          border: '1px solid #232931',
          outline: 'none',
        }}
      />
    </div>
  );
}


