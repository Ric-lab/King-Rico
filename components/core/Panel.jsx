import React from "react";

export function Panel({ title, onClose, width = 372, children, ...rest }) {
  return (
    <section
      style={{
        width,
        maxWidth: "100%",
        borderRadius: "var(--fc-radius-lg)",
        overflow: "hidden",
        background: "linear-gradient(180deg, #3d0a63 0%, #26043f 100%)",
        border: "2px solid var(--fc-gold-400)",
        boxShadow: "0 16px 40px rgba(0,0,0,.6)",
        color: "var(--fc-text-on-dark)",
        fontFamily: "var(--fc-font-ui)"
      }}
      {...rest}
    >
      {title && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px 12px",
            borderBottom: "1px solid rgba(255,210,87,.22)"
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: ".3px", color: "var(--fc-gold-100)" }}>{title}</span>
          {onClose && (
            <div
              role="button"
              aria-label="Fechar"
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "rgba(0,0,0,.3)",
                color: "var(--fc-gold-300)",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              ✕
            </div>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
