const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const listeners={},elements={};
function el(id){return elements[id]??=( {id,value:({mode:'solo',background:'classroom',hero:'lecturer',shot:'chalk',target:'students'})[id],hidden:false,open:false,textContent:'',addEventListener(n,f){this[n==='close'?'closeEvent':n]=f},focus(){},scrollIntoView(){},setAttribute(){},showModal(){this.open=true},close(){this.open=false;this.closeEvent?.()},getContext(){return ctx}});}
const gradient={addColorStop(){}};const ctx=new Proxy({}, {get:(_,k)=>k==='createLinearGradient'||k==='createRadialGradient'?()=>gradient:()=>{}});
let frame;const window={addEventListener(n,f){listeners[n]=f}};
const env={window,document:{getElementById:el,querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:f=>frame=f,Math,Set};
vm.runInNewContext(fs.readFileSync(__dirname+'/../game.js','utf8'),env);
const game=window.BubbleGame;
function key(code,type='keydown'){listeners[type]({code,target:{tagName:'CANVAS'},preventDefault(){}})}
assert.equal(game.getState().state,'ready');
el('mode').value='duo';el('mode').change();el('beginBtn').click();
let state=game.getState();assert.equal(state.players.length,2);const initial=state.players.map(p=>p.x);
key('ArrowRight');key('KeyA');key('Space');key('KeyW');game.update(.05);state=game.getState();
assert(state.players[0].x>initial[0]);assert(state.players[1].x<initial[1]);assert.equal(state.ropes,2);
el('helpBtn').click();assert.equal(game.getState().state,'help');const frozen=JSON.stringify(game.getState());game.update(.5);assert.equal(JSON.stringify(game.getState()),frozen);
el('closeHelp').click();assert.equal(game.getState().state,'playing');const positions=game.getState().players.map(p=>p.x);game.update(.05);assert.deepEqual(game.getState().players.map(p=>p.x),positions);
game.pause();el('helpBtn').click();el('closeHelp').click();assert.equal(game.getState().state,'paused');
el('settingsBtn').click();assert.equal(game.getState().state,'ready');
for(const bg of ['classroom','space','castle'])for(const hero of ['lecturer','astronaut','wizard'])for(const target of ['students','aliens','orbs']){el('background').value=bg;el('hero').value=hero;el('target').value=target;el('target').change();frame(100);}
el('mode').value='solo';el('mode').change();game.start();assert.equal(game.getState().players.length,1);assert.equal(game.getState().lives,3);assert.equal(game.getState().score,0);
console.log('PASS: co-op movement and firing, help pause/resume, paused help, settings, 27 visual combinations, solo reset');
