import React from 'react';
import ReactDOM from 'react-dom';
import {createRoot} from 'react-dom/client';
globalThis.React = React;
globalThis.ReactDOM = ReactDOM;
const {MenuButton, MenuPanel} = require('../../ui/menu.js');

export function mountMenu(onOpen, onHelp, onPreferences, initial) {
  function Menu() {
    const [open, setOpen] = React.useState(false);
    const [preferences, setPreferences] = React.useState(initial);
    React.useEffect(()=>window.KingRicoCloud?.watch(p=>setPreferences({sfx:p.settings.sfxLvl,vib:p.settings.vibLvl})),[]);
    const change = (key, value) => {
      const next = {...preferences, [key]: value};
      setPreferences(next); onPreferences(next);
    };
    const show = value => {setOpen(value); onOpen(value);};
    return <>
      <MenuButton onClick={() => show(true)} style={{position:'relative', inset:'auto', transform:'none', width:56, height:56, background:"url('./assets/icons/btn-menu.png') center/contain no-repeat"}} />
      <MenuPanel open={open} onClose={() => show(false)} screen="Fortune 21"
        details="Você contra a banca. Peça cartas ou pare sem passar de 21. Sua mão fica salva na conta e o saldo é o mesmo dos outros jogos."
        sfxLvl={preferences.sfx} vibLvl={preferences.vib}
        onSfx={value => change('sfx', value)} onVib={value => change('vib', value)}
        onPaytable={() => {show(false); onHelp();}} />
    </>;
  }
  createRoot(document.getElementById('menu-root')).render(<Menu />);
}
