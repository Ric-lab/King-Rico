Round gold-coin button for navigation and small repeated actions (home, menu, bet +/−, turbo).

```jsx
<IconButton icon="home" size={56} assetBase="../../" label="Início" />
<IconButton glyph="＋" size={44} onClick={incBet} />
<IconButton glyph="»" active={turbo} onClick={toggleTurbo} label="Turbo" />
```

`icon` uses the real PNG coin art and needs no border; `glyph` builds the coin from the gold gradient. Press shrinks to 0.88 — that squash is the brand's tactility.
