import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink } from "react-router-dom";

const PROXY = "https://loop-ledger-proxy.loopledger.workers.dev";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Compress a picked image to a data URL (max side ~1280px)
async function resizeToDataURL(file: File, maxSide = 1280): Promise<string> {
  const img = new Image();
  const data = await file.arrayBuffer();
  const blobUrl = URL.createObjectURL(new Blob([data]));
  try {
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = (e) => rej(e);
      img.src = blobUrl;
    });
    const { width, height } = img;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    // JPEG ~0.85 quality; tweak if needed
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}


// Compress an image to ~1000px max side, JPEG quality 0.7, return data URL
async function compressImageToDataURL(file: File): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const maxDim = 1000;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL("image/jpeg", 0.7);
}


/* ---------- Types ---------- */
type Home = { placeId: string; address: string } | null;
type Course = { placeId: string; name: string; address: string };
type LoopType = "Single" | "Double" | "Forecaddie";
type Loop = {
  id: string;
  date: string;
  reportTime?: string;   // NEW
  teeTime?: string;
  courseId: string;
  courseName: string;
  type: LoopType;
  basePay: number;
  tipCash: number;
  tipDigital: number;
  preGrat?: number;      // NEW
  milesWalked?: number;
  players?: string;
  notes?: string;
  waitMins?: number;     // NEW (computed when saving)

};

const DEFAULT_BASE_PAY: Record<LoopType, number> = {
  Single: 70,
  Double: 80,
  Forecaddie: 64,
};

function timeToMinutes(t?: string | null) {
  if (!t) return null;
  const [hh, mm] = t.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

type Purchase = {
  id: string;
  date: string;                // YYYY-MM-DD
  category: ExpenseCategory;
  merchant?: string;
  amount: number;
  note?: string;
receiptUrl?: string;   // data URL of the compressed image

}; // <-- close the type here

const CATEGORIES: ExpenseCategory[] = ["Food & Bev", "Gear & Supplies", "Misc"];

/* ---------- Bottom Tabs ---------- */
function Tabs() {
  const base = "px-3 py-2 rounded-md text-sm font-medium";
  const active = "bg-black text-white";
  const inactive = "bg-transparent text-black";
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        gap: 8,
        justifyContent: "space-around",
        padding: 8,
        borderTop: "1px solid #ddd",
        background: "#fff",
      }}
    >
      <NavLink to="/loops" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>Loops</NavLink>
      <NavLink to="/expenses" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>Expenses</NavLink>
      <NavLink to="/money" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>Money</NavLink>
      <NavLink to="/settings" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>Settings</NavLink>
    </nav>
  );
}

/* ---------- Placeholder Screens ---------- */
function Screen({ title }: { title: string }) {
  return (
    <div style={{ padding: 16, paddingBottom: 72 }}>
      <h1 style={{ margin: "8px 0 16px", fontSize: 24 }}>{title}</h1>
      <p>Placeholder screen. We’ll wire this up next.</p>
    </div>
  );
}

/* ---------- Settings (Home + Courses) ---------- */


function SettingsScreen() {
// MILEAGE RATE ($/mile)
const [rate, setRate] = useState<number>(() => {
  const raw = localStorage.getItem("settings.mileageRate");
  const n = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(n) ? n : 0.67; // default; you can change anytime
});
useEffect(() => {
  localStorage.setItem("settings.mileageRate", String(rate));
}, [rate]);
 
 // HOME
  const [qHome, setQHome] = useState("");
  const [resHome, setResHome] = useState<any[]>([]);
  const [msgHome, setMsgHome] = useState("");
  const [loadingHome, setLoadingHome] = useState(false);
  const [home, setHome] = useState<Home>(() => {
    try { return JSON.parse(localStorage.getItem("settings.home") || "null"); } catch { return null; }
  });
  useEffect(() => { if (home) setQHome(home.address); }, [home]);

  async function searchHome() {
    setMsgHome(""); setResHome([]);
    if (!qHome || qHome.trim().length < 4) { setMsgHome("Type at least 4 characters."); return; }
    setLoadingHome(true);
    try {
      const r = await fetch(PROXY + "/api/places/autocomplete?kind=address&input=" + encodeURIComponent(qHome.trim()));
      const data = await r.json();
      setResHome(data.predictions || []);
      if (!data.predictions?.length) setMsgHome("No matches.");
    } catch { setMsgHome("Search failed."); }
    finally { setLoadingHome(false); }
  }
  function saveHome(item: any) {
    const h = { placeId: item.place_id, address: item.description };
    localStorage.setItem("settings.home", JSON.stringify(h));
    setHome(h); setResHome([]); setMsgHome("Saved ✅");
  }
  function clearHome() {
    localStorage.removeItem("settings.home"); setHome(null); setQHome(""); setMsgHome("Cleared.");
  }

  // COURSES
  const [qCourse, setQCourse] = useState("");
  const [resCourse, setResCourse] = useState<any[]>([]);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [courses, setCourses] = useState<Course[]>(() => {
    try { return JSON.parse(localStorage.getItem("settings.courses") || "[]"); } catch { return []; }
  });
  function persistCourses(next: Course[]) {
    localStorage.setItem("settings.courses", JSON.stringify(next));
    setCourses(next);
  }
  async function searchCourse() {
    setResCourse([]); if (!qCourse || qCourse.trim().length < 3) return;
    setLoadingCourse(true);
    try {
      const r = await fetch(PROXY + "/api/places/autocomplete?input=" + encodeURIComponent(qCourse.trim()));
      const data = await r.json();
      const filtered = (data.predictions || []).filter((p: any) => {
        const t = (p.description || "").toLowerCase();
        return t.includes("golf") || t.includes("club") || t.includes("links") || t.includes("course");
      });
      setResCourse(filtered);
    } finally { setLoadingCourse(false); }
  }
  async function addCourse(pred: any) {
    const r = await fetch(PROXY + "/api/places/details?placeId=" + encodeURIComponent(pred.place_id));
    const d = await r.json();
    const c: Course = { placeId: d.placeId || pred.place_id, name: d.name || pred.structured_formatting?.main_text || "Unknown", address: d.address || pred.description };
    if (courses.some(x => x.placeId === c.placeId)) return;
    persistCourses([...courses, c]);
    setResCourse([]);
    setQCourse("");
  }
  function removeCourse(id: string) {
    persistCourses(courses.filter(c => c.placeId !== id));
  }

  return (
    <div style={{ padding: 16, paddingBottom: 72 }}>
      <h1 style={{ margin: "8px 0 16px", fontSize: 24 }}>Settings</h1>

      {/* HOME */}
      <section style={{ marginTop: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Home Address (for mileage)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={qHome} onChange={(e) => setQHome(e.target.value)} placeholder="Start typing your home address…" style={{ flex: 1, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, fontSize: 14 }}/>
          <button onClick={searchHome} disabled={loadingHome} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #000", background: "#000", color: "#fff", cursor: "pointer" }}>{loadingHome ? "Searching…" : "Find"}</button>
        </div>
        {home && (
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <div>Saved Home: <b>{home.address}</b></div>
            <button onClick={clearHome} style={{ marginTop: 6, background: "transparent", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Clear</button>
          </div>
        )}
        {msgHome && <div style={{ marginTop: 8, color: "#555" }}>{msgHome}</div>}
        {resHome.length > 0 && (
          <div style={{ marginTop: 10, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            {resHome.map((p) => (
              <div key={p.place_id} onClick={() => saveHome(p)} style={{ padding: "10px 12px", borderBottom: "1px solid #eee", cursor: "pointer", background: "#fff" }}>
                {p.description}
              </div>
            ))}
          </div>
        )}
      </section>
{/* MILEAGE RATE */}
<section style={{ marginTop: 20 }}>
  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
    Mileage rate ($/mile)
  </label>
  <input
    type="number"
    step="0.01"
    value={rate}
    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
    style={{ width: 140, padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }}
  />
  <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
    Used to compute expense value on the Expenses tab.
  </div>
</section>

      {/* COURSES */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Courses</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={qCourse} onChange={(e) => setQCourse(e.target.value)} placeholder="Search course name…" style={{ flex: 1, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, fontSize: 14 }}/>
          <button onClick={searchCourse} disabled={loadingCourse} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #000", background: "#000", color: "#fff", cursor: "pointer" }}>{loadingCourse ? "Searching…" : "Find"}</button>
        </div>

        {resCourse.length > 0 && (
          <div style={{ marginTop: 10, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            {resCourse.map((p) => (
              <div key={p.place_id} onClick={() => addCourse(p)} style={{ padding: "10px 12px", borderBottom: "1px solid #eee", cursor: "pointer", background: "#fff" }}>
                {p.description}
              </div>
            ))}
          </div>
        )}

        {courses.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Saved Courses</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {courses.map((c) => (
                <li key={c.placeId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{c.address}</div>
                  </div>
                  <button onClick={() => removeCourse(c.placeId)} style={{ background: "transparent", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- Loop Log Screen ---------- */
function LoopsScreen() {
  const [courses, setCourses] = useState<Course[]>(() => {
    try { return JSON.parse(localStorage.getItem("settings.courses") || "[]"); } catch { return []; }
  });
  const [loops, setLoops] = useState<Loop[]>(() => {
    try { return JSON.parse(localStorage.getItem("loops") || "[]"); } catch { return []; }
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  function persistLoops(next: Loop[]) {
    localStorage.setItem("loops", JSON.stringify(next));
    setLoops(next);
  }

  const today = new Date();
  const isoDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const [form, setForm] = useState<Loop>({
    id: "",
    date: isoDate,
    reportTime: "",
    teeTime: "",
    courseId: courses[0]?.placeId || "",
    courseName: courses[0]?.name || "",
    type: "Single",
    basePay: DEFAULT_BASE_PAY["Single"],
    preGrat: 0,
    tipCash: 0,
    tipDigital: 0,
    players: "",
    notes: "",
  });

  useEffect(() => {
    const c = courses.find((x) => x.placeId === form.courseId);
    if (c && c.name !== form.courseName) {
      setForm((f) => ({ ...f, courseName: c.name }));
    }
  }, [form.courseId, courses]);

  function update<K extends keyof Loop>(key: K, value: Loop[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTypeChange(v: LoopType) {
    update("type", v);
    update("basePay", DEFAULT_BASE_PAY[v]);
  }

  const waitMinsNow = (() => {
    const r = timeToMinutes(form.reportTime);
    const t = timeToMinutes(form.teeTime);
    if (r == null || t == null) return null;
    return Math.max(0, t - r);
  })();

  function saveLoop() {
    if (!form.courseId) { alert("Pick a course in Settings first."); return; }

    const id = editingId ?? String(Date.now());
    const toSave: Loop = {
      ...form,
      id,
      basePay: Number(form.basePay) || 0,
      preGrat: Number(form.preGrat) || 0,
      tipCash: Number(form.tipCash) || 0,
      tipDigital: Number(form.tipDigital) || 0,
      waitMins: waitMinsNow ?? undefined,
    };

    const next = editingId
      ? loops.map((l) => (l.id === editingId ? toSave : l))
      : [toSave, ...loops];

    persistLoops(next);
    setEditingId(null);
    setForm((f) => ({
      ...f,
      id: "",
      tipCash: 0,
      tipDigital: 0,
      preGrat: 0,
      players: "",
      notes: "",
    }));
  }

  function startEdit(l: Loop) {
    setEditingId(l.id);
    setForm({
      id: l.id,
      date: l.date,
      reportTime: l.reportTime || "",
      teeTime: l.teeTime || "",
      courseId: l.courseId,
      courseName: l.courseName,
      type: l.type,
      basePay: l.basePay,
      preGrat: l.preGrat || 0,
      tipCash: l.tipCash,
      tipDigital: l.tipDigital,
      players: l.players || "",
      notes: l.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm((f) => ({ ...f, id: "", preGrat: 0, tipCash: 0, tipDigital: 0, players: "", notes: "" }));
  }

  function removeLoop(id: string) {
    persistLoops(loops.filter((l) => l.id !== id));
  }

  const total =
    (Number(form.basePay) || 0) +
    (Number(form.preGrat) || 0) +
    (Number(form.tipCash) || 0) +
    (Number(form.tipDigital) || 0);

  return (
    <div style={{ padding: 16, paddingBottom: 72 }}>
      <h1 style={{ margin: "8px 0 16px", fontSize: 24 }}>Loop Log</h1>

      {editingId && (
        <div style={{ marginBottom: 10, padding: "8px 10px", border: "1px solid #eee", borderRadius: 8, background: "#fafafa", fontSize: 12 }}>
          Editing existing loop. Make your changes and click <b>Update Loop</b>.
        </div>
      )}

      <div style={{ display: "grid", gap: 10, maxWidth: 580 }}>
        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Date</div>
          <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Report Time</div>
          <input type="time" value={form.reportTime || ""} onChange={(e) => update("reportTime", e.target.value)} />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Tee Time</div>
          <input type="time" value={form.teeTime || ""} onChange={(e) => update("teeTime", e.target.value)} />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Course</div>
          <select
            value={form.courseId}
            onChange={(e) => update("courseId", e.target.value)}
            style={{ padding: "6px 8px" }}
          >
            <option value="">-- Select a course (add in Settings) --</option>
            {courses.map((c) => (
              <option key={c.placeId} value={c.placeId}>{c.name}</option>
            ))}
          </select>
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Player(s)</div>
          <input value={form.players || ""} onChange={(e) => update("players", e.target.value)} placeholder="Optional" />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Type</div>
          <select value={form.type} onChange={(e) => onTypeChange(e.target.value as LoopType)} style={{ padding: "6px 8px" }}>
            <option>Single</option>
            <option>Double</option>
            <option>Forecaddie</option>
          </select>
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Base Pay ($)</div>
          <input type="number" step="1" value={form.basePay} onChange={(e) => update("basePay", Number(e.target.value) || 0)} />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Tip — Cash ($)</div>
          <input type="number" step="1" value={form.tipCash} onChange={(e) => update("tipCash", Number(e.target.value) || 0)} />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Tip — Digital ($)</div>
          <input type="number" step="1" value={form.tipDigital} onChange={(e) => update("tipDigital", Number(e.target.value) || 0)} />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Pre-grat ($)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              step="1"
              value={form.preGrat ?? 0}
              onChange={(e) => update("preGrat", Number(e.target.value) || 0)}
            />
            <button
              type="button"
              onClick={() => update("preGrat", 120)}
              style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, background: "#f7f7f7", cursor: "pointer" }}
            >
              Set $120
            </button>
          </div>
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Notes</div>
          <textarea value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} rows={3} />
        </label>

        <div style={{ fontWeight: 600 }}>Total for this loop: ${total.toFixed(2)}</div>
        {waitMinsNow != null && (
          <div style={{ color: "#555" }}>
            Estimated wait: <b>{waitMinsNow} min</b>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={saveLoop}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #000", background: "#000", color: "#fff", cursor: "pointer", width: 160 }}
          >
            {editingId ? "Update Loop" : "Save Loop"}
          </button>
          {editingId && (
            <button
              onClick={cancelEdit}
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Recent Loops */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Recent Loops</h2>
        {loops.length === 0 && <div>No loops yet.</div>}
        {loops.map((l) => {
          const total = l.basePay + (l.preGrat || 0) + l.tipCash + l.tipDigital;
          return (
            <div
              key={l.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  {l.date} • {l.courseName} • {l.type}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  Base ${l.basePay}
                  {l.preGrat ? ` • Pre-grat $${l.preGrat}` : ""}
                  • Tips ${l.tipCash + l.tipDigital}
                  • Total ${total}
                  {typeof l.waitMins === "number" ? ` • Wait ${l.waitMins} min` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => startEdit(l)}
                  style={{ background: "transparent", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => removeLoop(l.id)}
                  style={{ background: "transparent", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Expenses → Mileage (per day × course) ---------- */
function ExpensesScreen() {
  // ---------- Local helpers (no collisions with your other code) ----------
  const money = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Read saved data already used elsewhere (do not change your storage keys)
  const home: Home = (() => {
    try { return JSON.parse(localStorage.getItem("settings.home") || "null"); } catch { return null; }
  })();
  const courses: Course[] = (() => {
    try { return JSON.parse(localStorage.getItem("settings.courses") || "[]"); } catch { return []; }
  })();
  const loops: Loop[] = (() => {
    try { return JSON.parse(localStorage.getItem("loops") || "[]"); } catch { return []; }
  })();

  // Mileage rate ($/mile) – same key you set on Settings
  const mileageRate: number = (() => {
    const raw = localStorage.getItem("settings.mileageRate");
    const n = raw ? parseFloat(raw) : NaN;
    return Number.isFinite(n) ? n : 0.67;
  })();

  // ---------- Mileage rows (date × course) ----------
  type Row = { date: string; courseId: string; courseName: string };
  const rows: Row[] = Array.from(
    loops.reduce((m, l) => {
      if (!l.courseId) return m;
      const k = `${l.date}|${l.courseId}`;
      if (!m.has(k)) m.set(k, { date: l.date, courseId: l.courseId, courseName: l.courseName });
      return m;
    }, new Map<string, Row>()).values()
  ).sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  // Cache distance (round-trip miles) by courseId
  const [milesCache, setMilesCache] = React.useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("miles.cache") || "{}"); } catch { return {}; }
  });
  function saveMilesCache(next: Record<string, number>) {
    localStorage.setItem("miles.cache", JSON.stringify(next));
    setMilesCache(next);
  }
  async function computeMiles(courseId: string) {
    if (!home?.placeId) { alert("Set your Home in Settings first."); return; }
    if (!courseId) return;
    try {
      const url = `${PROXY}/api/distance?originPlaceId=${encodeURIComponent(home.placeId)}&destinationPlaceId=${encodeURIComponent(courseId)}`;
      const r = await fetch(url);
      const data = await r.json();
      if (typeof data.milesRoundTrip === "number") {
        const next = { ...milesCache, [courseId]: data.milesRoundTrip };
        saveMilesCache(next);
      } else {
        alert("Could not compute distance (try again).");
      }
    } catch {
      alert("Network error computing distance.");
    }
  }
  const courseName = (id: string) => courses.find(c => c.placeId === id)?.name || "Unknown course";

  // ---------- Purchases with optional photo receipt ----------
  // local (inside this function) types to avoid any name clashes
  type LocalExpenseCategory = "Food & Bev" | "Gear & Supplies" | "Misc";
  type LocalPurchase = {
    id: string;
    date: string;                 // yyyy-mm-dd
    category: LocalExpenseCategory;
    merchant?: string;
    amount: number;               // dollars
    note?: string;
    receiptDataUrl?: string;      // base64 preview
  };

  const [purchases, setPurchases] = React.useState<LocalPurchase[]>(() => {
    try { return JSON.parse(localStorage.getItem("purchases") || "[]"); } catch { return []; }
  });
  function persistPurchases(next: LocalPurchase[]) {
    localStorage.setItem("purchases", JSON.stringify(next));
    setPurchases(next);
  }

  // purchase form
  const today = new Date();
  const isoToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);

  const [purchaseForm, setPurchaseForm] = React.useState<LocalPurchase>({
    id: "",
    date: isoToday,
    category: "Food & Bev",
    merchant: "",
    amount: 0,
    note: "",
  });
  function updatePurchase<K extends keyof LocalPurchase>(key: K, value: LocalPurchase[K]) {
    setPurchaseForm(f => ({ ...f, [key]: value }));
  }

  // photo receipt (single preview)
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [receiptPreview, setReceiptPreview] = React.useState<string>("");
  const onPickReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  function addPurchase() {
    if (!purchaseForm.amount || purchaseForm.amount <= 0) {
      alert("Enter an amount > 0"); return;
    }
    const toSave: LocalPurchase = {
      ...purchaseForm,
      id: String(Date.now()),
      amount: Number(purchaseForm.amount) || 0,
      merchant: purchaseForm.merchant?.trim() || undefined,
      note: purchaseForm.note?.trim() || undefined,
      receiptDataUrl: receiptPreview || undefined,
    };
    persistPurchases([toSave, ...purchases]);
    // reset (keep date & category)
    setPurchaseForm(f => ({ ...f, id: "", merchant: "", amount: 0, note: "" }));
    setReceiptPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePurchase(id: string) {
    persistPurchases(purchases.filter(p => p.id !== id));
  }

  // ---------- UI ----------
  return (
    <div style={{ padding: 16, paddingBottom: 72 }}>
      <h1 style={{ margin: "8px 0 16px", fontSize: 24 }}>Expenses · Mileage</h1>
      {!home && <div style={{ marginBottom: 12, color: "#a00" }}>Add your <b>Home</b> in Settings to enable mileage.</div>}
      {rows.length === 0 && <div>No loops yet.</div>}

      {/* Mileage rows */}
      {rows.map((row) => {
        const miles = milesCache[row.courseId];
        return (
          <div key={`${row.date}|${row.courseId}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{row.date} • {courseName(row.courseId)}</div>
              <div style={{ fontSize: 12, color: "#555" }}>
                Miles: {typeof miles === "number" ? miles.toFixed(1) : "—"}{typeof miles === "number" ? ` • $${money(miles * mileageRate)} mileage` : ""}
              </div>
            </div>
            <button onClick={() => computeMiles(row.courseId)} style={{ background: "#000", color: "#fff", border: "1px solid #000", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
              {typeof miles === "number" ? "Recompute" : "Compute"}
            </button>
          </div>
        );
      })}

      {/* Purchases */}
      <h2 style={{ fontSize: 18, margin: "24px 0 8px" }}>Purchases</h2>

      <div style={{ display: "grid", gap: 8, maxWidth: 620 }}>
        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Date</div>
          <input type="date" value={purchaseForm.date} onChange={(e) => updatePurchase("date", e.target.value)} />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Category</div>
          <select
            value={purchaseForm.category}
            onChange={(e) => updatePurchase("category", e.target.value as LocalExpenseCategory)}
            style={{ padding: "6px 8px" }}
          >
            <option>Food & Bev</option>
            <option>Gear & Supplies</option>
            <option>Misc</option>
          </select>
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Merchant (optional)</div>
          <input
            value={purchaseForm.merchant || ""}
            onChange={(e) => updatePurchase("merchant", e.target.value)}
            placeholder="Kroger, Costco, Pro Shop…"
          />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Amount ($)</div>
          <input
            type="number"
            step="0.01"
            value={purchaseForm.amount}
            onChange={(e) => updatePurchase("amount", Number(e.target.value))}
          />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Notes</div>
          <textarea
            rows={3}
            value={purchaseForm.note || ""}
            onChange={(e) => updatePurchase("note", e.target.value)}
          />
        </label>

        {/* Receipt attach + preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPickReceipt}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              background: "#000",
              color: "#fff",
              border: "1px solid #000",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Attach receipt
          </button>

          {receiptPreview && (
            <img
              src={receiptPreview}
              alt="receipt preview"
              style={{
                width: 56,
                height: 56,
                objectFit: "cover",
                borderRadius: 6,
                border: "1px solid #ddd",
              }}
            />
          )}
        </div>

        <button
          onClick={addPurchase}
          style={{
            width: 160,
            background: "#000",
            color: "#fff",
            border: "1px solid #000",
            padding: "10px 14px",
            borderRadius: 8,
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          Add Purchase
        </button>
      </div>

      {/* Recent Purchases */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Recent Purchases</h3>
        {purchases.length === 0 && <div>None yet.</div>}
        {purchases.map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {p.receiptDataUrl && (
                <img
                  src={p.receiptDataUrl}
                  alt="receipt"
                  style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }}
                />
              )}
              <div>
                <div style={{ fontWeight: 600 }}>
                  {p.date} • {p.category} • ${money(p.amount)}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {p.merchant ? `${p.merchant}` : ""}
                  {p.note ? (p.merchant ? ` • ${p.note}` : p.note) : ""}
                </div>
              </div>
            </div>
            <button
              onClick={() => removePurchase(p.id)}
              style={{ background: "transparent", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ---------- Money Screen (income summaries + mini charts) ---------- */
function MoneyScreen() {
  // read loops
  const loops: Loop[] = (() => {
    try { return JSON.parse(localStorage.getItem("loops") || "[]"); } catch { return []; }
  })();

  if (!loops.length) {
    return (
      <div style={{ padding: 16, paddingBottom: 72 }}>
        <h1 style={{ margin: "8px 0 16px", fontSize: 24 }}>Money</h1>
        <div>No loops yet.</div>
      </div>
    );
  }

  const ymNow = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const loopsThisMonth = loops.filter(l => (l.date || "").startsWith(ymNow));

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

const baseMonth = sum(loopsThisMonth.map(l => l.basePay));
const tipCashMonth = sum(loopsThisMonth.map(l => l.tipCash));
const tipDigitalMonth = sum(loopsThisMonth.map(l => l.tipDigital));
const preGratMonth = sum(loopsThisMonth.map(l => l.preGrat || 0)); // NEW
const tipsMonth = tipCashMonth + tipDigitalMonth + preGratMonth;   // UPDATED
const totalMonth = baseMonth + tipsMonth;                          // UPDATED


  // tip mix %
const tipMixCashPct    = tipsMonth ? (tipCashMonth    / tipsMonth) * 100 : 0;
const tipMixDigitalPct = tipsMonth ? (tipDigitalMonth / tipsMonth) * 100 : 0;
const tipMixPrePct     = tipsMonth ? (preGratMonth    / tipsMonth) * 100 : 0; // NEW


  // by loop type (this month)
  const types: LoopType[] = ["Single", "Double", "Forecaddie"];
  const byType = types.map(t => {
    const ls = loopsThisMonth.filter(l => l.type === t);
    const base = sum(ls.map(l => l.basePay));
    const tips = sum(ls.map(l => l.tipCash + l.tipDigital + (l.preGrat || 0)));
    return { type: t, base, tips, total: base + tips };
  });

  // last up-to-6 months (from all loops)
  type MonthRow = { ym: string; base: number; tips: number; total: number };
  const byYm = new Map<string, MonthRow>();
  for (const l of loops) {
    const ym = (l.date || "").slice(0, 7);
    if (!ym) continue;
    const row = byYm.get(ym) || { ym, base: 0, tips: 0, total: 0 };
    row.base += l.basePay;
    const tips = l.tipCash + l.tipDigital + (l.preGrat || 0);
    row.tips += tips;
    row.total += l.basePay + tips;
    byYm.set(ym, row);
  }
  const months = Array.from(byYm.values())
    .sort((a, b) => (a.ym < b.ym ? 1 : -1))
    .slice(0, 6);

  const maxMonthTotal = Math.max(1, ...months.map(m => m.total));
  const ymLabel = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  };

  // tiny bar helper
  const Bar = ({ value, max, color = "#111" }: { value: number; max: number; color?: string }) => (
    <div style={{ width: 200, height: 10, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, height: "100%", background: color }} />
    </div>
  );

  return (
    <div style={{ padding: 16, paddingBottom: 72 }}>
      <h1 style={{ margin: "8px 0 16px", fontSize: 24 }}>Money</h1>

      {/* This month summary */}
      <div style={{ margin: "6px 0 16px", padding: "10px 12px", border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          ${fmt(totalMonth)} this month
        </div>
        <div style={{ fontSize: 12, color: "#555" }}>
          Base ${fmt(baseMonth)} • Tips ${fmt(tipsMonth)} (Cash ${fmt(tipCashMonth)}, Digital ${fmt(tipDigitalMonth)}, Pre-grat ${fmt(preGratMonth)})

        </div>
      </div>

      {/* Tip mix (this month) */}
      <h2 style={{ fontSize: 16, margin: "12px 0 6px" }}>Tip mix (this month)</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 260, height: 12, background: "#eee", borderRadius: 6, overflow: "hidden", display: "flex" }}>
  <div style={{ width: `${isFinite(tipMixCashPct) ? tipMixCashPct : 0}%`,    background: "#000" }} />
  <div style={{ width: `${isFinite(tipMixDigitalPct) ? tipMixDigitalPct : 0}%`, background: "#666" }} />
  <div style={{ width: `${isFinite(tipMixPrePct) ? tipMixPrePct : 0}%`,      background: "#aaa" }} />
</div>
<div style={{ fontSize: 12, color: "#555" }}>
  Cash {isFinite(tipMixCashPct) ? tipMixCashPct.toFixed(0) : 0}% •
  {" "}Digital {isFinite(tipMixDigitalPct) ? tipMixDigitalPct.toFixed(0) : 0}% •
  {" "}Pre-grat {isFinite(tipMixPrePct) ? tipMixPrePct.toFixed(0) : 0}%
</div>

      </div>

      {/* Earnings by loop type (this month) */}
      <h2 style={{ fontSize: 16, margin: "16px 0 6px" }}>Earnings by loop type (this month)</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {byType.map((r) => (
          <div key={r.type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 110 }}>{r.type}</div>
            <Bar value={r.total} max={Math.max(1, ...byType.map(x => x.total))} />
            <div style={{ width: 88, textAlign: "right" }}>${fmt(r.total)}</div>
          </div>
        ))}
      </div>

      {/* Last 6 months (total) */}
      <h2 style={{ fontSize: 16, margin: "16px 0 6px" }}>Last 6 months</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {months.map((m) => (
          <div key={m.ym} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 110 }}>{ymLabel(m.ym)}</div>
            <Bar value={m.total} max={maxMonthTotal} />
            <div style={{ width: 88, textAlign: "right" }}>${fmt(m.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Routes ---------- */
export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LoopsScreen />} />
        <Route path="/loops" element={<LoopsScreen />} />
        <Route path="/expenses" element={<ExpensesScreen />} />
        <Route path="/money" element={<MoneyScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
      <Tabs />
    </div>
  );
}
