(() => {
'use strict';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W=960,H=560,FLOOR=500;
canvas.width=W; canvas.height=H;
const $=id=>document.getElementById(id);
const keys=new Set();
let bubbles=[],ropes=[],particles=[],state='ready',score=0,level=1,lives=3,time=0,cooldown=0,invincible=0,transition=0,last=0,sound=false,audio;
let best=0; try {best=Number(localStorage.getItem('bubbleTroubleBest'))||0;}catch(e){}
const player={x:W/2,y:FLOOR,w:28,h:44,cooldown:0,id:1};
const player2={x:W*.7,y:FLOOR,w:28,h:44,cooldown:0,id:2};
const config={mode:'solo',background:'classroom',hero:'lecturer',shot:'chalk',target:'students'};
const activePlayers=()=>config.mode==='duo'?[player,player2]:[player];
let helpPrevious='ready';
function clearKeys(){keys.clear();}
function readConfig(){for(const name of Object.keys(config))config[name]=$(name).value;setup();}
function showSetup(){clearKeys();state='ready';$('setupPanel').hidden=false;setup();overlay('בוחרים ויוצאים לדרך','בחרו עיצוב ומצב משחק למעלה. אפשר לערבב בין כל הסטים.');$('setupPanel').scrollIntoView({behavior:'smooth',block:'start'});}
function showHelp(){if($('helpDialog').open)return;helpPrevious=state;clearKeys();if(state==='playing')state='help';$('helpDialog').showModal();}
function closeHelp(){if($('helpDialog').open)$('helpDialog').close();if(state==='help')state=helpPrevious;clearKeys();if(state==='playing'||state==='paused')canvas.focus();}

const radii=[14,25,40,59], colors=['#ffb84d','#63e9b7','#5ab7ff','#ba91ff'];
function tone(freq=500,duration=.07){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)(); const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=freq;g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.start();o.stop(audio.currentTime+duration);}catch(e){}}
function hud(){for(const [id,val] of Object.entries({score,level,lives,best}))if($(id))$(id).textContent=val;}
function overlay(title,text){if($('overlay'))$('overlay').hidden=false;if($('overlayTitle'))$('overlayTitle').textContent=title;if($('overlayText'))$('overlayText').textContent=text;if($('startBtn'))$('startBtn').textContent=state==='paused'?'המשך משחק ←':state==='over'?'נסו שוב ←':'מתחילים לשחק ←';}
function hide(){if($('overlay'))$('overlay').hidden=true;canvas.focus();}
function bubble(x,y,size,vx){return {x,y,size,r:radii[size],vx,vy:-260-size*65};}
function setup(){bubbles=[];ropes=[];player.x=config.mode==='duo'?W*.3:W/2;player2.x=W*.7;activePlayers().forEach(p=>p.cooldown=0);invincible=1.5;transition=0;const count=Math.min(2+Math.floor((level-1)/2),6);for(let i=0;i<count;i++)bubbles.push(bubble(100+i*(W-200)/Math.max(1,count-1),100+(i%2)*65,Math.min(3,1+Math.floor(level/2)),(i%2?1:-1)*(115+level*8)));hud();}
function start(){score=0;level=1;lives=3;time=0;cooldown=0;particles=[];clearKeys();setup();state='playing';$('setupPanel').hidden=true;hide();if($('pauseBtn'))$('pauseBtn').textContent='השהיה';canvas.focus();}
function pause(){clearKeys();if(state==='playing'){state='paused';overlay('הפסקה קטנה','לחצו על המשך או על P כדי לחזור למשחק');}else if(state==='paused'){state='playing';hide();}if($('pauseBtn'))$('pauseBtn').textContent=state==='paused'?'המשך':'השהיה';}
function burst(b){for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,s=60+Math.random()*150;particles.push({x:b.x,y:b.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.6,color:colors[b.size]});}}
function record(){if(score>best){best=score;try{localStorage.setItem('bubbleTroubleBest',String(best));}catch(e){}}hud();}
function shoot(p=player){if(state!=='playing'||p.cooldown>0||transition>0)return;ropes.push({x:p.x,y:FLOOR-p.h,life:1.5,owner:p.id});p.cooldown=.29;tone(p.id===1?780:920);}
function update(dt){time+=dt;particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);if(state!=='playing')return;activePlayers().forEach(p=>p.cooldown=Math.max(0,p.cooldown-dt));invincible=Math.max(0,invincible-dt);if(transition>0){transition-=dt;if(transition<=0){level++;setup();}return;}
for(const p of activePlayers()){
 const first=p.id===1;
 const left=first?(keys.has('ArrowLeft')||(config.mode==='solo'&&keys.has('KeyA'))):keys.has('KeyA');
 const right=first?(keys.has('ArrowRight')||(config.mode==='solo'&&keys.has('KeyD'))):keys.has('KeyD');
 p.x=Math.max(25,Math.min(W-25,p.x+((right?1:0)-(left?1:0))*320*dt));
 if(keys.has(first?'Space':'KeyW'))shoot(p);
}
for(const b of bubbles){b.vy+=620*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);}if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx);}if(b.y>FLOOR-b.r){b.y=FLOOR-b.r;b.vy=-(215+b.size*72);}if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy);}}
for(const r of ropes){r.y-=650*dt;r.life-=dt;const hit=bubbles.find(b=>Math.abs(b.x-r.x)<b.r+3&&b.y+b.r>=r.y&&b.y-b.r<=FLOOR-player.h);if(hit){r.life=0;burst(hit);bubbles.splice(bubbles.indexOf(hit),1);score+=50*(4-hit.size);if(hit.size>0){const size=hit.size-1,speed=145+level*8;bubbles.push(bubble(hit.x-4,hit.y,size,-speed),bubble(hit.x+4,hit.y,size,speed));}record();tone(300+hit.size*160);}}
ropes=ropes.filter(r=>r.life>0&&r.y>-20);
if(invincible<=0&&activePlayers().some(p=>bubbles.some(b=>{const x=Math.max(p.x-p.w/2,Math.min(b.x,p.x+p.w/2));const y=Math.max(FLOOR-p.h,Math.min(b.y,FLOOR));return (b.x-x)**2+(b.y-y)**2<b.r**2;}))){lives--;invincible=2;ropes=[];hud();tone(100,.3);if(lives<=0){state='over';record();overlay('הסיבוב הסתיים','צברתם '+score+' נקודות. נסו שוב ושברו את השיא!');}}
if(!bubbles.length&&state==='playing'){score+=level*200;record();transition=1.4;tone(1000,.2);}
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function student(b){
 ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.r,b.r);
 const skin=['#edb88f','#b97951','#f5cdb0','#d69b73'][b.size];
 ellipse(0,0,1,1,'#253c35');ellipse(0,.02,.94,.94,skin);
 ctx.fillStyle=['#382821','#221e24','#79482a','#43332c'][b.size];
 ctx.beginPath();ctx.moveTo(-.92,-.08);ctx.quadraticCurveTo(-1.04,-1.1,0,-.96);ctx.quadraticCurveTo(1.05,-1.03,.94,-.05);ctx.lineTo(.68,-.5);ctx.lineTo(.38,-.37);ctx.lineTo(.08,-.6);ctx.lineTo(-.28,-.38);ctx.lineTo(-.61,-.49);ctx.closePath();ctx.fill();
 ellipse(-.34,.04,.1,.13,'#2a2729');ellipse(.34,.04,.1,.13,'#2a2729');
 ellipse(-.36,0,.025,.035,'#fff');ellipse(.32,0,.025,.035,'#fff');
 ellipse(-.58,.3,.14,.07,'#da887766');ellipse(.58,.3,.14,.07,'#da887766');
 ctx.strokeStyle='#674434';ctx.lineWidth=.055;ctx.beginPath();ctx.arc(0,.3,.24,.1,Math.PI-.1);ctx.stroke();
 if(b.size%2===0){ctx.strokeStyle='#34425c';ctx.lineWidth=.065;ctx.beginPath();ctx.arc(-.34,.05,.24,0,Math.PI*2);ctx.moveTo(.58,.05);ctx.arc(.34,.05,.24,0,Math.PI*2);ctx.moveTo(-.1,.04);ctx.lineTo(.1,.04);ctx.stroke();}
 // Headphones keep the silhouettes readable even on the smallest students.
 if(b.size%2===1){ctx.strokeStyle='#edbd59';ctx.lineWidth=.11;ctx.beginPath();ctx.arc(0,0,.85,Math.PI,Math.PI*2);ctx.stroke();ellipse(-.86,.08,.12,.25,'#edbd59');ellipse(.86,.08,.12,.25,'#edbd59');}
 ctx.restore();
}
function lecturer(p=player){
 const x=p.x,y=FLOOR;ctx.save();ctx.translate(x,y);
 ellipse(0,-1,23,4,'#07151066');
 ctx.fillStyle='#28303e';roundRect(-12,-12,10,12,3);ctx.fill();roundRect(3,-12,10,12,3);ctx.fill();
 ctx.fillStyle=p.id===2?'#779acf':'#ba8858';roundRect(-15,-29,30,21,5);ctx.fill();
 ctx.fillStyle='#fff6df';ctx.beginPath();ctx.moveTo(-7,-28);ctx.lineTo(7,-28);ctx.lineTo(0,-9);ctx.closePath();ctx.fill();
 ctx.fillStyle='#bf5251';ctx.fillRect(-2,-25,4,12);
 ellipse(0,-37,12,12,'#efd1ad');
 ellipse(-10,-40,4,7,'#d8dcda');ellipse(10,-40,4,7,'#d8dcda');
 ctx.strokeStyle='#d8dcda';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-40,9,Math.PI,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#293438';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(-5,-37,4,0,Math.PI*2);ctx.moveTo(9,-37);ctx.arc(5,-37,4,0,Math.PI*2);ctx.moveTo(-1,-37);ctx.lineTo(1,-37);ctx.stroke();
 ellipse(-5,-37,1.1,1.3,'#293438');ellipse(5,-37,1.1,1.3,'#293438');
 ctx.strokeStyle='#80553d';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,-32,3,0,Math.PI);ctx.stroke();
 ctx.fillStyle='#efd1ad';roundRect(13,-29,7,8,3);ctx.fill();
 ctx.fillStyle='#fffde9';roundRect(15,-37,4,11,1);ctx.fill();
 ctx.fillStyle='#466779';roundRect(-22,-25,9,15,1);ctx.fill();ctx.fillStyle='#f2e6cb';ctx.fillRect(-20,-22,5,1);
 ctx.restore();
}
const formulas=[['E = mc²',42,66,-.05],['∫ x² dx = x³/3 + C',275,65,.025],['a² + b² = c²',660,70,-.025],['f′(x) = lim Δy/Δx',75,155,.035],['Σ 1/n² = π²/6',480,160,-.04],['eⁱπ + 1 = 0',735,230,.025],['F = ma',330,248,-.07],['sin²θ + cos²θ = 1',65,310,-.02],['P(A|B) = P(A∩B)/P(B)',480,342,.035],['∇ · E = ρ/ε₀',110,423,.025],['y = mx + b',700,440,-.035],['√−1 = i',398,423,.05]];
function hero(p){
 if(config.hero==='lecturer'){lecturer(p);return;}
 ctx.save();ctx.translate(p.x,FLOOR);
 const color=p.id===2?'#ffb7d5':'#9ce6ff';
 ellipse(0,-2,22,4,'#0005');
 if(config.hero==='astronaut'){
 ctx.fillStyle=color;roundRect(-15,-29,30,23,6);ctx.fill();roundRect(-13,-10,10,10,3);ctx.fill();roundRect(3,-10,10,10,3);ctx.fill();
 ellipse(0,-36,15,15,'#e9f4ff');ellipse(0,-37,11,9,'#234564');ellipse(-4,-40,4,2,'#8ae2f9');
 ctx.fillStyle='#feab65';ctx.fillRect(-5,-23,10,7);
 }else{
 ctx.fillStyle=p.id===2?'#c177b7':'#8478d0';ctx.beginPath();ctx.moveTo(0,-35);ctx.lineTo(-20,-3);ctx.lineTo(20,-3);ctx.closePath();ctx.fill();
 ellipse(0,-34,11,11,'#f2cbad');ctx.fillStyle='#8d7bce';ctx.beginPath();ctx.moveTo(-16,-40);ctx.lineTo(0,-63);ctx.lineTo(13,-40);ctx.closePath();ctx.fill();
 ctx.fillStyle='#ffe4a0';ctx.fillRect(17,-39,3,35);ellipse(18,-42,5,5,'#ffe4a0');ellipse(-4,-35,1.5,2,'#293438');ellipse(4,-35,1.5,2,'#293438');
 }ctx.restore();
}
function target(b){
 if(config.target==='students'){student(b);return;}
 ctx.save();ctx.translate(b.x,b.y);
 if(config.target==='aliens'){
 ellipse(0,0,b.r,b.r,'#94d8a1');ellipse(-b.r*.34,-b.r*.12,b.r*.18,b.r*.28,'#173749');ellipse(b.r*.34,-b.r*.12,b.r*.18,b.r*.28,'#173749');
 ctx.strokeStyle='#367861';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,b.r*.27,b.r*.22,0,Math.PI);ctx.stroke();
 }else{
 const g=ctx.createRadialGradient(-b.r*.3,-b.r*.3,1,0,0,b.r);g.addColorStop(0,'#f0d6ff');g.addColorStop(1,colors[b.size]);ellipse(0,0,b.r,b.r,g);
 ctx.strokeStyle='#fff9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,b.r*.76,3.5,4.8);ctx.stroke();
 ctx.fillStyle='#fff';ctx.font=`${b.r}px serif`;ctx.textAlign='center';ctx.fillText('✦',0,b.r*.33);
 }ctx.restore();
}
function draw(){
 ctx.clearRect(0,0,W,H);const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,config.background==='space'?'#0d102e':config.background==='castle'?'#322c51':'#183f35');bg.addColorStop(1,config.background==='space'?'#272057':config.background==='castle'?'#5f456b':'#0e2c25');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.textAlign='left';ctx.textBaseline='alphabetic';
 if(config.background==='classroom')for(const [text,x,y,angle] of formulas){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.font='italic 25px Georgia, serif';ctx.fillStyle='rgba(226,238,213,.20)';ctx.fillText(text,0,0);ctx.restore();}
 if(config.background==='space'){for(let i=0;i<90;i++)ellipse((i*137+41)%W,(i*71+19)%480,i%4===0?2:1,i%4===0?2:1,'#eef4ff88');ellipse(790,105,62,62,'#8d71c144');ellipse(790,105,42,42,'#ae99e055');}if(config.background==='castle'){ctx.fillStyle='#c6b8e022';for(let i=0;i<8;i++){ctx.fillRect(i*140,260,80,240);for(let j=0;j<3;j++)ctx.fillRect(i*140+j*28,240,18,25);}ellipse(765,83,33,33,'#ffefc888');}ctx.strokeStyle='#d9e6cb16';ctx.lineWidth=1;if(config.background==='classroom')for(let i=0;i<28;i++){ctx.beginPath();ctx.moveTo(20+(i*137)%910,30+(i*67)%450);ctx.lineTo(90+(i*137)%840,32+(i*67)%450);ctx.stroke();}ctx.restore();
 ctx.fillStyle='#96704a';ctx.fillRect(0,FLOOR,W,10);ctx.fillStyle='#d4ad72';ctx.fillRect(0,FLOOR,W,3);ctx.fillStyle='#202d2b';ctx.fillRect(0,FLOOR+10,W,H-FLOOR-10);
 if(config.background==='classroom'){ctx.fillStyle='#fff4d6';roundRect(70,FLOOR-5,25,5,2);ctx.fill();ctx.fillStyle='#e8aa96';roundRect(105,FLOOR-4,18,4,2);ctx.fill();ctx.fillStyle='#c09b69';roundRect(820,FLOOR-9,48,9,3);ctx.fill();}
 for(const r of ropes){
  ctx.save();ctx.strokeStyle='rgba(255,249,221,.48)';ctx.lineWidth=3;ctx.setLineDash([2,7]);ctx.beginPath();ctx.moveTo(r.x,FLOOR-player.h);ctx.lineTo(r.x,r.y+14);ctx.stroke();ctx.setLineDash([]);
  ctx.shadowColor=config.shot==='laser'?'#82eaff':'#fff5c6';ctx.shadowBlur=10;ctx.fillStyle=config.shot==='laser'?'#82eaff':'#fffbe8';if(config.shot==='magic'){ctx.font='25px serif';ctx.textAlign='center';ctx.fillText('✦',r.x,r.y+10);}else{roundRect(r.x-4,r.y-9,8,24,2);ctx.fill();}ctx.restore();
 }
 for(const b of bubbles)target(b);
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.6);ctx.fillStyle='#fff4d5';ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
 for(const p of activePlayers()){if(invincible<=0||Math.floor(invincible*10)%2===0||state==='ready')hero(p);if(config.mode==='duo'){ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillStyle=p.id===1?'#9ce6ff':'#ffb7d5';ctx.fillText('P'+p.id,p.x,FLOOR+28);}}
 if(transition>0){ctx.textAlign='center';ctx.font='bold 34px sans-serif';ctx.fillStyle='#fff2c5';ctx.fillText('שלב '+level+' הושלם!',W/2,H/2);}
}
function frame(now){const dt=Math.min((now-last)/1000,.033)||0;last=now;update(dt);draw();requestAnimationFrame(frame);}
window.addEventListener('keydown',e=>{
 if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)||$('helpDialog').open)return;
 const k=e.code;if(['ArrowLeft','ArrowRight','Space','KeyA','KeyD','KeyW'].includes(k))e.preventDefault();
 keys.add(k);if(k==='KeyP'&&!e.repeat)pause();if(k==='Enter'&&(state==='ready'||state==='over'))start();
});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{clearKeys();if(state==='playing')pause();});
for(const [id,key] of [['leftBtn','ArrowLeft'],['rightBtn','ArrowRight'],['fireBtn','Space']]){const el=$(id);if(!el)continue;el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);keys.add(key);if(key==='Space')shoot();});for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,()=>keys.delete(key));}
for(const name of Object.keys(config))$(name).addEventListener('change',readConfig);
for(const button of document.querySelectorAll('[data-preset]'))button.addEventListener('click',()=>{
 const presets={classroom:['classroom','lecturer','chalk','students'],space:['space','astronaut','laser','aliens'],castle:['castle','wizard','magic','orbs']};
 ['background','hero','shot','target'].forEach((name,i)=>$(name).value=presets[button.dataset.preset][i]);readConfig();
});
$('helpBtn').addEventListener('click',showHelp);$('introHelpBtn').addEventListener('click',showHelp);$('closeHelp').addEventListener('click',closeHelp);$('helpDialog').addEventListener('close',closeHelp);$('settingsBtn').addEventListener('click',showSetup);
$('beginBtn').addEventListener('click',start);
$('startBtn')?.addEventListener('click',()=>state==='paused'?pause():start());$('restartBtn')?.addEventListener('click',start);$('pauseBtn')?.addEventListener('click',pause);$('soundBtn')?.addEventListener('click',()=>{sound=!sound;$('soundBtn').textContent=sound?'צליל: פועל':'צליל: כבוי';$('soundBtn').setAttribute('aria-pressed',String(sound));tone();});
window.BubbleGame={start,pause,getState:()=>({state,score,level,lives,bubbles:bubbles.length,ropes:ropes.length,config:{...config},players:activePlayers().map(p=>({id:p.id,x:p.x}))}),update};
setup();invincible=0;overlay('המשחק שלכן, הסגנון שלכן','בחרו עיצוב למעלה וקראו את ההנחיות לפני שמתחילים');requestAnimationFrame(frame);
})();
