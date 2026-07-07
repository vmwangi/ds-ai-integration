import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Progress persistence shim: the app calls window.storage, which exists on
// claude.ai. On GitHub Pages we back it with the browser's own storage.
if (!window.storage) {
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(key);
      return v ? { key, value: v } : null;
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
