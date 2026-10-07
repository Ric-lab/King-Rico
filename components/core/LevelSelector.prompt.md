A three-position control (OFF · 50% · 100%) for sound effects and vibration in the menu.

```jsx
<LevelRow icon="♫" label="Efeitos sonoros" value={sfx} onChange={setSfx} divider />
<LevelRow icon="≈" label="Vibração" value={vib} onChange={setVib} />
```

- **Sound at 50%:** set the master gain to 0.35 × max, which the ear hears as about half. Fade the change in over about 30ms and play a click so the player hears the new level.
- **Vibration at 50%:** halve each pulse's duration and stretch the gaps 1.4×. Browsers can't control vibration strength, only its duration. Buzz once when the level is chosen.
- **Colors:** the selected option is green `#2ec962`; OFF shows in translucent white.
- **Binary settings:** keep `ToggleRow` / `Switch` for anything that is only on or off.
