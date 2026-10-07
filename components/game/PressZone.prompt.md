A pressable crop of `stage-hd.png`. Pressing it sinks and darkens the painted button itself, instead of drawing a new button on top. Every button painted into the stage uses it.

```jsx
<PressZone left={55} top={693} width={337} height={60.5} radius={13}
  strength="strong" sunk={spinning} delay={280}
  onPress={() => audio.click(true)} onRelease={() => audio.click(false)}
  onClick={spin} label="Girar" />

<PressZone left={23.5} top={613.2} width={37} height={37}
  strength="soft" sunk={turbo} onPress={() => audio.click(true)}
  onClick={() => setTurbo(t => !t)} label="Turbo" />
```

- **Rhythm:** darkens in 30ms on press and recovers over 300–350ms. Never animate the darkening in slowly.
- **Spin bar:** stays sunk and ignores taps from the click until the reels stop.
- **Coins:** stay sunk while toggled on, but stay tappable so the player can turn them off.
- **Coordinates:** they are locked to the art (see `ui_kits/slot-game/README.md`). If they are off by even 1px, a light ring shows around the dark area.
