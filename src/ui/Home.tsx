import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="screen">
      <h2>Home</h2>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <Link className="big-button" to="/loops">New Loop</Link>
        <Link className="big-button" to="/expenses">Expenses</Link>
        <Link className="big-button" to="/ui/history">History</Link>
      </div>
    </div>
  );
}
