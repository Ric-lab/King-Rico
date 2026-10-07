// Recriação fiel da tela real do jogo (Fortune Circus.dc.html).
// A arte é uma placa única (assets/stage-hd.png, 453 × 802 @3x) com as faces creme
// das células já pintadas; a UI são sobreposições e PressZones nas coordenadas
// exatas da arte. Não reposicione nada sem trocar a arte.
const SYMS = ["curtain", "drum", "tent", "candy", "clover", "scepter", "coin", "crown", "gem", "wild"];
const PAY = { curtain: 5, drum: 6, tent: 8, candy: 10, clover: 14, scepter: 18, coin: 24, crown: 32, gem: 50, wild: 80 };
const WEIGHT = { curtain: 16, drum: 14, tent: 12, candy: 10, clover: 8, scepter: 6, coin: 5, crown: 4, gem: 3, wild: 2 };
const BETS = [1, 2.5, 5, 10, 25, 50];
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]];
const STOP_ORDER = [6, 3, 0, 7, 4, 1, 8, 5, 2];
// [left, top, width, height] — medidos nas divisórias da arte.
const CELLS = [
  [33, 219.5, 126.5, 127.5], [163, 219.5, 122.5, 127.5], [289, 219.5, 130, 127.5],
  [33, 351, 126.5, 126], [163, 351, 122.5, 126], [289, 351, 130, 126],
  [33, 481, 126.5, 120], [163, 481, 122.5, 120], [289, 481, 130, 120]
];
const LINE_TOPS = [280.75, 411.5, 538.5];
const DIAGONALS = [44.66, -44.66];
const LINE_BG = "linear-gradient(90deg, rgba(255,214,90,0), #fff3b0, rgba(255,214,90,0))";
const LINE_GLOW = "0 0 12px 3px rgba(255,200,60,.9)";

function StatePill({ left, text }) {
  return (
    <div style={{
      position: "absolute", left, top: 656, width: 48, height: 15,
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 8, background: "rgba(6,44,20,.85)", border: "1px solid #4fd97a",
      boxShadow: "0 0 8px rgba(60,220,120,.45)", pointerEvents: "none"
    }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: "#8cf49a", lineHeight: 1 }}>{text}</span>
    </div>
  );
}

const fmt = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const balanceSize = (n) => { const l = fmt(n).length; return l <= 6 ? 19 : l <= 8 ? 16.5 : 14; };

function pick() {
  const total = SYMS.reduce((a, s) => a + WEIGHT[s], 0);
  let r = Math.random() * total;
  for (const s of SYMS) { r -= WEIGHT[s]; if (r <= 0) return s; }
  return SYMS[0];
}

export function GameScreen({ assetBase = "../../", audio, vibLevel = 2, sfxLevel = 2, onMenu }) {
  const [balance, setBalance] = React.useState(1000);
  const [betIndex, setBetIndex] = React.useState(3);
  const [win, setWin] = React.useState(0);
  const [turbo, setTurbo] = React.useState(false);
  const [auto, setAuto] = React.useState(false);
  const [spinning, setSpinning] = React.useState(false);
  const [lines, setLines] = React.useState([]);
  const [hint, setHint] = React.useState("Boa sorte!");
  const [grid, setGrid] = React.useState(["tent", "gem", "crown", "drum", "candy", "coin", "curtain", "clover", "scepter"]);
  const [spinCells, setSpinCells] = React.useState([]);
  const [stopped, setStopped] = React.useState([]);
  const [winCells, setWinCells] = React.useState([]);

  const timers = React.useRef([]);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const bet = BETS[betIndex];
  const press = () => { audio.click(true); buzz(12, vibLevel); };
  const release = () => audio.click(false);

  function evaluate(g) {
    let prize = 0; const hitLines = [], cells = [];
    LINES.forEach((line, li) => {
      const vals = line.map((i) => g[i]);
      const base = vals.find((v) => v !== "wild");
      if (!vals.every((v) => v === "wild" || v === base)) return;
      prize += bet * PAY[base || "wild"] / 5;
      hitLines.push(li);
      line.forEach((i) => { if (cells.indexOf(i) < 0) cells.push(i); });
    });
    return { prize: Math.round(prize * 100) / 100, hitLines, cells };
  }

  function spin() {
    if (spinning) return;
    if (bet > balance) { setAuto(false); setHint("Saldo insuficiente — recarregue"); return; }
    audio.startWhirr();
    setSpinning(true); setWin(0); setLines([]); setWinCells([]); setStopped([]);
    setSpinCells(STOP_ORDER.slice());
    setHint("Girando…");
    setBalance((b) => Math.round((b - bet) * 100) / 100);

    const ticker = setInterval(() => {
      setGrid((g) => g.map((v, i) => (STOP_ORDER.indexOf(i) >= 0 ? pick() : v)));
    }, 70);
    timers.current.push(ticker);

    const sp = turbo ? 0.45 : 1;
    const final = Array.from({ length: 9 }, pick);
    STOP_ORDER.forEach((cell, order) => {
      later(() => {
        setGrid((g) => { const n = g.slice(); n[cell] = final[cell]; return n; });
        setSpinCells((s) => s.filter((i) => i !== cell));
        setStopped((s) => s.concat(cell));
        audio.stopReel(order);
      }, (420 + order * 105) * sp);
    });

    later(() => {
      clearInterval(ticker);
      audio.stopWhirr();
      setSpinning(false); setStopped([]);
      const res = evaluate(final);
      if (res.prize > 0) {
        setWin(res.prize); setLines(res.hitLines); setWinCells(res.cells);
        setBalance((b) => Math.round((b + res.prize) * 100) / 100);
        setHint(res.prize >= bet * 12 ? "Grande prêmio!" : "Você ganhou!");
        audio.win(res.prize >= bet * 12);
        later(() => { setLines([]); setWinCells([]); }, 1800);
      } else {
        setHint("Quase! Gire de novo");
        audio.lose();
      }
    }, (420 + 8 * 105 + 260) * sp);
  }

  // Auto encadeia sem novo clique nem atraso de 280ms.
  React.useEffect(() => {
    if (auto && !spinning && bet <= balance) { const t = setTimeout(spin, 650); return () => clearTimeout(t); }
  }, [auto, spinning, balance, betIndex]);

  function changeBet(dir) {
    if (spinning) return;
    audio.click(true);
    setBetIndex((i) => Math.max(0, Math.min(BETS.length - 1, i + dir)));
    setHint("Aposta alterada");
  }

  const glyph = { fontSize: 36, fontWeight: 800, color: "#e19b34", textShadow: "0 2px 2px rgba(0,0,0,.45)", lineHeight: 1 };

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `url("${assetBase}assets/stage-hd.png") 0 0 / 453px 802px no-repeat`,
      fontFamily: "var(--fc-font-ui)"
    }}>
      {CELLS.map(([left, top, w, h], i) => (
        <div key={i} style={{ position: "absolute", left, top }}>
          <ReelCell
            symbol={grid[i]} width={w} height={h} face={false} assetBase={assetBase}
            state={spinCells.indexOf(i) >= 0 ? "spinning" : stopped.indexOf(i) >= 0 ? "drop" : winCells.indexOf(i) >= 0 ? "win" : "idle"}
          />
        </div>
      ))}

      {lines.filter((l) => l < 3).map((row) => (
        <div key={row} style={{ position: "absolute", left: 33, top: LINE_TOPS[row], width: 386, height: 5, borderRadius: 3, background: LINE_BG, boxShadow: LINE_GLOW, animation: "fcLine 1.6s ease-out forwards", pointerEvents: "none" }} />
      ))}
      {lines.filter((l) => l >= 3).map((l) => (
        <div key={l} style={{ position: "absolute", left: -34, top: 407.75, width: 520, height: 5, borderRadius: 3, transform: `rotate(${DIAGONALS[l - 3]}deg)`, background: LINE_BG, boxShadow: LINE_GLOW, animation: "fcLine 1.6s ease-out forwards", pointerEvents: "none" }} />
      ))}

      {/* Saldo: caixa com a mesma altura da moeda; .05em compensa a folga da Baloo 2. */}
      <div style={{ position: "absolute", left: 57, top: 28, width: 88, height: 39, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: balanceSize(balance), fontWeight: 800, color: "#662c2c", letterSpacing: "-.2px", lineHeight: 1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", transform: "translateY(.05em)" }}>
          {fmt(balance)}
        </span>
      </div>

      {/* A placa de ganho fica vazia até existir prêmio — nunca mostra zero. */}
      <div style={{ position: "absolute", left: 164, top: 180, width: 125, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {win > 0 && (
          <span style={{ fontSize: 25, fontWeight: 800, color: "#c1ff72", lineHeight: 1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", textShadow: "0 0 10px rgba(170,255,110,.55), 0 1px 2px rgba(0,0,0,.55)", animation: "fcPop .35s cubic-bezier(.18,1.5,.4,1), fcBeat .5s ease-in-out 3 .35s" }}>
            {fmt(win)}
          </span>
        )}
      </div>

      <div style={{ position: "absolute", left: 150, top: 612, width: 143, height: 42, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ ...glyph, letterSpacing: "1.5px", fontVariantNumeric: "tabular-nums" }}>{fmt(bet)}</span>
      </div>
      <div role="button" aria-label="Diminuir aposta" onClick={() => changeBet(-1)}
        style={{ position: "absolute", left: 98, top: 611, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: 10 }}>
        <span style={glyph}>−</span>
      </div>
      <div role="button" aria-label="Aumentar aposta" onClick={() => changeBet(1)}
        style={{ position: "absolute", left: 307, top: 611, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: 10 }}>
        <span style={glyph}>+</span>
      </div>

      <PressZone left={55} top={693} width={337} height={60.5} radius={13} strength="strong"
        sunk={spinning} delay={280} onPress={press} onRelease={release} onClick={spin}
        assetBase={assetBase} label="Girar">
        {!spinning && (
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 48, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))", animation: "fcShine 2.8s ease-in-out infinite", pointerEvents: "none" }} />
        )}
      </PressZone>

      <PressZone left={23.5} top={613.2} width={37} height={37} strength="soft" sunk={turbo}
        onPress={press} onRelease={release} assetBase={assetBase} label="Turbo"
        onClick={() => { setTurbo((t) => !t); setHint(turbo ? "Turbo desligado" : "Turbo ligado"); }} />
      {turbo && <StatePill left={18.5} text="TURBO" />}
      <PressZone left={391.4} top={614.1} width={37} height={37} strength="soft" sunk={auto}
        onPress={press} onRelease={release} assetBase={assetBase} label="Auto"
        onClick={() => { setAuto((a) => !a); setHint(auto ? "Automático parado" : "Giro automático"); }} />
      {auto && <StatePill left={386.5} text="AUTO" />}

      <PressZone left={340.5} top={29.5} width={41} height={41} strength="soft"
        onPress={press} onRelease={release} assetBase={assetBase} label="Recarregar"
        onClick={() => { setBalance(1000); setHint("Saldo recarregado — boa sorte!"); }} />
      <PressZone left={390.5} top={29.5} width={41} height={41} strength="soft"
        onPress={press} onRelease={release} assetBase={assetBase} label="Menu" onClick={onMenu} />

      {!sfxLevel && (
        <div style={{ position: "absolute", left: 406, top: 68, fontSize: 10, fontWeight: 800, color: "#ffd257", pointerEvents: "none" }}>✕</div>
      )}

      <div style={{ position: "absolute", left: 0, right: 0, top: 770, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#e9d2fa", textShadow: "0 1px 3px rgba(0,0,0,.65)" }}>{hint}</span>
      </div>
    </div>
  );
}
