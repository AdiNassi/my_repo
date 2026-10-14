const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const listeners={},elements={};
function el(id){return elements[id]??=( {id,value:({mode:'solo',background:'classroom',hero:'lecturer',shot:'chalk',target:'students'})[id],hidden:false,open:false,textContent:'',addEventListener(n,f){this[n==='close'?'closeEvent':n]=f},focus(){},scrollIntoView(){},setAttribute(){},showModal(){this.open=true},close(){this.open=false;this.closeEvent?.()},getContext(){return ctx}});}
const gradient={addColorStop(){}};const ctx=new Proxy({}, {get:(_,k)=>k==='createLinearGradient'||k==='createRadialGradient'?()=>gradient:()=>{}});
let frame;const window={addEventListener(n,f){listeners[n]=f}};
const env={window,document:{body:{dataset:{}},getElementById:el,querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:f=>frame=f,Math,Set};
let source=fs.readFileSync(__dirname+'/../game.js','utf8');
source=source.replace('setup();invincible=0;overlay', `window.testHooks={
placeTarget:()=>{bubbles=[bubble(player.x,365,0,0),bubble(50,80,0,0)];bubbles[0].vy=0;player.cooldown=0;ropes=[];},
placeDrop:type=>{drops=[{x:player.x,y:450,type,life:12}];},
placeMovingTarget:()=>{bubbles=[bubble(100,100,0,100)];bubbles[0].vy=0;},
targetX:()=>bubbles[0]?.x,
variants:()=>bubbles.map(b=>b.variant)
};setup();invincible=0;overlay`);
vm.runInNewContext(source,env);
const game=window.BubbleGame;
function key(code,type='keydown'){listeners[type]({code,target:{tagName:'CANVAS'},preventDefault(){}})}
assert.equal(game.getState().state,'ready');
el('mode').value='duo';el('mode').change();el('beginBtn').click();
let state=game.getState();assert.equal(state.players.length,2);assert.equal(env.document.body.dataset.screen,'game');assert(state.players[0].x>state.players[1].x,'Arrow player starts on the right');const initial=state.players.map(p=>p.x);
key('ArrowRight');key('KeyA');key('Space');key('KeyW');game.update(.05);state=game.getState();
assert(state.players[0].x>initial[0]);assert(state.players[1].x<initial[1]);assert.equal(state.ropes,2);
el('helpBtn').click();assert.equal(game.getState().state,'help');const frozen=JSON.stringify(game.getState());game.update(.5);assert.equal(JSON.stringify(game.getState()),frozen);
el('closeHelp').click();assert.equal(game.getState().state,'playing');const positions=game.getState().players.map(p=>p.x);game.update(.05);assert.deepEqual(game.getState().players.map(p=>p.x),positions);
game.pause();el('helpBtn').click();el('closeHelp').click();assert.equal(game.getState().state,'paused');
el('settingsBtn').click();assert.equal(game.getState().state,'ready');assert.equal(env.document.body.dataset.screen,'setup');
for(const bg of ['classroom','space','castle'])for(const hero of ['lecturer','astronaut','wizard'])for(const target of ['students','aliens','orbs']){el('background').value=bg;el('hero').value=hero;el('target').value=target;el('target').change();frame(100);}
el('mode').value='solo';el('mode').change();game.start();assert.equal(game.getState().players.length,1);assert.equal(game.getState().lives,3);assert.equal(game.getState().score,0);
const hooks=window.testHooks;
for(let i=0;i<3;i++){hooks.placeTarget();key('Space');game.update(.02);key('Space','keyup');}
assert.equal(game.getState().drops,1,'Every third pop drops a bonus');
game.start();hooks.placeDrop('slow');game.update(.01);assert.equal(game.getState().effects.slow,8);
hooks.placeMovingTarget();const x=hooks.targetX();game.update(.1);assert(Math.abs(hooks.targetX()-x-4.5)<.001,'Slow bonus reduces target speed to 45%');
el('helpBtn').click();const remaining=game.getState().effects.slow;game.update(1);assert.equal(game.getState().effects.slow,remaining,'Help freezes bonus duration');el('closeHelp').click();
hooks.placeDrop('double');game.update(.01);key('Space');game.update(.02);key('Space','keyup');assert.equal(game.getState().ropes,2,'Double bonus fires two shots');
for(let i=0;i<82;i++)game.update(.1);assert.equal(game.getState().effects.slow,0);assert.equal(game.getState().effects.double,0);
game.start();assert.equal(game.getState().drops,0);assert.equal(game.getState().effects.slow,0);
console.log('PASS: drops, collection, slow physics, double shots, effect expiry/reset and paused timers');
console.log('PASS: co-op movement and firing, help pause/resume, paused help, settings, 27 visual combinations, solo reset');
