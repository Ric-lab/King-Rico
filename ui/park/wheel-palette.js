// Shared by the bonus wheel and both reservoir goals, ordered like the liquid.
const RAINBOW=['#8e24ff','#6830ff','#174fff','#008dff','#00cfff','#00e7bc','#00c65a','#91df21','#ffdf22','#ffb314','#ff861c','#ff4c36','#f52364'];
export function pocketColors(count){return Array.from({length:count},(_,i)=>RAINBOW[Math.round(i*(RAINBOW.length-1)/Math.max(1,count-1))]);}
