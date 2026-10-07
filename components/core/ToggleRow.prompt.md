Uma linha de ajuste dentro da folha de menu. A linha inteira é clicável, não só o switch.

```jsx
<ToggleRow icon="♫" label="Efeitos sonoros" hint="LIGADO" checked={sound} onChange={setSound} divider />
<ToggleRow icon="≈" label="Vibração" hint="DESLIGADO" checked={false} onChange={setVibrate} />
```

Estado em pt-BR e caixa alta (`LIGADO` / `DESLIGADO`), sempre em `#b98fd6` — a cor não muda com o estado; quem sinaliza é o switch.
