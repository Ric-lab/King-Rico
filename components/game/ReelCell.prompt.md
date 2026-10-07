A reel cell: cream face + one symbol from `assets/symbols-v6.png`, centered at 124 units and scaled with the cell.

```jsx
<ReelCell symbol="crown" />
<ReelCell symbol="wild" state="win" size={64} />
<ReelCell symbol="gem" face={false} width={122.5} height={127.5} /> {/* on top of stage-hd.png */}
```

- `state`: `idle`, `spinning` (swap the symbol every 70ms too — blur alone reads as a flicker), `drop`, `win`, `lock`, `antic`, `dim`.
- On the game stage use `face={false}`: the cream faces are painted into `stage-hd.png`.
- Symbols are illustration. Never recolor, crop or use them as UI icons.
