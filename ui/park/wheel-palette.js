// Shared by the bonus wheel and both reservoir goals, ordered like the liquid.
const RAINBOW=['#8e24ff','#6830ff','#174fff','#008dff','#00cfff','#00e7bc','#00c65a','#91df21','#ffdf22','#ffb314','#ff861c','#ff4c36','#f52364'];
// Cada multiplicador tem SEMPRE a mesma cor (pedido do dono): x1 azul, x2 verde, x3 amarelo, x5 laranja, x10 rosa.
const VALUE_COLOR={1:'#008dff',2:'#00c65a',3:'#ffdf22',5:'#ff861c',10:'#f52364'};
export const WHEEL_POCKETS=[10,1,2,1,3,2,1,5,2,1,3,2,1];
export function valueColor(v){return VALUE_COLOR[v]||'#8e24ff';}
export function pocketColors(count,values){if(values)return values.map(valueColor);return Array.from({length:count},(_,i)=>RAINBOW[Math.round(i*(RAINBOW.length-1)/Math.max(1,count-1))]);}
