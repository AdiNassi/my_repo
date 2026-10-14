(() => {
'use strict';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W=960,H=560,FLOOR=500;
canvas.width=W; canvas.height=H;
const $=id=>document.getElementById(id);
const keys=new Set();
let bubbles=[],ropes=[],particles=[],state='ready',score=0,level=1,lives=3,time=0,cooldown=0,invincible=0,transition=0,last=0,sound=false,audio;
let drops=[],slowTime=0,doubleTime=0,popCount=0,studentSerial=0;
let best=0; try {best=Number(localStorage.getItem('bubbleTroubleBest'))||0;}catch(e){}
const player={x:W/2,y:FLOOR,w:40,h:104,cooldown:0,id:1};
const player2={x:W*.7,y:FLOOR,w:40,h:104,cooldown:0,id:2};
const config={mode:'solo',background:'classroom',hero:'lecturer',shot:'chalk',target:'students'};
const activePlayers=()=>config.mode==='duo'?[player,player2]:[player];
let helpPrevious='ready';
function clearKeys(){keys.clear();}
function readConfig(){for(const name of Object.keys(config))config[name]=$(name).value;setup();}
function showSetup(){clearKeys();state='ready';$('setupPanel').hidden=false;setup();overlay('בוחרים ויוצאים לדרך','בחרו עיצוב ומצב משחק למעלה. אפשר לערבב בין כל הסטים.');$('setupPanel').scrollIntoView({behavior:'smooth',block:'start'});}
function showHelp(){if($('helpDialog').open)return;helpPrevious=state;clearKeys();if(state==='playing')state='help';$('helpDialog').showModal();}
function closeHelp(){if($('helpDialog').open)$('helpDialog').close();if(state==='help')state=helpPrevious;clearKeys();if(state==='playing'||state==='paused')canvas.focus();}

const radii=[22,35,52,72], colors=['#ffb84d','#63e9b7','#5ab7ff','#ba91ff'];
function tone(freq=500,duration=.07){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)(); const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=freq;g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.start();o.stop(audio.currentTime+duration);}catch(e){}}
function hud(){for(const [id,val] of Object.entries({score,level,lives,best}))if($(id))$(id).textContent=val;effectHud();}
function effectHud(){const el=$('effects');if(el){el.textContent=[slowTime>0?'⏳ '+Math.ceil(slowTime)+'s':'',doubleTime>0?'⚡ '+Math.ceil(doubleTime)+'s':''].filter(Boolean).join('  ');el.hidden=slowTime<=0&&doubleTime<=0;}}
function dropBonus(b){popCount++;if(popCount%3===0)drops.push({x:b.x,y:b.y,type:Math.floor(popCount/3)%2===1?'slow':'double',life:12});}
function collectBonus(d){if(d.type==='slow')slowTime=8;else doubleTime=8;tone(d.type==='slow'?440:1100,.18);effectHud();}
function overlay(title,text){if($('overlay'))$('overlay').hidden=false;if($('overlayTitle'))$('overlayTitle').textContent=title;if($('overlayText'))$('overlayText').textContent=text;if($('startBtn'))$('startBtn').textContent=state==='paused'?'▶️':state==='over'?'🔄':'▶️';}
function hide(){if($('overlay'))$('overlay').hidden=true;canvas.focus();}
function bubble(x,y,size,vx){return {x,y,size,r:radii[size],vx,vy:-260-size*65,variant:studentSerial++%6};}
function setup(){bubbles=[];ropes=[];drops=[];slowTime=0;doubleTime=0;player.x=config.mode==='duo'?W*.3:W/2;player2.x=W*.7;activePlayers().forEach(p=>p.cooldown=0);invincible=1.5;transition=0;const count=Math.min(2+Math.floor((level-1)/2),6);for(let i=0;i<count;i++)bubbles.push(bubble(100+i*(W-200)/Math.max(1,count-1),100+(i%2)*65,Math.min(3,1+Math.floor(level/2)),(i%2?1:-1)*(115+level*8)));hud();}
function start(){popCount=0;studentSerial=0;score=0;level=1;lives=3;time=0;cooldown=0;particles=[];clearKeys();setup();state='playing';$('setupPanel').hidden=true;hide();if($('pauseBtn'))$('pauseBtn').textContent='⏸️';canvas.focus();canvas.scrollIntoView({behavior:'smooth',block:'center'});}
function pause(){clearKeys();if(state==='playing'){state='paused';overlay('הפסקה קטנה','לחצו על ▶️ או על P כדי לחזור למשחק');}else if(state==='paused'){state='playing';hide();}if($('pauseBtn'))$('pauseBtn').textContent=state==='paused'?'▶️':'⏸️';}
function burst(b){for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,s=60+Math.random()*150;particles.push({x:b.x,y:b.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.6,color:colors[b.size]});}}
function record(){if(score>best){best=score;try{localStorage.setItem('bubbleTroubleBest',String(best));}catch(e){}}hud();}
function shoot(p=player){if(state!=='playing'||p.cooldown>0||transition>0)return;for(const offset of doubleTime>0?[-13,13]:[0])ropes.push({x:p.x+offset,y:FLOOR-p.h,life:1.5,owner:p.id});p.cooldown=.29;tone(p.id===1?780:920);}
function update(dt){time+=dt;particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);if(state!=='playing')return;slowTime=Math.max(0,slowTime-dt);doubleTime=Math.max(0,doubleTime-dt);effectHud();
for(const d of drops){d.y=Math.min(FLOOR-17,d.y+150*dt);d.life-=dt;if(activePlayers().some(p=>Math.abs(p.x-d.x)<p.w/2+17&&d.y+17>=FLOOR-p.h&&d.y-17<=FLOOR)){collectBonus(d);d.life=0;}}drops=drops.filter(d=>d.life>0);
activePlayers().forEach(p=>p.cooldown=Math.max(0,p.cooldown-dt));invincible=Math.max(0,invincible-dt);if(transition>0){transition-=dt;if(transition<=0){level++;setup();}return;}
for(const p of activePlayers()){
 const first=p.id===1;
 const left=first?(keys.has('ArrowLeft')||(config.mode==='solo'&&keys.has('KeyA'))):keys.has('KeyA');
 const right=first?(keys.has('ArrowRight')||(config.mode==='solo'&&keys.has('KeyD'))):keys.has('KeyD');
 p.x=Math.max(35,Math.min(W-35,p.x+((right?1:0)-(left?1:0))*320*dt));
 if(keys.has(first?'Space':'KeyW'))shoot(p);
}
const bubbleDt=dt*(slowTime>0?.45:1);for(const b of bubbles){b.vy+=620*bubbleDt;b.x+=b.vx*bubbleDt;b.y+=b.vy*bubbleDt;if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);}if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx);}if(b.y>FLOOR-b.r){b.y=FLOOR-b.r;b.vy=-(215+b.size*72);}if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy);}}
for(const r of ropes){r.y-=650*dt;r.life-=dt;const hit=bubbles.find(b=>Math.abs(b.x-r.x)<b.r+3&&b.y+b.r>=r.y&&b.y-b.r<=FLOOR-player.h);if(hit){r.life=0;burst(hit);dropBonus(hit);bubbles.splice(bubbles.indexOf(hit),1);score+=50*(4-hit.size);if(hit.size>0){const size=hit.size-1,speed=145+level*8;bubbles.push(bubble(hit.x-4,hit.y,size,-speed),bubble(hit.x+4,hit.y,size,speed));}record();tone(300+hit.size*160);}}
ropes=ropes.filter(r=>r.life>0&&r.y>-20);
if(invincible<=0&&activePlayers().some(p=>bubbles.some(b=>{const x=Math.max(p.x-p.w/2,Math.min(b.x,p.x+p.w/2));const y=Math.max(FLOOR-p.h,Math.min(b.y,FLOOR));return (b.x-x)**2+(b.y-y)**2<b.r**2;}))){lives--;invincible=2;ropes=[];hud();tone(100,.3);if(lives<=0){state='over';record();overlay('הסיבוב הסתיים','צברתם '+score+' נקודות. נסו שוב ושברו את השיא!');}}
if(!bubbles.length&&state==='playing'){score+=level*200;record();transition=1.4;tone(1000,.2);}
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
const formulas=[['E = mc²',42,66,-.05],['∫ x² dx = x³/3 + C',275,65,.025],['a² + b² = c²',660,70,-.025],['f′(x) = lim Δy/Δx',75,155,.035],['Σ 1/n² = π²/6',480,160,-.04],['eⁱπ + 1 = 0',735,230,.025],['F = ma',330,248,-.07],['sin²θ + cos²θ = 1',65,310,-.02],['P(A|B) = P(A∩B)/P(B)',480,342,.035],['∇ · E = ρ/ε₀',110,423,.025],['y = mx + b',700,440,-.035],['√−1 = i',398,423,.05]];
function material(x,y,r,light,mid,dark){const g=ctx.createRadialGradient(x-r*.35,y-r*.45,r*.04,x,y,r);g.addColorStop(0,light);g.addColorStop(.55,mid);g.addColorStop(1,dark);return g;}
function face(x,y,r,variant=0,glasses=false){
 const skin=[['#ffe3c6','#e5ae86','#995f49'],['#edc29a','#b87f58','#704730'],['#ffead9','#edc1a2','#ae7d67'],['#e2b391','#c18c67','#80533d']][variant%4];
 ellipse(x-r*.88,y+r*.04,r*.17,r*.26,material(x-r*.88,y,r*.3,...skin));ellipse(x+r*.88,y+r*.04,r*.17,r*.26,skin[2]);
 ctx.shadowColor='#0005';ctx.shadowBlur=r*.18;ctx.shadowOffsetY=r*.08;ellipse(x,y,r*.91,r,material(x,y,r,...skin));ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 const hair=[['#c5a269','#846039','#3e2b22'],['#79645b','#392c29','#191319'],['#e6c486','#b08042','#70502e'],['#524641','#211e24','#0d1018'],['#cf865d','#884b2b','#4c2b20'],['#ad8872','#684d3e','#30251d']][variant%6];
 ctx.fillStyle=material(x,y-r*.6,r,...hair);ctx.beginPath();ctx.moveTo(x-r*.92,y);ctx.bezierCurveTo(x-r*1.05,y-r*1.2,x+r*.5,y-r*1.33,x+r*.92,y-r*.35);ctx.lineTo(x+r*.78,y+r*.12);ctx.lineTo(x+r*.66,y-r*.48);ctx.quadraticCurveTo(x+r*.2,y-r*.23,x-r*.28,y-r*.57);ctx.quadraticCurveTo(x-r*.65,y-r*.2,x-r*.92,y);ctx.fill();
 ctx.strokeStyle=hair[0];ctx.lineWidth=r*.045;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(x-r*.65+i*r*.23,y-r*.69);ctx.quadraticCurveTo(x-r*.45+i*r*.21,y-r*.9,x-r*.22+i*r*.19,y-r*.74);ctx.stroke();}
 for(const side of [-1,1]){const ex=x+side*r*.32;ellipse(ex,y-r*.02,r*.19,r*.115,'#fff5e8');ellipse(ex+ r*.025,y-r*.02,r*.082,r*.105,'#4b625d');ellipse(ex+r*.028,y-r*.02,r*.042,r*.085,'#182421');ellipse(ex,y-r*.06,r*.026,r*.03,'white');ctx.strokeStyle='#584237';ctx.lineWidth=r*.055;ctx.beginPath();ctx.moveTo(ex-r*.17,y-r*.19);ctx.quadraticCurveTo(ex,y-r*.25,ex+r*.16,y-r*.19);ctx.stroke();}
 ellipse(x+r*.04,y+r*.21,r*.12,r*.1,skin[1]);ctx.strokeStyle=skin[2];ctx.lineWidth=r*.035;ctx.beginPath();ctx.moveTo(x+r*.14,y+r*.18);ctx.quadraticCurveTo(x+r*.2,y+r*.3,x-r*.03,y+r*.29);ctx.stroke();
 ctx.strokeStyle='#99564f';ctx.lineWidth=r*.045;ctx.beginPath();ctx.moveTo(x-r*.23,y+r*.45);ctx.quadraticCurveTo(x,y+r*.56,x+r*.23,y+r*.42);ctx.stroke();ellipse(x-r*.06,y+r*.63,r*.18,r*.04,'#ffe0bb66');
 if(glasses){ctx.strokeStyle='#233244';ctx.lineWidth=r*.075;for(const side of [-1,1]){roundRect(x+side*r*.32-r*.25,y-r*.17,r*.5,r*.33,r*.1);ctx.stroke();}ctx.beginPath();ctx.moveTo(x-r*.08,y-r*.06);ctx.lineTo(x+r*.08,y-r*.06);ctx.stroke();}
}
function student(b){ctx.save();const r=b.r,v=b.variant;
if(v===2||v===4){ellipse(b.x-r*.68,b.y+r*.2,r*.28,r*.75,material(b.x,b.y,r,'#b27850','#643e2d','#2c211d'));ellipse(b.x+r*.68,b.y+r*.2,r*.28,r*.75,'#563828');}
face(b.x,b.y,r*.94,v,v===0||v===3);
if(v===2){ctx.strokeStyle='#e6c486';ctx.lineWidth=r*.12;ctx.beginPath();ctx.moveTo(b.x-r*.5,b.y-r*.57);ctx.quadraticCurveTo(b.x+r*.2,b.y-r*.35,b.x+r*.7,b.y-r*.6);ctx.stroke();}
if(v===5){ctx.fillStyle=material(b.x,b.y-r*.7,r,'#ef9395','#bd4e57','#6c2435');ctx.beginPath();ctx.arc(b.x,b.y-r*.1,r*.9,Math.PI,Math.PI*2);ctx.fill();ellipse(b.x+r*.3,b.y-r*.15,r*.85,r*.13,'#a7444a');}
if(v===1){ctx.strokeStyle='#384b67';ctx.lineWidth=r*.12;ctx.beginPath();ctx.arc(b.x,b.y,r*.93,Math.PI,Math.PI*2);ctx.stroke();for(const side of [-1,1])ellipse(b.x+side*r*.9,b.y+r*.03,r*.14,r*.26,material(b.x+side*r*.9,b.y,r*.3,'#b2cbea','#516c96','#233553'));}ctx.restore();}
function hero(p){
 ctx.save();ctx.translate(p.x,FLOOR);const walk=state==='playing'&&((p.id===1&&(keys.has('ArrowLeft')||keys.has('ArrowRight')))||(keys.has('KeyA')||keys.has('KeyD')))?Math.sin(time*15)*3:0;
 ellipse(0,2,29,6,'#0006');
 const suit=p.id===2?['#efaad5','#bb6f9a','#573656']:config.hero==='lecturer'?['#c6d5eb','#6985ab','#2b3c58']:config.hero==='astronaut'?['#fcffff','#b5cfdf','#4a687d']:['#bdaceb','#7867ad','#3d305f'];
 for(const side of [-1,1]){const dx=side*9;ctx.fillStyle=material(dx,-14,21,'#657589','#354054','#182032');roundRect(dx-7,-27+side*walk,14,26,5);ctx.fill();ellipse(dx+2,-3+side*walk,10,5,material(dx,-4,13,'#5a5c66','#292b34','#12161f'));}
 ctx.fillStyle=material(-1,-48,34,...suit);roundRect(-21,-67,42,43,12);ctx.fill();
 ctx.strokeStyle=suit[2];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-55);ctx.lineTo(0,-27);ctx.stroke();
 for(const side of [-1,1]){ctx.save();ctx.translate(side*24,-51);ctx.rotate(side*.18);ctx.fillStyle=material(0,0,20,...suit);roundRect(-7,-12,14,31,6);ctx.fill();ellipse(0,22,6,7,material(0,22,8,'#ffe5c7','#e7b68c','#9e7052'));ctx.restore();}
 if(config.hero==='lecturer'){ctx.fillStyle='#fff7ea';ctx.beginPath();ctx.moveTo(-9,-67);ctx.lineTo(9,-67);ctx.lineTo(0,-40);ctx.closePath();ctx.fill();ctx.fillStyle='#a74145';ctx.beginPath();ctx.moveTo(0,-64);ctx.lineTo(-4,-48);ctx.lineTo(0,-42);ctx.lineTo(4,-48);ctx.closePath();ctx.fill();ctx.fillStyle=material(-27,-32,16,'#87b5b0','#37666a','#183b47');roundRect(-35,-46,17,25,3);ctx.fill();ctx.fillStyle='#eee7d3';ctx.fillRect(-32,-42,11,2);}
 face(0,-83,21,config.hero==='lecturer'?0:2,config.hero==='lecturer');
 if(config.hero==='astronaut'){ctx.strokeStyle='#e9f7ff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,-84,25,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#acdcff22';ctx.beginPath();ctx.arc(0,-84,24,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff9';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-1,-85,20,3.7,4.7);ctx.stroke();ctx.fillStyle='#eea760';roundRect(-10,-53,20,12,3);ctx.fill();}
 if(config.hero==='wizard'){ctx.fillStyle=material(0,-109,32,'#c1aae8','#7762ac','#3c2b68');ctx.beginPath();ctx.moveTo(-26,-96);ctx.quadraticCurveTo(-15,-115,0,-140);ctx.quadraticCurveTo(18,-123,22,-96);ctx.closePath();ctx.fill();ellipse(0,-98,29,5,suit[1]);ctx.fillStyle='#ffe8a4';ctx.font='15px serif';ctx.textAlign='center';ctx.fillText('✦',0,-111);ctx.fillStyle='#8b6246';roundRect(30,-84,5,77,2);ctx.fill();ellipse(32,-87,8,10,material(32,-87,11,'#fffbd5','#f4d18d','#b98842'));}
 if(config.hero==='lecturer'){ctx.fillStyle='#fffce8';roundRect(24,-31,6,20,2);ctx.fill();}
 ctx.restore();
}
function target(b){
 if(config.target==='students'){student(b);return;}
 ctx.save();ctx.shadowColor='#0004';ctx.shadowBlur=10;ctx.shadowOffsetY=4;
 const palette=config.target==='aliens'?['#d3ffbb','#79b789','#285643']:['#fff1ff',colors[b.size],'#3d225e'];ellipse(b.x,b.y,b.r,b.r,material(b.x,b.y,b.r,...palette));ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 if(config.target==='aliens'){for(const side of [-1,1]){ellipse(b.x+side*b.r*.32,b.y-b.r*.06,b.r*.18,b.r*.29,material(b.x,b.y,b.r,'#597c85','#203b49','#0b1824'));ellipse(b.x+side*b.r*.35,b.y-b.r*.19,b.r*.04,b.r*.07,'#fff9');}ctx.strokeStyle='#345c43';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y+b.r*.3,b.r*.19,0,Math.PI);ctx.stroke();}else{ctx.fillStyle='#fff';ctx.font=`${b.r}px serif`;ctx.textAlign='center';ctx.fillText('✦',b.x,b.y+b.r*.33);}
 ctx.restore();
}
function draw(){
 ctx.clearRect(0,0,W,H);const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,config.background==='space'?'#0d102e':config.background==='castle'?'#322c51':'#183f35');bg.addColorStop(1,config.background==='space'?'#272057':config.background==='castle'?'#5f456b':'#0e2c25');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 const light=ctx.createRadialGradient(350,90,30,450,190,600);light.addColorStop(0,'#ffffff13');light.addColorStop(1,'#00000044');ctx.fillStyle=light;ctx.fillRect(0,0,W,FLOOR);ctx.save();ctx.textAlign='left';ctx.textBaseline='alphabetic';
 if(config.background==='classroom')for(const [text,x,y,angle] of formulas){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.font='italic 25px Georgia, serif';ctx.fillStyle='rgba(226,238,213,.32)';ctx.fillText(text,0,0);ctx.restore();}
 if(config.background==='space'){for(let i=0;i<90;i++)ellipse((i*137+41)%W,(i*71+19)%480,i%4===0?2:1,i%4===0?2:1,'#eef4ff88');ellipse(790,105,62,62,'#8d71c144');ellipse(790,105,42,42,'#ae99e055');}if(config.background==='castle'){ctx.fillStyle='#c6b8e022';for(let i=0;i<8;i++){ctx.fillRect(i*140,260,80,240);for(let j=0;j<3;j++)ctx.fillRect(i*140+j*28,240,18,25);}ellipse(765,83,33,33,'#ffefc888');}ctx.strokeStyle='#d9e6cb16';ctx.lineWidth=1;if(config.background==='classroom')for(let i=0;i<28;i++){ctx.beginPath();ctx.moveTo(20+(i*137)%910,30+(i*67)%450);ctx.lineTo(90+(i*137)%840,32+(i*67)%450);ctx.stroke();}ctx.restore();
 ctx.fillStyle='#96704a';ctx.fillRect(0,FLOOR,W,10);ctx.fillStyle='#d4ad72';ctx.fillRect(0,FLOOR,W,3);ctx.fillStyle='#202d2b';ctx.fillRect(0,FLOOR+10,W,H-FLOOR-10);const floorLight=ctx.createLinearGradient(0,FLOOR,0,H);floorLight.addColorStop(0,'#c4b08b66');floorLight.addColorStop(1,'#101a2f');ctx.fillStyle=floorLight;ctx.fillRect(0,FLOOR+10,W,H-FLOOR-10);ctx.strokeStyle='#ffffff16';for(let x=-W;x<W*2;x+=120){ctx.beginPath();ctx.moveTo(W/2+(x-W/2)*.85,FLOOR+10);ctx.lineTo(x,H);ctx.stroke();}
 if(config.background==='classroom'){ctx.fillStyle='#fff4d6';roundRect(70,FLOOR-5,25,5,2);ctx.fill();ctx.fillStyle='#e8aa96';roundRect(105,FLOOR-4,18,4,2);ctx.fill();ctx.fillStyle='#c09b69';roundRect(820,FLOOR-9,48,9,3);ctx.fill();}
 for(const r of ropes){
  ctx.save();ctx.strokeStyle='rgba(255,249,221,.48)';ctx.lineWidth=3;ctx.setLineDash([2,7]);ctx.beginPath();ctx.moveTo(r.x,FLOOR-player.h);ctx.lineTo(r.x,r.y+14);ctx.stroke();ctx.setLineDash([]);
  ctx.shadowColor=config.shot==='laser'?'#82eaff':'#fff5c6';ctx.shadowBlur=14;ctx.fillStyle=config.shot==='laser'?'#82eaff':'#fffbe8';if(config.shot==='magic'){ctx.font='25px serif';ctx.textAlign='center';ctx.fillText('✦',r.x,r.y+10);}else{roundRect(r.x-5,r.y-12,10,30,3);ctx.fill();}ctx.restore();
 }
 for(const b of bubbles)target(b);
for(const d of drops){ctx.save();ctx.shadowColor=d.type==='slow'?'#8de6ff':'#ffe27d';ctx.shadowBlur=18;ctx.fillStyle=material(d.x,d.y,25,'#fff2a1','#dca740','#754424');roundRect(d.x-20,d.y-20,40,40,10);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff3bf';ctx.lineWidth=2;ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='26px Arial';ctx.fillText(d.type==='slow'?'⏳':'⚡',d.x,d.y+1);ctx.restore();}
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.6);ctx.fillStyle='#fff4d5';ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
 for(const p of activePlayers()){if(invincible<=0||Math.floor(invincible*10)%2===0||state==='ready')hero(p);if(config.mode==='duo'){ctx.textAlign='center';ctx.font='bold 18px sans-serif';ctx.fillStyle=p.id===1?'#9ce6ff':'#ffb7d5';ctx.fillText('P'+p.id,p.x,FLOOR+28);}}
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
$('startBtn')?.addEventListener('click',()=>state==='paused'?pause():start());$('restartBtn')?.addEventListener('click',start);$('pauseBtn')?.addEventListener('click',pause);$('soundBtn')?.addEventListener('click',()=>{sound=!sound;$('soundBtn').textContent=sound?'🔊':'🔇';$('soundBtn').setAttribute('aria-pressed',String(sound));tone();});
window.BubbleGame={start,pause,getState:()=>({state,score,level,lives,bubbles:bubbles.length,ropes:ropes.length,drops:drops.length,effects:{slow:slowTime,double:doubleTime},config:{...config},players:activePlayers().map(p=>({id:p.id,x:p.x}))}),update};
setup();invincible=0;overlay('המשחק שלכן, הסגנון שלכן','בחרו עיצוב למעלה וקראו את ההנחיות לפני שמתחילים');requestAnimationFrame(frame);
})();
