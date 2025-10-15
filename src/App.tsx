import React, { useEffect, useMemo, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

/* ================= Helpers & storage ================= */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const makeId = () =>
  (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}_${Math.random()}`;

const box = (k: string) => ({
  get: <T,>(fallback: T) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (v: unknown) => localStorage.setItem(k, JSON.stringify(v)),
});

/* ================= Types ================= */
type Loop = { id: string; date: string; course: string; rate: number; tip: number; miles: number };
type Expense = { id: string; date: string; type: string; amount: number };
type Tip = { id: string; date: string; source: string; amount: number };
type Settings = { mileageRate: number; autoMileage: boolean };

const loopsBox = box("loops");
const expensesBox = box("expenses");
const tipsBox = box("tips");
const settingsBox = box("settings");
const defaultSettings: Settings = { mileageRate: 0.67, autoMileage: true };

/* ================= Tiny toast ================= */
type ToastItem = { id: number; msg: string };
const listeners = new Set<(items: ToastItem[]) => void>();
let toastItems: ToastItem[] = [];
function toast(msg: string) {
  const id = Date.now();
  toastItems = [...toastItems, { id, msg }];
  listeners.forEach((fn) => fn(toastItems));
  setTimeout(() => {
    toastItems = toastItems.filter((t) => t.id !== id);
    listeners.forEach((fn) => fn(toastItems));
  }, 1800);
}
function ToastHost() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const sub = () => setTick((x) => x + 1);
    listeners.add(sub);
    return () => {
      listeners.delete(sub); // return void (TS-safe)
    };
  }, []);
  return (
    <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999 }}>
      {toastItems.map((t) => (
        <div
          key={t.id}
          style={{
            marginTop: 8, padding: "10px 14px", borderRadius: 10,
            border: "1px solid #ddd", background: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontWeight: 600, minWidth: 120, textAlign: "center",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ================= Styles ================= */
const page: React.CSSProperties = { minHeight: "100vh", display: "flex", flexDirection: "column" };
const container: React.CSSProperties = { width: "100%", maxWidth: 960, margin: "0 auto", padding: "0 16px" };
const main: React.CSSProperties = { flex: 1, width: "100%", padding: "16px 0" };
const tabsBar: React.CSSProperties = { position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #e5e5e5", background: "#ffffff" };
const tabActive: React.CSSProperties = { border: "1px solid #d0d0d0", fontWeight: 700, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" };
const card: React.CSSProperties = { border: "1px solid #eee", borderRadius: 12, padding: 12 };
const row: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" };
const btn: React.CSSProperties = { padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer" };
const input: React.CSSProperties = { padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 };
const smallNote: React.CSSProperties = { color: "#666", fontSize: 12 };

/* ================= Tiny icons (inline SVG) ================= */
function IconHome({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5"></path>
      <path d="M9 22V12h6v10"></path>
      <path d="M3 10.5V22h18V10.5"></path>
    </svg>
  );
}
function IconGear({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path>
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1A2 2 0 1 1 7.6 4l.1.1a1 1 0 0 0 1.1.2h.2A1 1 0 0 0 9.6 3V3a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h.2a1 1 0 0 0 1.1-.2l.1-.1A2 2 0 1 1 20 7.6l-.1.1a1 1 0 0 0-.2 1.1v.2a1 1 0 0 0 .9.6H21a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z"></path>
    </svg>
  );
}

/* ================= Floating Home ================= */
function HomeFab() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (pathname.includes("/home")) return null;
  return (
    <button
      onClick={() => navigate("/home")}
      style={{
        position: "fixed", right: 16, bottom: 16, padding: "10px 14px",
        borderRadius: 999, border: "1px solid #ddd", background: "#fff",
        boxShadow: "0 6px 24px rgba(0,0,0,0.12)", cursor: "pointer", fontWeight: 600,
      }}
    >
      Home
    </button>
  );
}

/* ================= Nav tabs (icons for Home + Settings) ================= */
function NavTabs() {
  const links = [
    { to: "/home", label: "Home", icon: <IconHome /> },
    { to: "/loops", label: "Loops" },
    { to: "/expenses", label: "Expenses" },
    { to: "/tips", label: "Tips" },
    { to: "/settings", label: "Settings", icon: <IconGear /> },
  ];

  const tightTabs: React.CSSProperties = { display: "flex", gap: 6, padding: 6, flexWrap: "nowrap", overflowX: "auto" };
  const tightTabBase: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    textDecoration: "none",
    color: "inherit",
    border: "1px solid transparent",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  };

  return (
    <div style={tabsBar}>
      <div style={container}>
        <nav style={tightTabs}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              aria-label={l.label}
              title={l.label}
              style={({ isActive }) => ({
                ...tightTabBase,
                ...(isActive ? tabActive : {}),
              })}
            >
              {l.icon ?? l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ================= Pages ================= */
function Home() {
  const navigate = useNavigate();
  const loops = loopsBox.get<Loop[]>([]);
  const expenses = expensesBox.get<Expense[]>([]);
  const tips = tipsBox.get<Tip[]>([]);
  const loopTotal = loops.reduce((s, x) => s + x.rate + x.tip, 0);
  const expensesTotal = expenses.reduce((s, x) => s + x.amount, 0);
  const tipsTotal = tips.reduce((s, x) => s + x.amount, 0);

  return (
    <div>
      <h1 style={{ margin: "8px 0 12px", fontSize: 42, lineHeight: 1.1 }}>Loop Ledger</h1>
      <p style={{ marginBottom: 16 }}>Use the tabs to track your loops, expenses, tips, and mileage.</p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 16 }}>
        <div style={card}><b>Loops total</b><div>${loopTotal.toFixed(2)}</div></div>
        <div style={card}><b>Expenses total</b><div>${expensesTotal.toFixed(2)}</div></div>
        <div style={card}><b>Tips total</b><div>${tipsTotal.toFixed(2)}</div></div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={btn} onClick={() => navigate("/loops")}>Go to Loops</button>
        <button style={btn} onClick={() => navigate("/expenses")}>Go to Expenses</button>
        <button style={btn} onClick={() => navigate("/tips")}>Go to Tips</button>
        <button style={btn} onClick={() => navigate("/settings")}>Settings</button>
      </div>
    </div>
  );
}

function Loops() {
  const [loops, setLoops] = useState<Loop[]>(() => loopsBox.get<Loop[]>([]));
  const [date, setDate] = useState(today());
  const [course, setCourse] = useState("Fields Ranch");
  const [rate, setRate] = useState("110");
  const [tip, setTip] = useState("60");
  const [miles, setMiles] = useState("10");
  const settings = settingsBox.get<Settings>(defaultSettings);

  useEffect(() => { loopsBox.set(loops); }, [loops]);

  const add = () => {
    if (!course.trim()) return alert("Course required");
    const nRate = Number(rate), nTip = Number(tip), nMiles = Number(miles);
    if ([nRate, nTip, nMiles].some(isNaN)) return alert("Rate/Tip/Miles must be numbers");

    const newLoop: Loop = { id: makeId(), date, course: course.trim(), rate: nRate, tip: nTip, miles: nMiles };
    setLoops((prev) => [...prev, newLoop]);
    toast("Loop added");

    if (settings.autoMileage && nMiles > 0 && settings.mileageRate > 0) {
      const amount = Number((nMiles * settings.mileageRate).toFixed(2));
      const existing = expensesBox.get<Expense[]>([]);
      const newExp: Expense = { id: makeId(), date, type: `Mileage (${nMiles} mi @ $${settings.mileageRate}/mi)`, amount };
      expensesBox.set([...existing, newExp]);
      toast("Mileage expense added");
    }
  };

  const del = (id: string) => {
    setLoops((prev) => prev.filter((x) => x.id !== id));
    toast("Loop deleted");
  };

  const total = useMemo(() => loops.reduce((s, x) => s + x.rate + x.tip, 0), [loops]);
  const totalMiles = useMemo(() => loops.reduce((s, x) => s + x.miles, 0), [loops]);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Loops</h2>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={row}>
          <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input style={input} placeholder="Course" value={course} onChange={(e) => setCourse(e.target.value)} />
          <input style={input} placeholder="Rate" value={rate} onChange={(e) => setRate(e.target.value)} />
          <input style={input} placeholder="Tip" value={tip} onChange={(e) => setTip(e.target.value)} />
          <input style={input} placeholder="Miles" value={miles} onChange={(e) => setMiles(e.target.value)} />
          <button style={btn} onClick={add}>Add Loop</button>
        </div>
        <div style={smallNote}>
          Mileage rate: ${settings.mileageRate.toFixed(2)}/mi • Auto mileage: {settings.autoMileage ? "On" : "Off"} (change in Settings)
        </div>
      </div>

      {loops.length === 0 ? (
        <div style={card}>No loops yet. Add your first loop above.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {loops.map((x) => (
            <div key={x.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div><b>{x.course}</b> • {x.date}</div>
                <small>Rate ${x.rate} + Tip ${x.tip} • {x.miles} mi</small>
              </div>
              <button style={btn} onClick={() => del(x.id)}>Delete</button>
            </div>
          ))}
          <div style={{ ...card, fontWeight: 600 }}>Totals: ${total.toFixed(2)} • {totalMiles} mi</div>
        </div>
      )}
    </div>
  );
}

function Expenses() {
  const [items, setItems] = useState<Expense[]>(() => expensesBox.get<Expense[]>([]));
  const [date, setDate] = useState(today());
  const [type, setType] = useState("Mileage");
  const [amount, setAmount] = useState("20");

  useEffect(() => { expensesBox.set(items); }, [items]);

  const add = () => {
    if (!type.trim()) return alert("Type required");
    if (isNaN(Number(amount))) return alert("Amount must be a number");
    setItems((prev) => [...prev, { id: makeId(), date, type: type.trim(), amount: Number(amount) }]);
    toast("Expense added");
  };
  const del = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    toast("Expense deleted");
  };
  const total = useMemo(() => items.reduce((s, x) => s + x.amount, 0), [items]);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Expenses</h2>
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={row}>
          <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input style={input} placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} />
          <input style={input} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button style={btn} onClick={add}>Add Expense</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={card}>No expenses yet. Add one above.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((x) => (
            <div key={x.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div><b>{x.type}</b> • {x.date}</div>
                <small>${x.amount.toFixed(2)}</small>
              </div>
              <button style={btn} onClick={() => del(x.id)}>Delete</button>
            </div>
          ))}
          <div style={{ ...card, fontWeight: 600 }}>Total expenses: ${total.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}

function Tips() {
  const [items, setItems] = useState<Tip[]>(() => tipsBox.get<Tip[]>([]));
  const [date, setDate] = useState(today());
  const [source, setSource] = useState("Venmo");
  const [amount, setAmount] = useState("60");

  useEffect(() => { tipsBox.set(items); }, [items]);

  const add = () => {
    if (!source.trim()) return alert("Source required");
    if (isNaN(Number(amount))) return alert("Amount must be a number");
    setItems((prev) => [...prev, { id: makeId(), date, source: source.trim(), amount: Number(amount) }]);
    toast("Tip added");
  };
  const del = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    toast("Tip deleted");
  };
  const total = useMemo(() => items.reduce((s, x) => s + x.amount, 0), [items]);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Tips</h2>
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={row}>
          <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input style={input} placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} />
          <input style={input} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button style={btn} onClick={add}>Add Tip</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={card}>No tips yet. Add one above.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((x) => (
            <div key={x.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div><b>{x.source}</b> • {x.date}</div>
                <small>${x.amount.toFixed(2)}</small>
              </div>
              <button style={btn} onClick={() => del(x.id)}>Delete</button>
            </div>
          ))}
          <div style={{ ...card, fontWeight: 600 }}>Total tips: ${total.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(() => settingsBox.get<Settings>(defaultSettings));
  useEffect(() => { settingsBox.set(settings); }, [settings]);
  const setNum = (k: keyof Settings, v: string) => {
    const n = Number(v); if (isNaN(n)) return;
    setSettings((s) => ({ ...s, [k]: n } as Settings));
  };

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Settings</h2>
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={row}>
          <label>
            Mileage rate ($/mi)
            <input style={{ ...input, marginLeft: 8, width: 120 }} value={settings.mileageRate}
              onChange={(e) => setNum("mileageRate", e.target.value)} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={settings.autoMileage}
              onChange={(e) => setSettings((s) => ({ ...s, autoMileage: e.target.checked }))} />
            Auto-create mileage expense on add loop
          </label>
        </div>
      </div>

      <div style={card}>
        <b>Backup & Reset</b>
        <div style={{ ...row, marginTop: 8 }}>
          <button style={btn} onClick={exportAll}>Export backup (JSON)</button>
          <label style={{ ...btn, display: "inline-block" }}>
            Import backup…
            <input
              type="file" accept="application/json" style={{ display: "none" }}
              onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const text = await f.text();
                try { importAll(JSON.parse(text)); toast("Backup imported"); }
                catch { alert("Not a valid JSON backup file."); }
              }}
            />
          </label>
          <button style={btn} onClick={resetAll}>Reset all data</button>
        </div>
      </div>
    </div>
  );
}

/* ================= App ================= */
export default function App() {
  return (
    <HashRouter>
      <div style={page}>
        <NavTabs />
        <main style={main}>
          <div style={container}>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/loops" element={<Loops />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </main>

        <footer style={{ borderTop: "1px solid #eee" }}>
          <div style={{ ...container, padding: "12px 0", textAlign: "center" }}>
            <small>Loop Ledger • Single-file</small>
          </div>
        </footer>

        <HomeFab />
        <ToastHost />
      </div>
    </HashRouter>
  );
}

/* ============== Backup helpers (bottom so they’re in scope) ============== */
function download(filename: string, text: string, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function exportAll() {
  const payload = {
    loops: JSON.parse(localStorage.getItem("loops") || "[]"),
    expenses: JSON.parse(localStorage.getItem("expenses") || "[]"),
    tips: JSON.parse(localStorage.getItem("tips") || "[]"),
    settings: JSON.parse(localStorage.getItem("settings") || JSON.stringify(defaultSettings)),
  };
  download(`loop-ledger-backup.json`, JSON.stringify(payload, null, 2));
}
function importAll(from: unknown) {
  if (!from || typeof from !== "object") return alert("Invalid file");
  const data = from as { loops?: unknown; expenses?: unknown; tips?: unknown; settings?: unknown };
  if ("loops" in data) localStorage.setItem("loops", JSON.stringify((data as any).loops ?? []));
  if ("expenses" in data) localStorage.setItem("expenses", JSON.stringify((data as any).expenses ?? []));
  if ("tips" in data) localStorage.setItem("tips", JSON.stringify((data as any).tips ?? []));
  if ("settings" in data) localStorage.setItem("settings", JSON.stringify((data as any).settings ?? defaultSettings));
  location.reload();
}
function resetAll() {
  if (!confirm("This will erase all local data. Continue?")) return;
  localStorage.removeItem("loops");
  localStorage.removeItem("expenses");
  localStorage.removeItem("tips");
  localStorage.removeItem("settings");
  location.reload();
}
