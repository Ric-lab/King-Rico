"""Regression: resume a real saved avalanche with an incompletely emitted reserve."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,os
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'work/cascade';OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('CASCADE_URL','http://127.0.0.1:5097')
# A valid persisted checkpoint: fee already paid, all base marbles resolved,
# golden triple unlocked once; four of twelve extra marbles are falling.
fixture={'version':2,'balance':975,'bet':25,'settings':{'sfx':0,'vib':0},'round':{
 'id':'resume-open-gate','seed':123,'practice':False,'bet':25,'phase':'playing',
 'tick':607,'spawned':60,'total':72,'deadline':960,
 'gates':[{'openedAt':600,'spawned':4},{'openedAt':None,'spawned':0},{'openedAt':None,'spawned':0}],
 'resolved':list(range(60)),'balls':[{'id':71-i,'x':97-i*14,'y':109,'vx':0,'vy':2,'angle':0,'av':0} for i in range(4)],
 'catcher':180,'points':6,'caught':3,'comboColor':-1,'comboCount':0,'combos':1}}
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
 c.add_init_script('if(!localStorage.getItem("king-rico-cascade-demo-v3"))localStorage.setItem("king-rico-cascade-demo-v3",'+json.dumps(json.dumps(fixture))+')')
 p=c.new_page();errors=[];failed=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' else None);p.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
 p.goto(URL,wait_until='networkidle');p.wait_for_function('window.cascade');before=p.evaluate('cascade.snapshot().state')
 assert before['balance']==975;assert before['round']['phase']=='playing';assert before['round']['gates'][0]['spawned']>=4
 p.reload(wait_until='domcontentloaded');p.wait_for_function('window.cascade');s=p.evaluate('cascade.snapshot()')
 assert s['state']['round']['id']=='resume-open-gate';assert s['state']['balance']==975
 assert s['state']['round']['gates'][0]['openedAt']==600;assert s['state']['round']['total']==72
 assert s['state']['round']['gates'][0]['spawned']>=4
 assert any(ball['id']>=60 for ball in s['balls'])
 p.screenshot(path=str(OUT/'final-resume-avalanche.png'))
 p.wait_for_function("cascade.snapshot().state.round.phase==='paid'",timeout=120000)
 s=p.evaluate('cascade.snapshot().state');assert s['round']['gates'][0]['spawned']==12
 assert len(s['round']['resolved'])==len(set(s['round']['resolved']))==72
 expected=975+s['round']['bet']*s['round']['points']//25;assert s['balance']==expected
 p.reload(wait_until='domcontentloaded');p.wait_for_function('window.cascade');assert p.evaluate('cascade.snapshot().state.balance')==expected
 assert not errors,errors;assert not failed,failed
 print('PASS avalanche salva com fila parcial: comporta preservada, 12 extras resolvidos uma vez, sem nova aposta nem prêmio duplicado',flush=True)
 b.close()
