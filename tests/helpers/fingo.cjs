// RNG draws for a first-row quina, with one losing bucket on every roll.
function rollDraws(used){
 return [...(used===0?Array(5).fill(0):[]),...Array.from({length:5},(_,c)=>c===(used+1)%5?[.99,0]:[0,0]).flat()];
}
module.exports={rollDraws};
