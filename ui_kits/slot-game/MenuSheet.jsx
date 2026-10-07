export function MenuSheet({ onClose, onPaytable, audio, sfxLevel = 2, onSfx, vibLevel = 2, onVib }) {

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(10,2,20,.78)", animation: "fcPop .2s ease-out" }}>
      <div role="button" onClick={onClose} style={{ position: "absolute", inset: 0, cursor: "pointer" }} />
      <div style={{ position: "absolute", left: 24, top: 84, width: 405 }}>
        <Panel title="Menu" onClose={onClose} width="100%">
          <div style={{ padding: "14px 18px 4px", fontSize: 10, fontWeight: 800, letterSpacing: "1.6px", color: "#b98fd6" }}>AJUSTES</div>

          <div style={{ display: "flex", flexDirection: "column", padding: "0 18px" }}>
            <LevelRow icon="♫" label="Efeitos sonoros" value={sfxLevel} onChange={onSfx} divider />
            <LevelRow icon="≈" label="Vibração" value={vibLevel} onChange={onVib} divider />

            <div role="button" onClick={() => { audio && audio.click(true); onPaytable(); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0 13px", cursor: "pointer" }}>
              <span style={{ width: 22, textAlign: "center", fontSize: 15, color: "#ffd257" }}>◇</span>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: "#f6e8ff" }}>Tabela de pagamentos</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#ffd257" }}>›</span>
            </div>
          </div>

          <div style={{ padding: "14px 18px 16px", display: "flex", flexDirection: "column", gap: 7, background: "rgba(0,0,0,.24)", borderTop: "1px solid rgba(255,210,87,.22)" }}>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: "#fff3c4" }}>Seu progresso</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.5, color: "#cdaee6" }}>
              Moedas, aposta e ajustes são salvos automaticamente neste aparelho. A rodada em andamento não é salva.
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 800, lineHeight: 1.5, color: "#f0dcff" }}>
              Backup na nuvem indisponível nesta versão.
            </span>
            <div style={{ display: "flex", gap: 16, paddingTop: 4 }}>
              {["Privacidade", "Termos", "Suporte"].map((t) => (
                <span key={t} role="button"
                  style={{ fontSize: 11, fontWeight: 800, color: "#ffd257", textDecoration: "underline", cursor: "pointer" }}>{t}</span>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
