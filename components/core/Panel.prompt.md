A folha de menu do jogo — gradiente roxo escuro, borda dourada, canto 18, 405px de largura dentro do quadro de 453.

```jsx
<Panel title="Menu" onClose={close}>
  <div style={{ padding: "14px 18px 4px", fontSize: 10, letterSpacing: "1.6px", color: "#b98fd6" }}>AJUSTES</div>
  <ToggleRow icon="♫" label="Efeitos sonoros" hint="LIGADO" checked divider />
</Panel>
```

O corpo é sem padding de propósito: as seções do menu têm paddings diferentes (lista 0 18px, rodapé 14px 18px 16px com fundo `rgba(0,0,0,.24)`).
