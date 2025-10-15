import React, { useEffect, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

/* ================================
   Supabase + env
   ================================ */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hidden Google key (from .env), not shown to users
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
  | string
  | undefined;

/* ================================
   Local storage helpers
   ================================ */
const ls = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = localStorage.getItem(k);
      return v == null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set<T>(k: string, v: T) {
    localStorage.setItem(k, JSON.stringify(v));
  },
  getStr(k: string, fallback = "") {
    const v = localStorage.getItem(k);
    return v == null ? fallback : v;
  },
  setStr(k: string, v: string) {
    localStorage.setItem(k, v);
  },
};

/* ================================
   Types
   ================================ */
type Loop = {
  id: string;
  date: string;
  reportTime?: string;
  teeTime?: string;
  course: string;
  bagFee: number;
  preGrat: number;
  tip: number;
  miles?: number;
};
type Expense = { id: string; date: string; amount: number; note?: string };
type TipItem = { id: string; date: string; amount: number; note?: string };
type SettingsData = { homeAddress: string; mileageRate: number; autoMileage: boolean };

/* ================================
   App root (auth gate)
   ================================ */
export default function App() {
  const [session, setSession] = useState<
    Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]
  >(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!session) return <SignInCard />;

  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}

/* ================================
   Shell + tabs
   ================================ */
function AppShell() {
  return (
    <div>
      <header style={header}>
        <nav style={tabs}>
          <NavLink to="/home" style={link} title="Home">
            <span style={iconBox}>🏠</span>
          </NavLink>
          <NavLink to="/loops" style={link}>Loops</NavLink>
          <NavLink to="/expenses" style={link}>Expenses</NavLink>
          <NavLink to="/tips" style={link}>Tips</NavLink>
          <div style={{ flex: 1 }} />
          <NavLink to="/settings" style={link} title="Settings">
            <span style={iconBox}>⚙️</span>
          </NavLink>
        </nav>
      </header>

      <main style={main}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/loops" element={<LoopsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/tips" element={<TipsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}

/* ================================
   Sign in / Sign up (password only)
   ================================ */
function SignInCard() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If you ever re-enable confirmations, this is where the link would send them back.
  const redirectTo = import.meta.env.DEV
    ? "http://localhost:5173/#/home"
    : "https://msberryman.github.io/loop-ledger/#/home";

  const onSubmit = async () => {
    setErr(null);
    if (!email || !password) {
      setErr("Enter an email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;

        // If email confirmations are disabled (as I suggested), data.session will exist and you’re signed in immediately.
        // If confirmations are ON, no session yet; we surface a friendly message.
        if (!data.session) {
          setErr("Check your inbox to confirm your email, then come back here to sign in.");
        }
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...page }}>
      <div style={{ ...card, maxWidth: 420 }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>Loop Ledger</h2>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            style={{ ...btn, background: mode === "signin" ? "#111" : "#555" }}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            style={{ ...btn, background: mode === "signup" ? "#111" : "#555" }}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        {err && (
          <div style={{ background: "#ffe8e6", border: "1px solid #ffb3ab", color: "#a40000", padding: 10, borderRadius: 8, marginBottom: 10 }}>
            {err}
          </div>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          <input
            style={input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            style={input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
          <button style={btn} onClick={onSubmit} disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <div style={smallNote}>
            Password sign-in works immediately. If your project requires email confirmation, you’ll get an email first.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================
   Home
   ================================ */
function HomePage() {
  const navigate = useNavigate();
  return (
    <div style={page}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Home</h2>
        <p>Use the tabs above to track your loops, expenses, and tips.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btn} onClick={() => navigate("/loops")}>Go to Loops</button>
          <button style={btn} onClick={() => navigate("/expenses")}>Go to Expenses</button>
          <button style={btn} onClick={() => navigate("/tips")}>Go to Tips</button>
        </div>
      </div>
    </div>
  );
}

/* ================================
   Loops
   ================================ */
function LoopsPage() {
  const [loops, setLoops] = useState<Loop[]>(ls.get<Loop[]>("loops", []));
  const [draft, setDraft] = useState<Loop>({
    id: "",
    date: todayISO(),
    reportTime: "",
    teeTime: "",
    course: "",
    bagFee: 0,
    preGrat: 0,
    tip: 0,
  });

  useEffect(() => ls.set("loops", loops), [loops]);

  const addLoop = () => {
    if (!draft.course || !draft.date) return alert("Enter date and course");
    setLoops((prev) => [
      {
        ...draft,
        id: cryptoId(),
        bagFee: Number(draft.bagFee || 0),
        preGrat: Number(draft.preGrat || 0),
        tip: Number(draft.tip || 0),
      },
      ...prev,
    ]);
    setDraft({
      id: "",
      date: todayISO(),
      reportTime: "",
      teeTime: "",
      course: "",
      bagFee: 0,
      preGrat: 0,
      tip: 0,
    });
  };

  const remove = (id: string) => setLoops((prev) => prev.filter((l) => l.id !== id));

  return (
    <div style={page}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Add Loop</h2>
        <div style={grid2}>
          <div>
            <label style={label}>Date</label>
            <input style={input} type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </div>
          <div>
            <label style={label}>Course</label>
            <input style={input} placeholder="Course" value={draft.course} onChange={(e) => setDraft({ ...draft, course: e.target.value })} />
          </div>
          <div>
            <label style={label}>Report time</label>
            <input style={input} type="time" value={draft.reportTime} onChange={(e) => setDraft({ ...draft, reportTime: e.target.value })} />
          </div>
          <div>
            <label style={label}>Tee time</label>
            <input style={input} type="time" value={draft.teeTime} onChange={(e) => setDraft({ ...draft, teeTime: e.target.value })} />
          </div>
          <div>
            <label style={label}>Bag fee ($)</label>
            <input style={input} inputMode="decimal" value={draft.bagFee} onChange={(e) => setDraft({ ...draft, bagFee: Number(e.target.value || 0) })} />
          </div>
          <div>
            <label style={label}>Pre-grat ($)</label>
            <input style={input} inputMode="decimal" value={draft.preGrat} onChange={(e) => setDraft({ ...draft, preGrat: Number(e.target.value || 0) })} />
          </div>
          <div>
            <label style={label}>Tip ($)</label>
            <input style={input} inputMode="decimal" value={draft.tip} onChange={(e) => setDraft({ ...draft, tip: Number(e.target.value || 0) })} />
          </div>
        </div>
        <button style={btn} onClick={addLoop}>Add loop</button>
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Recent Loops</h3>
        {loops.length === 0 ? (
          <div style={muted}>No loops yet.</div>
        ) : (
          <ul style={list}>
            {loops.map((l) => (
              <li key={l.id} style={row}>
                <div>
                  <div style={{ fontWeight: 600 }}>{l.course}</div>
                  <div style={mutedSmall}>
                    {l.date} • Bag ${l.bagFee.toFixed(2)} • Pre-grat ${l.preGrat.toFixed(2)} • Tip ${l.tip.toFixed(2)}
                  </div>
                </div>
                <button style={btnSmall} onClick={() => remove(l.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ================================
   Expenses
   ================================ */
function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>(ls.get<Expense[]>("expenses", []));
  const [draft, setDraft] = useState<Expense>({ id: "", date: todayISO(), amount: 0, note: "" });

  useEffect(() => ls.set("expenses", items), [items]);

  const add = () => {
    if (!draft.amount) return alert("Enter amount");
    setItems((p) => [{ ...draft, id: cryptoId(), amount: Number(draft.amount) }, ...p]);
    setDraft({ id: "", date: todayISO(), amount: 0, note: "" });
  };
  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));

  return (
    <div style={page}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Add Expense</h2>
        <div style={grid2}>
          <div>
            <label style={label}>Date</label>
            <input style={input} type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </div>
          <div>
            <label style={label}>Amount ($)</label>
            <input style={input} inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value || 0) })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Note</label>
            <input style={input} placeholder="Optional" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </div>
        </div>
        <button style={btn} onClick={add}>Add expense</button>
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Recent Expenses</h3>
        {items.length === 0 ? (
          <div style={muted}>No expenses yet.</div>
        ) : (
          <ul style={list}>
            {items.map((x) => (
              <li key={x.id} style={row}>
                <div>
                  <div style={{ fontWeight: 600 }}>${x.amount.toFixed(2)}</div>
                  <div style={mutedSmall}>{x.date}{x.note ? ` • ${x.note}` : ""}</div>
                </div>
                <button style={btnSmall} onClick={() => remove(x.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ================================
   Tips
   ================================ */
function TipsPage() {
  const [items, setItems] = useState<TipItem[]>(ls.get<TipItem[]>("tips", []));
  const [draft, setDraft] = useState<TipItem>({ id: "", date: todayISO(), amount: 0, note: "" });

  useEffect(() => ls.set("tips", items), [items]);

  const add = () => {
    if (!draft.amount) return alert("Enter amount");
    setItems((p) => [{ ...draft, id: cryptoId(), amount: Number(draft.amount) }, ...p]);
    setDraft({ id: "", date: todayISO(), amount: 0, note: "" });
  };
  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));

  return (
    <div style={page}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Add Tip</h2>
        <div style={grid2}>
          <div>
            <label style={label}>Date</label>
            <input style={input} type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </div>
          <div>
            <label style={label}>Amount ($)</label>
            <input style={input} inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value || 0) })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Note</label>
            <input style={input} placeholder="Optional" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </div>
        </div>
        <button style={btn} onClick={add}>Add tip</button>
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Recent Tips</h3>
        {items.length === 0 ? (
          <div style={muted}>No tips yet.</div>
        ) : (
          <ul style={list}>
            {items.map((x) => (
              <li key={x.id} style={row}>
                <div>
                  <div style={{ fontWeight: 600 }}>${x.amount.toFixed(2)}</div>
                  <div style={mutedSmall}>{x.date}{x.note ? ` • ${x.note}` : ""}</div>
                </div>
                <button style={btnSmall} onClick={() => remove(x.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ================================
   Settings
   ================================ */
function SettingsPage() {
  const [username, setUsername] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [settings, setSettings] = useState<SettingsData>(() => ({
    homeAddress: ls.getStr("homeAddress", ""),
    mileageRate: Number(ls.getStr("mileageRate", "0.67")),
    autoMileage: ls.getStr("autoMileage", "true") === "true",
  }));

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("profiles")
          .upsert({ user_id: user.id })
          .select("username")
          .single();
        if (data?.username) setUsername(data.username);
      } catch (e) {
        console.warn("profiles upsert (settings) note:", e);
      }
      setLoadingProfile(false);
    })();
  }, []);

  const saveUsername = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;
    try {
      await supabase.from("profiles").upsert({ user_id: user.id, username }).select().single();
      alert("Username saved");
    } catch (e: any) {
      alert(e?.message ?? "Failed to save username");
    }
  };

  const saveLocal = () => {
    ls.setStr("homeAddress", settings.homeAddress);
    ls.setStr("mileageRate", String(settings.mileageRate));
    ls.setStr("autoMileage", String(settings.autoMileage));
    alert("Settings saved");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    location.reload();
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Google Maps key present?", !!GOOGLE_MAPS_API_KEY);
    }
  }, []);

  return (
    <div style={{ ...page, gap: 12 }}>
      <div style={{ ...card, maxWidth: 800 }}>
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        {loadingProfile ? (
          <div>Loading…</div>
        ) : (
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto" }}>
            <div>
              <label style={label}>Username</label>
              <input style={input} placeholder="your-username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <div style={smallNote}>Must be unique.</div>
            </div>
            <div style={{ alignSelf: "end" }}>
              <button style={btn} onClick={saveUsername}>Save username</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ ...card, maxWidth: 800 }}>
        <h3 style={{ marginTop: 0 }}>Settings</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={label}>Home Address</label>
            <input
              style={input}
              placeholder="Start typing your address…"
              value={settings.homeAddress}
              onChange={(e) => setSettings((s) => ({ ...s, homeAddress: e.target.value }))}
            />
            <div style={smallNote}>Used to auto-calc miles to courses. (API key is hidden in app config.)</div>
          </div>

          <div>
            <label style={label}>Mileage rate ($/mi)</label>
            <input
              style={{ ...input, maxWidth: 160 }}
              inputMode="decimal"
              value={settings.mileageRate}
              onChange={(e) => setSettings((s) => ({ ...s, mileageRate: Number(e.target.value || 0) }))}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={settings.autoMileage}
              onChange={(e) => setSettings((s) => ({ ...s, autoMileage: e.target.checked }))}
            />
            Auto-create mileage expense on add loop
          </label>

          <div>
            <button style={btn} onClick={saveLocal}>Save settings</button>
            <button style={{ ...btn, marginLeft: 8 }} onClick={signOut}>Sign out</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================
   Styles
   ================================ */
const header: React.CSSProperties = { position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #eee" };
const tabs: React.CSSProperties = { display: "flex", gap: 8, padding: "10px 12px", alignItems: "center", maxWidth: 1100, margin: "0 auto" };
const link = ({ isActive }: any) => ({
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: isActive ? "#000" : "#333",
  background: isActive ? "#f2f2f2" : "transparent",
  fontWeight: 600,
});
const iconBox: React.CSSProperties = { display: "inline-block", width: 20, textAlign: "center" };
const main: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: 12 };
const page: React.CSSProperties = { display: "grid", gap: 12, alignContent: "start" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.04)" };
const input: React.CSSProperties = { width: "100%", border: "1px solid #ccc", borderRadius: 8, padding: "10px 12px", fontSize: 15 };
const btn: React.CSSProperties = { appearance: "none", border: "1px solid #111", background: "#111", color: "#fff", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const btnSmall: React.CSSProperties = { ...btn, padding: "6px 10px" };
const label: React.CSSProperties = { display: "block", fontWeight: 600, marginBottom: 6 };
const grid2: React.CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 10 };
const muted: React.CSSProperties = { color: "#666" };
const mutedSmall: React.CSSProperties = { color: "#777", fontSize: 13 };
const smallNote: React.CSSProperties = { color: "#666", fontSize: 13, marginTop: 4 };
const list: React.CSSProperties = { margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 };
const row: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #eee", borderRadius: 10, padding: 10 };

/* ================================
   Utils
   ================================ */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function cryptoId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch {}
  return Math.random().toString(36).slice(2);
}
