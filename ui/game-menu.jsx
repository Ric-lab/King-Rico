import React from 'react';
import ReactDOM from 'react-dom';
import {createRoot} from 'react-dom/client';
globalThis.React=React;globalThis.ReactDOM=ReactDOM;
const {MenuButton,MenuPanel}=require('./menu.js');
export function mountGameMenu({screen,details,onOpen,onHelp,onPreferences}){
 function Menu(){
  const [open,setOpen]=React.useState(false),[prefs,setPrefs]=React.useState({sfx:2,vib:2});
  React.useEffect(()=>window.KingRicoCloud?.watch(p=>setPrefs({sfx:p.settings.sfxLvl,vib:p.settings.vibLvl})),[]);
  const show=v=>{setOpen(v);onOpen(v);};const change=(key,value)=>{const next={...prefs,[key]:value};setPrefs(next);onPreferences(next);};
  return <><MenuButton onClick={()=>show(true)}/><MenuPanel open={open} onClose={()=>show(false)} screen={screen} details={details} sfxLvl={prefs.sfx} vibLvl={prefs.vib} onSfx={v=>change('sfx',v)} onVib={v=>change('vib',v)} onPaytable={()=>{show(false);onHelp();}}/></>;
 }
 createRoot(document.getElementById('menu-root')).render(<Menu/>);
}
