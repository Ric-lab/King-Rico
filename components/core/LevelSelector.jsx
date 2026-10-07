import React from "react";

const LABELS = ["OFF", "50%", "100%"];

export function LevelSelector({ value = 2, onChange, labels = LABELS, label }) {
  return (
    <div role="radiogroup" aria-label={label}
      style={{ display: "flex", gap: 3, padding: 3, borderRadius: 13, background: "rgba(255,255,255,.12)", fontFamily: "var(--fc-font-ui)" }}>
      {labels.map((t, i) => {
        const on = value === i;
        return (
          <div key={t} role="radio" aria-checked={on}
            onClick={() => onChange && onChange(i)}
            style={{
              minWidth: 34, height: 22, padding: "0 6px", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 10.5, fontWeight: 800, letterSpacing: ".5px",
              color: on ? "#fff" : "#b98fd6",
              background: on ? (i === 0 ? "rgba(255,255,255,.3)" : "#2ec962") : "transparent",
              transition: "background .15s, color .15s"
            }}>
            {t}
          </div>
        );
      })}
    </div>
  );
}

export function LevelRow({ icon, label, value = 2, onChange, divider = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "9px 0",
      borderBottom: divider ? "1px solid rgba(255,255,255,.07)" : "none", fontFamily: "var(--fc-font-ui)"
    }}>
      {icon && <span style={{ width: 22, textAlign: "center", fontSize: 17, color: "var(--fc-gold-300)" }}>{icon}</span>}
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: "#f6e8ff" }}>{label}</span>
      <LevelSelector value={value} onChange={onChange} label={label} />
    </div>
  );
}
