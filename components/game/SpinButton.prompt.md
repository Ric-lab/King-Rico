The green spin bar as a standalone CSS button. It darkens and sinks right away on press, stays sunk while spinning, and fires `onClick` 280ms after the click.

```jsx
<SpinButton state="ready" onPress={() => audio.click(true)} onClick={spin} />
<SpinButton state="spinning" />
```

- On the game stage, use `PressZone` over `stage-hd.png`: the bar is painted into the art.
- The corners are a soft 13px (`--fc-radius-spin`), not a pill.
- The shine sweep only runs while the bar can be tapped.
