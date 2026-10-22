/* Shared betting and climb/collect controls for Neck and Flying Clown. */
const h = React.createElement;
function RoundControls({active,busy,betText,prizeText,onBetDown,onBetUp,onStart,onClimb,onCollect,
  betDownDisabled,betUpDisabled,startDisabled,collectDisabled,collectLabel='Pegar o prêmio'}) {
  const action=(label,onClick,disabled,extraClass='',children=null,aria=label)=>h('button',{
    key:label,type:'button',className:'kr-button kr-round-action '+extraClass,onClick,disabled:!!disabled,'aria-label':aria
  },h('span',{className:'kr-round-label'},label),children);
  return h('div',{className:'kr-round-controls',role:'group','aria-label':active?'Controles da rodada':'Escolher aposta',
    'data-round-phase':active?'playing':'bet'},active?[
      action('PEGAR',onCollect,busy||collectDisabled,'kr-button--gold kr-round-collect',
        h('span',{className:'kr-round-prize'},h('img',{src:'assets/symbols/sym-coin.webp',alt:''}),
          h('span',null,prizeText)),collectLabel),
      action('SUBIR',onClimb,busy)
    ]:[
      h('div',{key:'bet',className:'kr-round-bet'},
        h('button',{type:'button',className:'kr-stepper',onClick:onBetDown,disabled:!!(busy||betDownDisabled),'aria-label':'Diminuir aposta'},'−'),
        h('div',{className:'kr-round-bet-value'},h('span',null,'APOSTA'),h('strong',null,betText)),
        h('button',{type:'button',className:'kr-stepper',onClick:onBetUp,disabled:!!(busy||betUpDisabled),'aria-label':'Aumentar aposta'},'+')),
      action('JOGAR',onStart,busy||startDisabled)
    ]);
}
module.exports={RoundControls};
