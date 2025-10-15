import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./ui/Home";
import History from "./ui/History";
import "./ui/new-ui.css";

export default function NewUI() {
  return (
    <div className="ui-shell">
      <header className="ui-header">
        <div className="brand">Loop Ledger (Preview)</div>
      </header>

      <main className="ui-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}
