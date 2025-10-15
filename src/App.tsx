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

/* ========== tiny helpers ========== */
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

/* ========== toast (no deps) ========== */
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
    return () => listeners.delete(sub);
  }, []);
  return (
    <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999 }}>
      {toastItems.map((t) => (
        <div
          key={t.id}
          style={{
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            fontWeight: 600,
            minWidth: 120,
            textAlign: "center",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ========== styles (centered layout) ========== */
const page: React.CSSProperties = { minHeight: "100vh", display: "flex", flexDirection: "column" };
const container: React.CSSProperties = { width: "100%", maxWidth: 960, margin: "0 auto", padding: "0 16px" };
const main: React.CSSProperties = { flex: 1, width: "100%", padding: "16px 0" };
const tabsBar: React.CSSProperties = { position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #e5e5e5", background: "#ffffff" };
const tabs: React.CSSProperties = { display: "flex", gap: 8, padding: 8 };
const tabBase: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, textDecoration: "none", color: "inherit", border: "1px solid transparent", fontWeight: 500 };
const tabActive: React.CSSProperties = { border: "1px solid #d0d0d0", fontWeight: 700, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" };
const card: React.CSSProperties = { border: "1px solid #eee", borderRadius: 12, padding: 12 };
const row: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" };
const btn: React.CSSProperties = { padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer" };
const input: React.CSSProperties = { padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 };

/* ========== floating Home button ========== */
function HomeFab() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (pathname.includes("/home")) return null;
  return (
    <button
      onClick={() => navigate("/home")}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        padding: "10px 14px",
        borderRadius: 999,
        border: "1px solid #ddd",
        background: "#fff",
        boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Home
    </button>
  );
}

/* ========== nav tabs ========== */
function NavTabs() {
  const links = [
    { to: "/home", label: "Home" },
    { to: "/loops", label: "Loops" },
    { to: "/expenses", label: "Expenses" },
    { to: "/tips", label: "Tips" },
  ];
  return (
    <div style={tabsBar}>
      <div style={container}>
        <nav style={tabs}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} style={({ isActive }) => ({ ...tabBase, ...(isActive ? tabActive : {}) })}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ========== pages ========== */
function Home() {
  const navigate = useNavigate();
  return (
    <div>
      <h1 style={{ margin: "8px 0 12px", fontSize: 42, lineHeight: 1.1 }}>Loop Ledger</h1>
      <p style={{ marginBottom: 16 }}>Welcome! Use the tabs above to track your loops, expenses, and tips.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={btn} onClick={() => navigate("/loops")}>Go to Loops</button>
        <button style={btn} onClick={() => navigate("/expenses")}>Go to Expenses</button>
        <button style={btn} onClick={() => navigate("/tips")}>Go to Tips</button>
      </div>
    </div>
  );
}

type Loop = { id: string; date: string; course: string; rate: number; tip: number };
type Expense = { id: string; date: string; type: string; amount: number };
type Tip = { id: string; date: string; source: string; amount: number };

const loopsBox = box("loops");
const expensesBox = box("expenses");
const tipsBox = box("tips");

function Loops() {
  const [loops, setLoops] = useState<Loop[]>(() => loopsBox.get<Loop[]>([]));
  const [date, setDate] = useState(today());
  const [course, setCourse] = useState("Fields Ranch");
  const [rate, setRate] = useState("110");
  const [tip, setTip] = useState("60");

  useEffect(() => { loopsBox.set(loops); }, [loops]);

  const add = () => {
    if (!course.trim()) return alert("Course required");
    if (isNaN(Number(rate)) || isNaN(Number(tip))) return alert("Rate/Tip must be numbers");
    setLoops((prev) => [...prev, { id: makeId(), date, course: course.trim(), rate: Number(rate), tip: Number(tip) }]);
    toast("Loop added");
  };
  const del = (id: string) => {
    setLoops((prev) => prev.filter((x) => x.id !== id));
    toast("Loop deleted");
  };
  const total = useMemo(() => loops.reduce((s, x) => s + x.rate + x.tip, 0), [loops]);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Loops</h2>
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={row}>
          <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input style={input} placeholder="Course" value={course} onChange={(e) => setCourse(e.target.value)} />
          <input style={input} placeholder="Rate" value={rate} onChange={(e) => setRate(e.target.value)} />
          <input style={input} placeholder="Tip" value={tip} onChange={(e) => setTip(e.target.value)} />
          <button style={btn} onClick={add}>Add Loop</button>
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
                <small>Rate ${x.rate} + Tip ${x.tip}</small>
              </div>
              <button style={btn} onClick={() => del(x.id)}>Delete</button>
            </div>
          ))}
          <div style={{ ...card, fontWeight: 600 }}>Total (rate + tips): ${total.toFixed(2)}</div>
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
        <div style={card}>No expenses yet. Add your first expense above.</div>
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
        <div style={card}>No tips yet. Add your first tip above.</div>
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

/* ========== backup / restore / reset (optional) ========== */
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
  };
  download(`loop-ledger-backup.json`, JSON.stringify(payload, null, 2));
}
function importAll(from: unknown) {
  if (!from || typeof from !== "object") return alert("Invalid file");
  const data = from as { loops?: unknown; expenses?: unknown; tips?: unknown };
  if ("loops" in data) localStorage.setItem("loops", JSON.stringify((data as any).loops ?? []));
  if ("expenses" in data) localStorage.setItem("expenses", JSON.stringify((data as any).expenses ?? []));
  if ("tips" in data) localStorage.setItem("tips", JSON.stringify((data as any).tips ?? []));
  location.reload();
}
function resetAll() {
  if (!confirm("This will erase all local data. Continue?")) return;
  localStorage.removeItem("loops");
  localStorage.removeItem("expenses");
  localStorage.removeItem("tips");
  location.reload();
}

/* ========== app (HashRouter) ========== */
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
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </main>
        <footer style={{ borderTop: "1px solid #eee" }}>
          <div style={{ ...container, padding: "12px 0", textAlign: "center" }}>
            <small>Loop Ledger • Single-file</small>
            <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "center" }}>
              <button style={btn} onClick={exportAll}>Export backup (JSON)</button>
              <label style={{ ...btn, display: "inline-block" }}>
                Import backup…
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const text = await f.text();
                    try { importAll(JSON.parse(text)); } catch { alert("Not a valid JSON backup file."); }
                  }}
                />
              </label>
              <button style={btn} onClick={resetAll}>Reset all data</button>
            </div>
          </div>
        </footer>

        <HomeFab />
        <ToastHost />
      </div>
    </HashRouter>
  );
}
