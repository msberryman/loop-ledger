import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// If you have a global CSS file, keep this import. If not, delete it.
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
