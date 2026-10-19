import React from 'react';
import ReactDOM from 'react-dom';
import {createRoot} from 'react-dom/client';
globalThis.React=React;globalThis.ReactDOM=ReactDOM;
const {MenuButton,MenuPanel}=require('../../ui/menu.js');
export function mountMenu(settings,onSettings,onHelp,onOpen,options={}){
  const root=createRoot(document.getElementById('menu-root'));
  function App(){
    const[open,setOpen]=React.useState(false),[prefs,setPrefs]=React.useState(settings);
    const update=(key,value)=>{const next={...prefs,[key]:value};setPrefs(next);onSettings(next);};
    return React.createElement(React.Fragment,null,
      React.createElement(MenuButton,{onClick:()=>{setOpen(true);onOpen(true);},style:{position:'relative',inset:'auto',transform:'none',width:42,height:42,background:"url('./assets/menu.png') center / contain no-repeat"}}),
      React.createElement(MenuPanel,{open,onClose:()=>{setOpen(false);onOpen(false);},screen:options.screen||'Fortune Impulso',details:'Versão de teste: 1.000 moedas de demonstração. O botão REPOR reinicia este protótipo.',sfxLvl:prefs.sfx,vibLvl:prefs.vib,onSfx:v=>update('sfx',v),onVib:v=>update('vib',v),onPaytable:()=>{setOpen(false);onOpen(false);onHelp();}}));
  }root.render(React.createElement(App));
}
