// RNG draws for a first-row quina, with one losing bucket on every roll.
function rollDraws(used){
 return [...(used===0?Array(5).fill(0):[]),...Array.from({length:5},(_,c)=>c===(used+1)%5?[.99,0]:[0,0]).flat()];
}
function dropDraws(column,bin){const bins=require('../../games/fingo/bins.json')[column],i=bins.indexOf(bin);if(i<0)throw Error('Unreachable physical bucket');return [(i+.5)/bins.length];}
module.exports={rollDraws,dropDraws};
