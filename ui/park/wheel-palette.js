// Shared by the bonus wheel and both reservoir goals, ordered like the liquid.
const RAINBOW=['#8e24ff','#6830ff','#174fff','#008dff','#00cfff','#00e7bc','#00c65a','#91df21','#ffdf22','#ffb314','#ff861c','#ff4c36','#f52364'];
// Cada multiplicador tem SEMPRE a mesma cor (pedido do dono): x1 azul, x2 verde, x3 amarelo, x5 laranja, x10 rosa.
const LEGACY_COLOR={1:'#008dff',2:'#00c65a',3:'#ffdf22',5:'#ff861c',10:'#f52364'};
const VALUE_COLOR={2:'#008dff',4:'#00c65a',6:'#ffdf22',8:'#ff861c',10:'#f52364'};
export const WHEEL_POCKETS=[10,2,4,2,6,4,2,8,4,2,6,4,2];
export function valueColor(v){return VALUE_COLOR[v]||LEGACY_COLOR[v]||'#8e24ff';}
export function pocketColors(count,values){if(values){const map=values.includes(1)?LEGACY_COLOR:VALUE_COLOR;return values.map(v=>map[v]||'#8e24ff');}return Array.from({length:count},(_,i)=>RAINBOW[Math.round(i*(RAINBOW.length-1)/Math.max(1,count-1))]);}
