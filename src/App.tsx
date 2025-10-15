import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

/* ---------------- Supabase client ---------------- */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
// guard (won’t break the app, but logs in dev)
if (!supabaseUrl || !supabaseAnon) {
  console.error("Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}
export const supabase = createClient(
  supabaseUrl ?? "http://invalid",
  supabaseAnon ?? "invalid"
);

/* ---------------- Google Maps key from env (HIDDEN from users) ---------------- */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

/* ---------------- Google Maps ambient types (TS-safe shim) ---------------- */
declare global {
  interface Window {
    google?: any;
  }
}
declare const google: any;

/* ================= Helpers & storage ================= */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const makeId = () =>
  (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}_${Math.random()}`;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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
type Loop = {
  id: string;
  date: string;
  reportTime: string; // "HH:MM"
  teeTime: string; // "HH:MM"
  course: string;
  courseLat?: number;
  courseLng?: number;
  bagFee: number;  // $
  preGrat: number; // $
  tip: number;     // $
  miles: number;
};
type Expense = { id: string; date: string; type: string; amount: number };
type Tip = { id: string; date: string; source: string; amount: number };
type Settings = {
  mileageRate: number;
  autoMileage: boolean;
  homeAddress: string;
  homeLat?: number;
  homeLng?: number;
  // NOTE: googleApiKey REMOVED from user settings — we use env instead
};

const loopsBox = box("loops");
const expensesBox = box("expenses");
const tipsBox = box("tips");
const settingsBox = box("settings");

const defaultSettings: Settings = {
  mileageRate: 0.67,
  autoMileage: true,
  homeAddress: "",
  homeLat: undefined,
  homeLng: undefined,
};

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
      listeners.delete(sub);
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
const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, minWidth: 140 };
const row: React.CSSProperties = { display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" };
const btn: React.CSSProperties = { padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer" };
const input: React.CSSProperties = { padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 };
const select: React.CSSProperties = { padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" };
const smallNote: React.CSSProperties = { color: "#666", fontSize: 12, lineHeight: 1.25 };

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
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1A2 2 0 1 1 7.6 4l.1.1a1 1 0 0 0 1.1.2h.2A1 1 0 0 0 9.6 3V3a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h.2a1 1 0 0 0 1.1-.2l.1-.1A2 2 0 1 1 20 7.6l-.1.1a1 1 0 0 0-.2 1.1v.2a1 1 0 0 0 .9.6Z"></path>
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
    padding: "8px 10px", borderRadius: 10, textDecoration: "none", color: "inherit",
    border: "1px solid transparent", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
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

/* ================= Time utils ================= */
function timeOptions(start = "04:00", end = "21:00", stepMin = 15) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const res: { value: string; label: string }[] = [];
  for (let m = startMin; m <= endMin; m += stepMin) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const value = `${pad(h)}:${pad(mm)}`;
    const ampm = h >= 12 ? "PM" : "AM";
    const hr12 = h % 12 === 0 ? 12 : h % 12;
    const label = `${hr12}:${pad(mm)} ${ampm}`;
    res.push({ value, label });
  }
  return res;
}
const REPORT_TIMES = timeOptions("04:00", "21:00", 15);
const TEE_TIMES = timeOptions("04:00", "21:00", 15);

/* ================= Distance helpers & Google loader ================= */
function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8; // miles
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

/** Load Google Maps JS (Places) once using env key */
async function loadGoogleFromEnv(): Promise<any | undefined> {
  if (typeof window === "undefined") return;
  if ((window as any).google?.maps?.places) return (window as any).google;
  if (!GOOGLE_MAPS_API_KEY) return undefined; // no key configured, skip
  if (document.getElementById("ggl-maps-js")) {
    await new Promise((r) => setTimeout(r, 800));
    return (window as any).google;
  }
  const s = document.createElement("script");
  s.id = "ggl-maps-js";
  s.async = true;
  s.defer = true;
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places`;
  document.head.appendChild(s);
  await new Promise((r) => (s.onload = () => r(null)));
  return (window as any).google;
}

/* ================= Auth Gate (Phase A) ================= */
function SignInCard() {
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirectTo = import.meta.env.DEV
    ? "http://localhost:5173/"
    : "https://msberryman.github.io/loop-ledger/";

  const onSignIn = async () => {
    if (!email || !password) return alert("Enter email and password");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const onSignUp = async () => {
    if (!email || !password) return alert("Enter email and password");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      alert(error.message);
    } else {
      toast("Check your email to confirm");
    }
  };

  const sendMagic = async () => {
    if (!email) return alert("Enter your email");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) alert(error.message);
    else toast("Magic link sent");
  };

  const isPwd = mode === "signin" || mode === "signup";

  return (
    <div style={{ ...container, paddingTop: 48 }}>
      <div style={{ ...card, maxWidth: 420, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button style={{ ...btn, fontWeight: mode === "signin" ? 700 : 600 }} onClick={() => setMode("signin")}>
            Sign in
          </button>
          <button style={{ ...btn, fontWeight: mode === "signup" ? 700 : 600 }} onClick={() => setMode("signup")}>
            Sign up
          </button>
          <button style={{ ...btn, fontWeight: mode === "magic" ? 700 : 600 }} onClick={() => setMode("magic")}>
            Magic link
          </button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <input
            style={input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {isPwd && (
            <input
              style={input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {mode === "signin" && (
            <button style={btn} onClick={onSignIn}>Sign in</button>
          )}
          {mode === "signup" && (
            <button style={btn} onClick={onSignUp}>Create account</button>
          )}
          {mode === "magic" && (
            <button style={btn} onClick={sendMagic}>Send magic link</button>
          )}

          <div style={smallNote}>
            • Password sign-in works immediately.  
            • Magic link / sign up may require email confirmation (check your inbox).
          </div>
        </div>
      </div>
      <ToastHost />
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(!!data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => { sub.subscription.unsubscribe(); mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ ...container, paddingTop: 48 }}>
        <div style={{ ...card, maxWidth: 420, margin: "0 auto", textAlign: "center" }}>Loading…</div>
      </div>
    );
  }
  if (!hasSession) return <SignInCard />;

  return <>{children}</>;
}

/* ================= Pages ================= */
// Home: minimal totals
function Home() {
  const loops = loopsBox.get<Loop[]>([]);
  const expenses = expensesBox.get<Expense[]>([]);
  const tips = tipsBox.get<Tip[]>([]);
  const loopTotal = loops.reduce((s, x) => s + x.bagFee + x.preGrat + x.tip, 0);
  const expensesTotal = expenses.reduce((s, x) => s + x.amount, 0);
  const tipsTotal = tips.reduce((s, x) => s + x.amount, 0);

  return (
    <div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={card}><b>Loops total</b><div>${loopTotal.toFixed(2)}</div></div>
        <div style={card}><b>Expenses total</b><div>${expensesTotal.toFixed(2)}</div></div>
        <div style={card}><b>Tips total</b><div>${tipsTotal.toFixed(2)}</div></div>
      </div>
    </div>
  );
}

function Loops() {
  const [loops, setLoops] = useState<Loop[]>(() => loopsBox.get<Loop[]>([]));
  const [date, setDate] = useState(today());
  const [reportTime, setReportTime] = useState("06:00");
  const [teeTime, setTeeTime] = useState("07:00");

  // Course & places
  const [course, setCourse] = useState("");
  const [courseLat, setCourseLat] = useState<number | undefined>(undefined);
  const [courseLng, setCourseLng] = useState<number | undefined>(undefined);
  const courseRef = useRef<HTMLInputElement | null>(null);

  // Money fields default to $0
  const [bagFee, setBagFee] = useState("0");
  const [preGrat, setPreGrat] = useState("0");
  const [tip, setTip] = useState("0");

  // Miles (auto when coords available; still editable)
  const [miles, setMiles] = useState("0");

  const settings = settingsBox.get<Settings>(defaultSettings);

  // Persist loops
  useEffect(() => { loopsBox.set(loops); }, [loops]);

  // Initialize Google Autocomplete on the course input using ENV key
  useEffect(() => {
    let ac: any | undefined;
    (async () => {
      const g = await loadGoogleFromEnv();
      if (!g || !courseRef.current) return;
      ac = new g.maps.places.Autocomplete(courseRef.current as HTMLInputElement, {
        fields: ["name", "geometry"],
        types: ["establishment"],
      });
      ac.addListener("place_changed", () => {
        const place = ac!.getPlace();
        const name = place?.name || courseRef.current!.value || "";
        const lat = place?.geometry?.location?.lat?.();
        const lng = place?.geometry?.location?.lng?.();
        setCourse(name);
        setCourseLat(lat);
        setCourseLng(lng);
      });
    })();
    return () => {};
  }, []); // env key is fixed; no need to depend

  // Auto-calc miles when home + course have coords
  useEffect(() => {
    if (settings.homeLat && settings.homeLng && courseLat && courseLng) {
      const dist = haversineMiles(
        { lat: settings.homeLat, lng: settings.homeLng },
        { lat: courseLat, lng: courseLng }
      );
      const val = (Math.round(dist * 10) / 10).toFixed(1);
      setMiles(val);
    }
  }, [settings.homeLat, settings.homeLng, courseLat, courseLng]);

  const add = () => {
    if (!course.trim()) return alert("Course required");

    const nBag = Number(bagFee);
    const nPre = Number(preGrat);
    const nTip = Number(tip);
    const nMiles = Number(miles);

    if ([nBag, nPre, nTip, nMiles].some((x) => isNaN(x))) {
      return alert("Bag Fee / Pre-Grat / Tip / Miles must be numbers");
    }

    const newLoop: Loop = {
      id: makeId(),
      date,
      reportTime,
      teeTime,
      course: course.trim(),
      courseLat,
      courseLng,
      bagFee: clamp(nBag, -1_000_000, 1_000_000),
      preGrat: clamp(nPre, -1_000_000, 1_000_000),
      tip: clamp(nTip, -1_000_000, 1_000_000),
      miles: Math.max(0, nMiles),
    };

    setLoops((prev) => [...prev, newLoop]);
    toast("Loop added");

    // Auto-create mileage expense
    if (settings.autoMileage && newLoop.miles > 0 && settings.mileageRate > 0) {
      const amount = Number((newLoop.miles * settings.mileageRate).toFixed(2));
      const existing = expensesBox.get<Expense[]>([]);
      const newExp: Expense = {
        id: makeId(),
        date,
        type: `Mileage (${newLoop.miles} mi @ $${settings.mileageRate}/mi)`,
        amount,
      };
      expensesBox.set([...existing, newExp]);
      toast("Mileage expense added");
    }

    // Reset quick inputs
    setCourse("");
    setCourseLat(undefined);
    setCourseLng(undefined);
    setBagFee("0");
    setPreGrat("0");
    setTip("0");
  };

  const del = (id: string) => {
    setLoops((prev) => prev.filter((x) => x.id !== id));
    toast("Loop deleted");
  };

  const total$ = useMemo(() => loops.reduce((s, x) => s + x.bagFee + x.preGrat + x.tip, 0), [loops]);
  const totalMiles = useMemo(() => loops.reduce((s, x) => s + x.miles, 0), [loops]);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Loops</h2>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={row}>
          <div style={fieldWrap}>
            <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div style={smallNote}>Date of loop</div>
          </div>

          <div style={fieldWrap}>
            <select style={select} value={reportTime} onChange={(e) => setReportTime(e.target.value)}>
              {REPORT_TIMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div style={smallNote}>Report Time (arrival)</div>
          </div>

          <div style={fieldWrap}>
            <select style={select} value={teeTime} onChange={(e) => setTeeTime(e.target.value)}>
              {TEE_TIMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div style={smallNote}>Tee Time</div>
          </div>

          <div style={{ ...fieldWrap, minWidth: 220, flex: "1 1 260px" }}>
            <input
              ref={courseRef}
              style={input}
              placeholder="Course (Google autocomplete)"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
            <div style={smallNote}>
              Start typing a golf course. We’ll auto-calc miles from your Home Address.
            </div>
          </div>

          <div style={fieldWrap}>
            <input style={input} inputMode="decimal" placeholder="0" value={bagFee} onChange={(e) => setBagFee(e.target.value)} />
            <div style={smallNote}>Bag Fee ($)</div>
          </div>

          <div style={fieldWrap}>
            <input style={input} inputMode="decimal" placeholder="0" value={preGrat} onChange={(e) => setPreGrat(e.target.value)} />
            <div style={smallNote}>Pre-Grat ($)</div>
          </div>

          <div style={fieldWrap}>
            <input style={input} inputMode="decimal" placeholder="0" value={tip} onChange={(e) => setTip(e.target.value)} />
            <div style={smallNote}>Tip ($)</div>
          </div>

          <div style={fieldWrap}>
            <input style={input} inputMode="decimal" placeholder="0" value={miles} onChange={(e) => setMiles(e.target.value)} />
            <div style={smallNote}>Miles (auto if Home + Course coords)</div>
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <button style={btn} onClick={add}>Add Loop</button>
          </div>
        </div>
      </div>

      {loops.length === 0 ? (
        <div style={card}>No loops yet. Add your first loop above.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {loops.map((x) => (
            <div key={x.id} style={{ ...card, display: "grid", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div><b>{x.course || "(no course)"}</b> • {x.date} • Report {x.reportTime} • Tee {x.teeTime}</div>
                  <small>
                    Bag ${x.bagFee.toFixed(2)} • Pre-Grat ${x.preGrat.toFixed(2)} • Tip ${x.tip.toFixed(2)} • {x.miles} mi
                  </small>
                </div>
                <button style={btn} onClick={() => del(x.id)}>Delete</button>
              </div>
            </div>
          ))}
          <div style={{ ...card, fontWeight: 600 }}>Totals: ${total$.toFixed(2)} • {totalMiles.toFixed(1)} mi</div>
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
          <div style={fieldWrap}>
            <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div style={smallNote}>Date</div>
          </div>
          <div style={fieldWrap}>
            <input style={input} placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} />
            <div style={smallNote}>Category / label</div>
          </div>
          <div style={fieldWrap}>
            <input style={input} inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={smallNote}>Amount ($)</div>
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button style={btn} onClick={add}>Add Expense</button>
          </div>
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
          <div style={fieldWrap}>
            <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div style={smallNote}>Date received</div>
          </div>
          <div style={fieldWrap}>
            <input style={input} placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} />
            <div style={smallNote}>Where the tip came from</div>
          </div>
          <div style={fieldWrap}>
            <input style={input} inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={smallNote}>Amount ($)</div>
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button style={btn} onClick={add}>Add Tip</button>
          </div>
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

  // Home address Google Autocomplete (uses ENV key)
  const homeRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    (async () => {
      const g = await loadGoogleFromEnv();
      if (!g || !homeRef.current) return;
      const ac = new g.maps.places.Autocomplete(homeRef.current as HTMLInputElement, {
        fields: ["formatted_address", "geometry"],
        types: ["address"],
      });
      ac.addListener("place_changed", () => {
        const p = ac.getPlace();
        const addr = (p?.formatted_address || homeRef.current!.value || "").toString();
        const lat = p?.geometry?.location?.lat?.();
        const lng = p?.geometry?.location?.lng?.();
        setSettings((s) => ({ ...s, homeAddress: addr, homeLat: lat, homeLng: lng }));
      });
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
  };

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Settings</h2>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={row}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 260, flex: "1 1 320px" }}>
            <input
              ref={homeRef}
              style={input}
              placeholder="Home Address (Google autocomplete)"
              value={settings.homeAddress}
              onChange={(e) => setSettings((s) => ({ ...s, homeAddress: e.target.value }))}
            />
            <div style={smallNote}>
              Used to auto-calculate miles to the selected course. Pick from Google to save exact coordinates.
            </div>
          </div>
        </div>
      </div>

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

      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><b>Account</b></div>
        <button style={btn} onClick={signOut}>Sign out</button>
      </div>

      <BackupCard />
    </div>
  );
}

/* ================= Backup UI ================= */
function BackupCard() {
  return (
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
  );
}

/* ================= App ================= */
function AppShell() {
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

export default function App() {
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
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

