// Efeitos sonoros dos vilões e do voo da big win. Só som: não muda tempo, saldo, animação nem regra.
// Tudo passa pelo mesmo bus do Circus (fc.out) e respeita som/volume do menu. Pico de referência ≈ vitória comum.
export function installCircusSfx(fc){
 let K=1;const P=(f,v,d,w)=>fc.pluck(f,v*K,d,w),B=(f,d,v,w)=>fc.bell(f,d,v*K,w);
 const ok=()=>{try{return !!(fc.gate()&&fc.ac()&&fc.out());}catch{return false;}};
 const hiss=(f,q,vol,dur,when=0,type='bandpass',f2)=>{const ac=fc.ac(),out=fc.out(),t=ac.currentTime+when,s=ac.createBufferSource();s.buffer=fc.noise(ac);
  const b=ac.createBiquadFilter();b.type=type;b.frequency.setValueAtTime(f,t);if(f2)b.frequency.exponentialRampToValueAtTime(f2,t+dur);b.Q.value=q;
  const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol*K,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(b);b.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.05);};
 const sweep=(f1,f2,dur,type,vol,when=0)=>{const ac=fc.ac(),out=fc.out(),t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();
  o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol*K,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);};
 // k = ganho de equalização medido (RMS ≈ vitória comum, 0,04).
 const play=(k,fn)=>(...a)=>{if(!ok())return;K=k;try{fn(...a);}catch{/* som nunca interrompe o jogo */}finally{K=1;}};
 // Vilão aparece nos rolos: "ih!" de circo (sol → dó#) + assinatura de cada um.
 fc.sfxVillain=play(1.4,kind=>{
  P(392,.1,.32);P(277.18,.1,.5,.16);hiss(160,.8,.08,.25,0,'lowpass');
  if(kind==='tony')sweep(110,70,.55,'sawtooth',.03,.05);
  else if(kind==='tucker'){sweep(1600,2600,.07,'sine',.05,.36);sweep(1700,2900,.07,'sine',.05,.47);}
  else [523.25,466.16,392].forEach((f,i)=>P(f,.06,.12,.36+i*.09));
 });
 // Tony: patada (zás + 3 unhas + pancada) e moedas saindo do saldo (cada vez mais grave).
 // Patada: zuum de ar cortado (sobe e desce), sem moedas — moedas só no CONTINUAR.
fc.sfxClaw=play(1.6,n=>{const d=.32;hiss(420,1.6,.11,d*.55,0,'bandpass',2600);hiss(2600,1.6,.11,d*.5,d*.45,'bandpass',380);hiss(260,.7,.05,d,0,'lowpass',900);sweep(95-n*6,60,d,'sine',.05,.04);});
 fc.sfxCoinsLose=play(2.2,n=>{for(let i=0;i<7;i++)B(1400-i*120-n*60,.16,.04,.14+i*.06+Math.random()*.03);hiss(900,.6,.035,.35,.2,'lowpass');});
 // Tucker: duas batidas de asa (tec… tec) e sobe levando a cesta.
 fc.sfxSnatch=play(3.4,()=>{[0,.4].forEach(o=>{for(let i=0;i<4;i++)hiss(700,1.4,.08,.07,o+i*.09);});sweep(900,1800,.25,'triangle',.05,.05);hiss(500,.7,.045,.35,.1,'bandpass',1600);});
 // Ray: papel dos ingressos + "peguei!" de fininho; depois passinhos fugindo.
 fc.sfxSneak=play(1.8,()=>{for(let i=0;i<5;i++)hiss(4800,1.5,.045,.05,i*.045);[392,349.23,311.13,261.63].forEach((f,i)=>P(f,.08,.14,.08+i*.11));});
 fc.sfxScurry=play(1,()=>{for(let i=0;i<8;i++)hiss(1600+(i%2)*400,1.2,1.3,.04,i*.07);});
 // Big win: decolagem, motor que sobe com a altitude e o saldo recebendo.
 fc.sfxTakeoff=play(1.7,()=>{hiss(400,.7,.07,.6,0,'bandpass',1800);P(523.25,.08,.3,.05);P(783.99,.08,.4,.15);});
 fc.sfxEngine=()=>{if(!ok())return null;try{
  const ac=fc.ac(),out=fc.out(),t=ac.currentTime,o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),am=ac.createGain(),lp=ac.createBiquadFilter(),g=ac.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(90,t);lfo.frequency.setValueAtTime(18,t);lg.gain.value=.45;am.gain.value=.55;lp.type='lowpass';lp.frequency.value=650;
  lfo.connect(lg);lg.connect(am.gain);o.connect(lp);lp.connect(am);am.connect(g);g.connect(out);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09,t+.4);o.start(t);lfo.start(t);let done=false;
  return {set(p){if(done)return;const n=ac.currentTime;o.frequency.setTargetAtTime(90+p*110,n,.12);lfo.frequency.setTargetAtTime(18+p*22,n,.12);lp.frequency.setTargetAtTime(650+p*900,n,.12);},
   stop(){if(done)return;done=true;try{const n=ac.currentTime;g.gain.cancelScheduledValues(n);g.gain.setValueAtTime(Math.max(g.gain.value,.0002),n);g.gain.exponentialRampToValueAtTime(.0001,n+.45);o.stop(n+.5);lfo.stop(n+.5);}catch{}}};
 }catch{return null;}};
 fc.sfxBank=play(1.4,()=>{for(let i=0;i<12;i++)B(1300+i*90,.18,.045,i*.07);[1046.5,1318.5,1568,2093].forEach((f,i)=>B(f,.6,.1,.9+i*.06));});
}
