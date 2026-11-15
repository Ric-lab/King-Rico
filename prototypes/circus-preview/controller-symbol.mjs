// Test-wallet only. Never imported by the production client or Firestore rules.
import engine from '../../cloud/engine.cjs';
export const CONTROLLER_WEIGHT=6;
export function previewSymbols(){return engine.slotSymbols(6).map((s,i)=>i===15?{...s,w:CONTROLLER_WEIGHT,active:true}:{...s});}
export function withControllerDraw(draw){
 const symbol=engine.slotSymbols(6)[15],previous={w:symbol.w,active:symbol.active};
 // The shared engine draws synchronously; restore even when the draw fails.
 Object.assign(symbol,{w:CONTROLLER_WEIGHT,active:true});
 try{return draw();}finally{Object.assign(symbol,previous);}
}
