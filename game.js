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
const player={x:W/2,y:FLOOR,w:28,h:44};
const radii=[14,25,40,59], colors=['#ffb84d','#63e9b7','#5ab7ff','#ba91ff'];
function tone(freq=500,duration=.07){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)(); const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=freq;g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.start();o.stop(audio.currentTime+duration);}catch(e){}}
function hud(){for(const [id,val] of Object.entries({score,level,lives,best}))if($(id))$(id).textContent=val;}
function overlay(title,text){if($('overlay'))$('overlay').hidden=false;if($('overlayTitle'))$('overlayTitle').textContent=title;if($('overlayText'))$('overlayText').textContent=text;if($('startBtn'))$('startBtn').textContent=state==='paused'?'המשך משחק ←':state==='over'?'נסו שוב ←':'מתחילים לשחק ←';}
function hide(){if($('overlay'))$('overlay').hidden=true;}
function bubble(x,y,size,vx){return {x,y,size,r:radii[size],vx,vy:-260-size*65};}
function setup(){bubbles=[];ropes=[];player.x=W/2;invincible=1.5;transition=0;const count=Math.min(2+Math.floor((level-1)/2),6);for(let i=0;i<count;i++)bubbles.push(bubble(100+i*(W-200)/Math.max(1,count-1),100+(i%2)*65,Math.min(3,1+Math.floor(level/2)),(i%2?1:-1)*(115+level*8)));hud();}
function start(){score=0;level=1;lives=3;time=0;cooldown=0;particles=[];setup();state='playing';hide();if($('pauseBtn'))$('pauseBtn').textContent='השהיה';canvas.focus();}
function pause(){if(state==='playing'){state='paused';overlay('הפסקה קטנה','לחצו על המשך או על P כדי לחזור למשחק');}else if(state==='paused'){state='playing';hide();}if($('pauseBtn'))$('pauseBtn').textContent=state==='paused'?'המשך':'השהיה';}
function burst(b){for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,s=60+Math.random()*150;particles.push({x:b.x,y:b.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.6,color:colors[b.size]});}}
function record(){if(score>best){best=score;try{localStorage.setItem('bubbleTroubleBest',String(best));}catch(e){}}hud();}
function shoot(){if(state!=='playing'||cooldown>0||transition>0)return;ropes.push({x:player.x,y:FLOOR-player.h,life:1.5});cooldown=.29;tone(780);}
function update(dt){time+=dt;particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);if(state!=='playing')return;cooldown=Math.max(0,cooldown-dt);invincible=Math.max(0,invincible-dt);if(transition>0){transition-=dt;if(transition<=0){level++;setup();}return;}
const direction=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0);player.x=Math.max(25,Math.min(W-25,player.x+direction*320*dt));if(keys.has(' '))shoot();
for(const b of bubbles){b.vy+=620*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);}if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx);}if(b.y>FLOOR-b.r){b.y=FLOOR-b.r;b.vy=-(215+b.size*72);}if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy);}}
for(const r of ropes){r.y-=650*dt;r.life-=dt;const hit=bubbles.find(b=>Math.abs(b.x-r.x)<b.r+3&&b.y+b.r>=r.y&&b.y-b.r<=FLOOR-player.h);if(hit){r.life=0;burst(hit);bubbles.splice(bubbles.indexOf(hit),1);score+=50*(4-hit.size);if(hit.size>0){const size=hit.size-1,speed=145+level*8;bubbles.push(bubble(hit.x-4,hit.y,size,-speed),bubble(hit.x+4,hit.y,size,speed));}record();tone(300+hit.size*160);}}
ropes=ropes.filter(r=>r.life>0&&r.y>-20);
if(invincible<=0&&bubbles.some(b=>{const x=Math.max(player.x-player.w/2,Math.min(b.x,player.x+player.w/2));const y=Math.max(FLOOR-player.h,Math.min(b.y,FLOOR));return (b.x-x)**2+(b.y-y)**2<b.r**2;})){lives--;invincible=2;player.x=W/2;ropes=[];hud();tone(100,.3);if(lives<=0){state='over';record();overlay('כל הכבוד!','צברתם '+score+' נקודות. נסו שוב ושברו את השיא!');}}
if(!bubbles.length&&state==='playing'){score+=level*200;record();transition=1.4;tone(1000,.2);}
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function draw(){ctx.clearRect(0,0,W,H);const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#101b32');bg.addColorStop(1,'#192a40');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
ctx.strokeStyle='rgba(122,170,215,.065)';ctx.lineWidth=1;for(let x=0;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,FLOOR);ctx.stroke();}for(let y=20;y<FLOOR;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
ctx.fillStyle='#1e3649';ctx.fillRect(0,FLOOR,W,H-FLOOR);ctx.fillStyle='#50e5bd';ctx.fillRect(0,FLOOR,W,3);ctx.fillStyle='rgba(80,229,189,.12)';ctx.fillRect(0,FLOOR+3,W,8);
for(const r of ropes){ctx.shadowColor='#7effd3';ctx.shadowBlur=14;ctx.strokeStyle='#a1ffe3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(r.x,FLOOR-5);ctx.lineTo(r.x,r.y);ctx.stroke();ctx.fillStyle='#f3fff9';ctx.beginPath();ctx.moveTo(r.x,r.y-9);ctx.lineTo(r.x-7,r.y+5);ctx.lineTo(r.x+7,r.y+5);ctx.fill();ctx.shadowBlur=0;}
for(const b of bubbles){ctx.shadowColor=colors[b.size];ctx.shadowBlur=15;const g=ctx.createRadialGradient(b.x-b.r*.3,b.y-b.r*.35,1,b.x,b.y,b.r);g.addColorStop(0,colors[b.size]);g.addColorStop(1,colors[b.size]+'55');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=colors[b.size];ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#ffffff88';ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x-b.r*.08,b.y-b.r*.08,b.r*.67,Math.PI*1.12,Math.PI*1.55);ctx.stroke();}
for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.6);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);}ctx.globalAlpha=1;
if(invincible<=0||Math.floor(invincible*10)%2===0||state==='ready'){const x=player.x,y=FLOOR;ctx.fillStyle='#080f20';ctx.beginPath();ctx.ellipse(x,y-2,25,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f8d4ad';ctx.beginPath();ctx.arc(x,y-36,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffbb54';roundRect(x-15,y-48,30,9,5);ctx.fill();ctx.fillStyle='#5cf0c5';roundRect(x-13,y-26,26,21,7);ctx.fill();ctx.fillStyle='#e6f5ff';roundRect(x-13,y-8,10,9,3);ctx.fill();roundRect(x+3,y-8,10,9,3);ctx.fill();ctx.fillStyle='#152b3e';ctx.fillRect(x-6,y-38,3,3);ctx.fillRect(x+4,y-38,3,3);}
if(transition>0){ctx.textAlign='center';ctx.font='bold 34px sans-serif';ctx.fillStyle='#b5ffe5';ctx.fillText('שלב '+level+' הושלם!',W/2,H/2);}
}
function frame(now){const dt=Math.min((now-last)/1000,.033)||0;last=now;update(dt);draw();requestAnimationFrame(frame);}
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowLeft','ArrowRight',' ','p','Enter'].includes(k))e.preventDefault();keys.add(k);if(k==='p'&&!e.repeat)pause();if(k==='Enter'&&(state==='ready'||state==='over'))start();});window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>{keys.clear();if(state==='playing')pause();});
for(const [id,key] of [['leftBtn','ArrowLeft'],['rightBtn','ArrowRight'],['fireBtn',' ']]){const el=$(id);if(!el)continue;el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);keys.add(key);if(key===' ')shoot();});for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,()=>keys.delete(key));}
$('startBtn')?.addEventListener('click',()=>state==='paused'?pause():start());$('restartBtn')?.addEventListener('click',start);$('pauseBtn')?.addEventListener('click',pause);$('soundBtn')?.addEventListener('click',()=>{sound=!sound;$('soundBtn').textContent=sound?'צליל: פועל':'צליל: כבוי';$('soundBtn').setAttribute('aria-pressed',String(sound));tone();});
window.BubbleGame={start,pause,getState:()=>({state,score,level,lives,bubbles:bubbles.length}),update};
setup();invincible=0;overlay('מוכנים לפוצץ?','זוזו עם החצים או A / D, וירו עם מקש הרווח');requestAnimationFrame(frame);
})();
