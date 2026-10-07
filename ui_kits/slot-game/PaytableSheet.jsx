// Ordem e multiplicadores do jogo: pay / 5, do curinga ao mais comum.
const PAYS = [
  ["wild", 9, "x16"], ["gem", 8, "x10"], ["crown", 7, "x6.4"], ["coin", 6, "x4.8"], ["scepter", 5, "x3.6"],
  ["clover", 4, "x2.8"], ["candy", 3, "x2"], ["tent", 2, "x1.6"], ["drum", 1, "x1.2"], ["curtain", 0, "x1"]
];

export function PaytableSheet({ assetBase = "../../", onClose }) {
  return (
    <div role="button" onClick={onClose}
      style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
        background: "rgba(12,2,24,.93)", cursor: "pointer", animation: "fcPop .25s ease-out"
      }}>
      <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "2px", color: "#ffd257" }}>TABELA DE PAGAMENTOS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 132px)", gap: "8px 22px" }}>
        {PAYS.map(([sym, index, mult]) => (
          <div key={sym} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,.06)" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 5, background: "var(--fc-grad-reel-face)",
              backgroundImage: `url("${assetBase}assets/symbols-v6.png")`,
              backgroundSize: "1100% 100%",
              backgroundPositionX: `${index * 10}%`,
              backgroundRepeat: "no-repeat", backgroundColor: "#f3e0cc"
            }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff3c4" }}>{mult}</span>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 300, textAlign: "center", fontSize: 11.5, fontWeight: 700, lineHeight: 1.45, color: "#d9b6f0" }}>
        5 linhas fixas · 3 horizontais e 2 diagonais. O elefante é curinga e substitui qualquer símbolo.
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "#ffd257" }}>TOQUE PARA FECHAR</div>
    </div>
  );
}
