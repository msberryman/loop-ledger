import React from "react";

type LoopType = "Single" | "Double" | "Forecaddie";
type Loop = {
  id: string;
  date: string;
  courseName: string;
  type: LoopType;
  basePay: number;
  tipCash: number;
  tipDigital: number;
  preGrat?: number;   // if you store it
  waitMins?: number;
};

const fmt = (n: number) =>
  (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function History() {
  const loops: Loop[] = (() => {
    try { return JSON.parse(localStorage.getItem("loops") || "[]"); } catch { return []; }
  })();

  const rows = [...loops].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="screen">
      <h2>History</h2>

      {rows.length === 0 ? (
        <div>No loops yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((l) => {
            const tips = (l.tipCash || 0) + (l.tipDigital || 0) + (l.preGrat || 0);
            const total = (l.basePay || 0) + tips;
            return (
              <div key={l.id} className="card">
                <div style={{ fontWeight: 600 }}>
                  {l.date} • {l.courseName} • {l.type}
                </div>
                <div style={{ fontSize: 12, color: "#9aa3af" }}>
                  Base ${fmt(l.basePay)} • Tips ${fmt(tips)} • Total ${fmt(total)}
                  {typeof l.waitMins === "number" ? ` • Wait ${l.waitMins} min` : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
