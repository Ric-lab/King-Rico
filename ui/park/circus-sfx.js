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
// Patada: UM som contínuo — um só chiado que desce (zuum) e um grave que desce junto, mesmo envelope.
 fc.sfxClaw=play(3.4,n=>{const ac=fc.ac(),out=fc.out(),t=ac.currentTime,d=.3;
  const src=ac.createBufferSource();src.buffer=fc.noise(ac);const f=ac.createBiquadFilter();f.type='bandpass';f.Q.value=1.1;f.frequency.setValueAtTime(3200,t);f.frequency.exponentialRampToValueAtTime(260,t+d);
  const o=ac.createOscillator();o.type='sine';o.frequency.setValueAtTime(220-n*10,t);o.frequency.exponentialRampToValueAtTime(50,t+d);
  const g=ac.createGain(),go=ac.createGain();for(const [x,v] of [[g,.55*K],[go,.4*K]]){x.gain.setValueAtTime(.0001,t);x.gain.exponentialRampToValueAtTime(v,t+d*.55);x.gain.exponentialRampToValueAtTime(.0001,t+d);}
  src.connect(f);f.connect(g);g.connect(out);o.connect(go);go.connect(out);src.start(t);src.stop(t+d+.02);o.start(t);o.stop(t+d+.02);});
 fc.sfxCoinsLose=play(2.2,n=>{for(let i=0;i<7;i++)B(1400-i*120-n*60,.16,.04,.14+i*.06+Math.random()*.03);hiss(900,.6,.035,.35,.2,'lowpass');});
 // Tucker: duas batidas de asa (tec… tec) e sobe levando a cesta.
 fc.sfxSnatch=play(3.4,()=>{[0,.4].forEach(o=>{for(let i=0;i<4;i++)hiss(700,1.4,.08,.07,o+i*.09);});sweep(900,1800,.25,'triangle',.05,.05);hiss(500,.7,.045,.35,.1,'bandpass',1600);});
 // Ray: papel dos ingressos + "peguei!" de fininho; depois passinhos fugindo.
 fc.sfxSneak=play(1.8,()=>{for(let i=0;i<5;i++)hiss(4800,1.5,.045,.05,i*.045);[392,349.23,311.13,261.63].forEach((f,i)=>P(f,.08,.14,.08+i*.11));});
 fc.sfxScurry=play(1,()=>{for(let i=0;i<8;i++)hiss(1600+(i%2)*400,1.2,1.3,.04,i*.07);});
 // Big win: decolagem, motor que sobe com a altitude e o saldo recebendo.
 // Decolagem: sopro que sobe + arpejo alegre (dó-mi-sol-dó).
 fc.sfxTakeoff=play(1.7,()=>{hiss(500,.8,.06,.7,0,'bandpass',2400);[523.25,659.25,783.99,1046.5].forEach((f,i)=>B(f,.35,.07,.08+i*.09));});
 // Avião: sopro de hélice (ruído picotado pelas pás) + zumbido redondo que sobe com a altitude. Sem dente-de-serra.
 fc.sfxEngine=()=>{if(!ok())return null;try{
  const ac=fc.ac(),out=fc.out(),t=ac.currentTime,g=ac.createGain();g.connect(out);
  const n=ac.createBufferSource();n.buffer=fc.noise(ac);n.loop=true;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=520;bp.Q.value=1.6;
  const chop=ac.createGain(),lfo=ac.createOscillator(),lg=ac.createGain();lfo.type='sine';lfo.frequency.value=14;lg.gain.value=.35;chop.gain.value=.3;lfo.connect(lg);lg.connect(chop.gain);
  n.connect(bp);bp.connect(chop);chop.connect(g);
  const h=ac.createOscillator(),hg=ac.createGain();h.type='triangle';h.frequency.value=140;hg.gain.value=.5;h.connect(hg);hg.connect(g);
  const h2=ac.createOscillator(),h2g=ac.createGain();h2.type='sine';h2.frequency.value=210;h2g.gain.value=.18;h2.connect(h2g);h2g.connect(g);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+.6);[n,lfo,h,h2].forEach(x=>x.start(t));let done=false;
  return {set(p){if(done)return;const m=ac.currentTime;lfo.frequency.setTargetAtTime(14+p*16,m,.15);bp.frequency.setTargetAtTime(520+p*500,m,.15);h.frequency.setTargetAtTime(140+p*90,m,.15);h2.frequency.setTargetAtTime(210+p*135,m,.15);},
   stop(){if(done)return;done=true;try{const m=ac.currentTime;g.gain.cancelScheduledValues(m);g.gain.setValueAtTime(Math.max(g.gain.value,.0002),m);g.gain.exponentialRampToValueAtTime(.0001,m+.5);[n,lfo,h,h2].forEach(x=>x.stop(m+.55));}catch{}}};
 }catch{return null;}};
 fc.sfxBank=play(1.4,()=>{for(let i=0;i<12;i++)B(1300+i*90,.18,.045,i*.07);[1046.5,1318.5,1568,2093].forEach((f,i)=>B(f,.6,.1,.9+i*.06));});
 // Good Luck: faísca elétrica na descida e estalo/trovão sincronizados ao impacto no botão.
 // Raio do Good Luck (feliz, Claude): subida mágica de sininhos durante a queda → no impacto, "plim!" brilhante
 // em acorde maior + estalinho curto. Tudo agendado a partir do MESMO instante do impacto (T = agora + delay).
 // Raio do Good Luck — FELIZ (Claude): sininhos subindo na queda, "plim-zap" brilhante cravado no impacto e acorde maior cintilante. Sem trovão.
 // Raio do Good Luck FELIZ: sininhos subindo na queda, "zap" brilhante cravado no impacto (relógio do áudio) e acorde maior cintilante.
 fc.sfxLightning=play(1.5,(delaySec=.64)=>{const d=Math.max(.12,Number(delaySec)||.64);
  [784,880,988,1175,1319,1568].forEach((f,i)=>B(f,.18,.035+i*.006,d*(.12+i*.14)));
  hiss(5200,3,.09,.05,d-.005,'bandpass');sweep(2400,4200,.08,'triangle',.12,d);
  [1047,1319,1568,2093].forEach((f,i)=>B(f,.9,.1-i*.012,d+i*.035));
  [2637,3136,3520].forEach((f,i)=>B(f,.35,.03,d+.18+i*.08));
 });
}
