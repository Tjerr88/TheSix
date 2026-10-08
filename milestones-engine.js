/* Personal, self-reported milestones. Standards reviewed 2026-10-08.
   https://www.strongfirst.com/certifications/sfg-i-requirements/
   https://www.strongfirst.com/achieve/sinister/
   Solid, SFG+, Super SFG and Super Sinister are personal extensions. */
var Milestones = (() => {
 const lifts=['swing','clean','press','squat','snatch','getup'];
 const names={swing:'One-arm swing',clean:'Double clean',press:'Strict press',squat:'Double front squat',snatch:'Snatch',getup:'Full get-up'};
 const reps={swing:'10 / side',clean:'5 with two bells',press:'5 / side',squat:'5 with two bells',snatch:'5 / side',getup:'1 / side'};
 const ids=['sfg','sfg-plus','super-sfg','timeless-simple','timeless-solid','timeless-sinister','timed-simple','timed-solid','timed-sinister','press','super-sinister','sfg2'];
 const titles=['SFG I Skills','SFG+ Skills','Super SFG','Timeless Simple','Timeless Solid','Timeless Sinister','Timed Simple','Timed Solid','Timed Sinister','Bodyweight Press','Super Sinister','SFG II'];
 const DAY=86400000, copy=x=>JSON.parse(JSON.stringify(x));
 const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
 function profile(p){return {sex:p?.sex==='female'?'female':'male',age:Number.isInteger(p?.age)&&number(p.age,18,120)?p.age:null,bodyweight:number(p?.bodyweight,20,350)?p.bodyweight:null,pressGoal:number(p?.pressGoal,1,200)?p.pressGoal:null};}
 function profileReady(p){return !!(p.age&&p.bodyweight);}
 function standards(raw){
  const p=profile(raw),female=p.sex==='female';
  const bell=p.age>=50?(female?12:20):female?(p.bodyweight<=59?12:16):(p.bodyweight<=68?20:p.bodyweight>100?28:24);
  return {bell,snatchReps:p.age>=65?50:100,snatchSeconds:p.age>=65?180:300,pairs:female?[[24,16],[28,20],[32,24]]:[[32,32],[40,40],[48,48]],press:p.pressGoal||Math.ceil(p.bodyweight*(female?1/3:1/2)*100)/100};
 }
 // StrongFirst's published SFG II table uses pounds, including masters (50+).
 function sfg2Press(p){
  const lbs=Math.round((p.bodyweight/0.45359237)*1e6)/1e6,masters=p.age>=50;
  const table=p.sex==='female'?(masters?[[122,12],[158,16],[194,20],[Infinity,24]]:[[112,16],[126,18],[139,20],[152,22],[Infinity,24]]):(masters?[[132,20],[150,24],[168,28],[194,32],[Infinity,36]]:[[117,24],[132,28],[150,32],[168,36],[185,40],[203,44],[Infinity,48]]);
  return table.find(([limit])=>lbs<=limit)?.[1]||table.at(-1)[1];
 }
 function sfg2Skills(d){return [
  {id:'windmill',name:'Windmill',weight:d.weight,reps:3,each:true},
  {id:'bent',name:'Bent press',weight:d.weight,reps:1,oneSide:true},
  {id:'push',name:'Double push press',weight:d.weight,reps:5,double:true},
  {id:'jerk',name:'Double jerk',weight:d.weight,reps:5,double:true},
  {id:'doubleSnatch',name:'Double snatch',weight:d.doubleSnatchWeight,reps:5,double:true}
 ];}
 function sfg2SavedPress(m,d){return m.attempts.filter(a=>a.goal.kind==='press'&&a.outcome==='passed'&&a.goal.profile.sex===d.profile.sex&&number(a.result?.weight,d.pressWeight,200)&&['Left','Right'].includes(a.result?.side)).at(-1)||null;}
 function definition(id,p){
  const s=standards(p),index=ids.indexOf(id),d={id,title:titles[index],profile:profile(p)};
  if(index<0)throw Error('Unknown milestone');
  if(index<3)return {...d,kind:'snatch',weight:s.bell+index*4,reps:s.snatchReps,seconds:s.snatchSeconds,tier:index};
  if(index<9){const timed=index>=6,level=(index-3)%3;return {...d,kind:timed?'timed':'timeless',level,swing:s.pairs[level][0],getup:s.pairs[level][1],seconds:timed?960:0};}
  if(id==='sfg2')return {...d,kind:'sfg2',weight:s.bell,doubleSnatchWeight:s.bell-4,pressWeight:sfg2Press(profile(p)),seconds:0};
  if(id==='press')return {...d,kind:'press',weight:s.press,seconds:0};
  return {...d,kind:'six',weight:48,seconds:0};
 }
 function validDefinition(d){
  if(!d||!ids.includes(d.id)||!profileReady(profile(d.profile)))return false;
  const expected=definition(d.id,d.profile);
  return ['kind','weight','swing','getup','seconds','reps','level','tier','doubleSnatchWeight','pressWeight'].every(k=>d[k]===expected[k]);
 }
 function normalize(raw){
  const attempts=Array.isArray(raw?.attempts)?raw.attempts.filter(a=>a&&validDefinition(a.goal)&&number(a.startedAt,1,1e16)&&number(a.finishedAt,a.startedAt,1e16)&&number(a.elapsed,0,1e12)&&['passed','failed','aborted'].includes(a.outcome)).map(copy):[];
  const a=raw?.active;
  const active=a&&validDefinition(a.goal)&&number(a.startedAt,1,1e16)&&number(a.elapsedMs,0,1e12)?copy(a):null;
  if(active){active.elapsedMs=Math.max(0,active.elapsedMs);active.clockInvalid=active.clockInvalid===true;}
  return {version:1,profile:profile(raw?.profile),attempts,active,seen:Array.isArray(raw?.seen)?raw.seen.filter(x=>typeof x==='string').slice(-200):[]};
 }
 // Only controlled, checked standard focus sets qualify. Legacy partial get-ups do not.
 function evidence(history,id,weight,full=false){
  return (history||[]).some(h=>h.id===id&&h.passed===true&&Array.isArray(h.plan)&&Array.isArray(h.checked)&&
   (full?[1,2,3,4,5].every(i=>h.checked.includes(i)&&h.plan.some(s=>s.index===i&&number(s.weight,weight,500))):h.plan.some(s=>h.checked.includes(s.index)&&number(s.weight,weight,500))));
 }
 function sameCategory(a,b){return a.sex===b.sex;}
 function awards(m,id){return m.attempts.filter(a=>a.goal.id===id&&a.outcome==='passed');}
 function relevantAward(m,id,p){const d=definition(id,p);return m.attempts.filter(a=>a.outcome==='passed'&&(a.goal.id===id||d.kind==='timeless'&&a.goal.kind==='timeless')).some(a=>sameCategory(a.goal.profile,p)&&
  (d.kind==='snatch'?a.goal.weight>=d.weight&&a.goal.reps>=d.reps:a.goal.swing>=d.swing&&a.goal.getup>=d.getup));}
 function cooldown(m,now=Date.now()){
  const last=m.attempts.filter(a=>a.goal.kind==='snatch').reduce((n,a)=>Math.max(n,a.finishedAt),0);
  return last?Math.max(0,last+56*DAY-now):0;
 }
 function requirements(m,history,id,now=Date.now()){
  const d=definition(id,m.profile),checks=[];
  const add=(label,done)=>checks.push({label,done:!!done});
  add('Set your category, age and bodyweight',profileReady(m.profile));
  if(d.kind==='sfg2'){
   add('Earn your personal SFG I badge',awards(m,'sfg').length>0);
  }else if(d.kind==='snatch'){
   for(const lift of lifts)add(names[lift]+' · '+reps[lift]+' · '+d.weight+' kg'+(['clean','squat'].includes(lift)?' / bell':''),evidence(history,lift,d.weight));
   add('100 controlled snatches in one session · '+(d.weight+4)+' kg',evidence(history,'snatch',d.weight+4,true));
   if(d.tier)add('Earn '+titles[d.tier-1],relevantAward(m,ids[d.tier-1],m.profile));
   add('Eight weeks since your last snatch attempt',cooldown(m,now)===0);
  }else if(d.kind==='timeless'){
   add('100 one-arm swings · '+d.swing+' kg · 50 / side',evidence(history,'swing',d.swing,true));
   add('10 full get-ups · '+d.getup+' kg · 5 / side',evidence(history,'getup',d.getup,true));
  }else if(d.kind==='timed'){
   const prerequisite=ids[3+Math.min(2,d.level+1)];
   add('Earn '+titles[ids.indexOf(prerequisite)],relevantAward(m,prerequisite,m.profile));
  }else if(d.kind==='six'){
   for(const lift of lifts)add(names[lift]+' · five full focus sets · 48 kg'+(['clean','squat'].includes(lift)?' / bell':''),evidence(history,lift,48,true));
  }else if(d.kind==='press'){
   add('Log a controlled normal press set on both sides at '+Math.max(0,d.weight-4)+' kg or heavier (goal − 4 kg)',evidence(history,'press',Math.max(0,d.weight-4)));
  }
  return {goal:d,checks,available:checks.every(c=>c.done),achieved:awards(m,id).length>0};
 }
 function start(m,history,id,clock){
  if(m.active)throw Error('Finish or end your current attempt first.');
  const r=requirements(m,history,id,clock.wall);
  if(!r.available)throw Error('Complete the requirements first.');
  m.active={goal:copy(r.goal),startedAt:clock.wall,elapsedMs:0,lastWall:clock.wall,lastMono:clock.mono,clockToken:clock.token,clockInvalid:false,stopped:false,form:{},lastCue:null};
  return m.active;
 }
 // Android monotonic clock includes device sleep. Wall time is only a fallback.
 function tick(a,clock){
  if(!a||a.stopped)return;
  let delta=clock.wall-a.lastWall;
  if(clock.token&&clock.token===a.clockToken&&number(clock.mono,0,1e16)&&number(a.lastMono,0,1e16))delta=clock.mono-a.lastMono;
  else if(a.goal.seconds&&a.clockToken?.startsWith('android:'))a.clockInvalid=true; // reboot: cannot verify a timed test
  if(!Number.isFinite(delta)||delta<0){a.clockInvalid=true;delta=0;}
  a.elapsedMs+=delta;a.lastWall=clock.wall;a.lastMono=clock.mono;a.clockToken=clock.token;
 }
 function frame(a){
  const elapsed=a.elapsedMs/1000,d=a.goal;
  if(!d.seconds)return {phase:d.kind==='timeless'?'Swings + get-ups':d.kind==='press'?'Strict press':'Big Six',remaining:Math.floor(elapsed),cue:'open',done:a.stopped};
  if(elapsed>=d.seconds)return {phase:'Time complete',remaining:0,cue:'done',done:true};
  if(d.kind==='snatch')return {phase:'Snatch · '+d.weight+' kg',remaining:Math.ceil(d.seconds-elapsed),cue:'snatch-'+Math.floor(elapsed/30),done:false};
  if(elapsed<300){const i=Math.floor(elapsed/30);return {phase:'Swing '+(i+1)+' / 10 · '+(i%2?'Right':'Left')+' · 10 reps · '+d.swing+' kg',remaining:Math.ceil(30-elapsed%30),cue:'swing-'+i,done:false};}
  if(elapsed<360)return {phase:'Rest',remaining:Math.ceil(360-elapsed),cue:'rest',done:false};
  const i=Math.floor((elapsed-360)/60);return {phase:'Get-up '+(i+1)+' / 10 · '+(i%2?'Right':'Left')+' · 1 rep · '+d.getup+' kg',remaining:Math.ceil(60-(elapsed-360)%60),cue:'getup-'+i,done:false};
 }
 function stop(a){a.stopped=true;a.elapsedMs=a.goal.seconds?Math.min(a.elapsedMs,a.goal.seconds*1000):a.elapsedMs;}
 function finish(m,form,clock,aborted=false){
  const a=m.active;if(!a)throw Error('No active attempt.');
  tick(a,clock);
  if(!aborted&&!a.stopped&&a.goal.kind!=='sfg2')throw Error('Stop the clock before saving your result.');
  const d=a.goal,elapsed=a.elapsedMs/1000;let passed=false;
  const whole=(v,max)=>Number.isInteger(v)&&number(v,0,max);
  if(!aborted){
   if(d.kind==='sfg2'){
    passed=form.controlled===true;
    for(const skill of sfg2Skills(d)){
     const weight=form[skill.id+'Weight'],left=form[skill.id+'Reps'],right=form[skill.id+'Right'];
     if(!number(weight,0,500)||!whole(left,100)||(skill.each&&!whole(right,100)))throw Error('Enter the actual weight and repetitions for every SFG II skill.');
     if(skill.oneSide&&!['Left','Right'].includes(form.bentSide))throw Error('Choose your bent press side.');
     passed=passed&&weight>=skill.weight&&left>=skill.reps&&(!skill.each||right>=skill.reps);
    }
    const saved=form.useSavedPress?sfg2SavedPress(m,d):null;
    if(form.useSavedPress&&!saved)throw Error('No saved press meets this test weight.');
    if(saved){form={...form,pressWeight:saved.result.weight,pressSide:saved.result.side,pressReps:1,pressEvidence:{finishedAt:saved.finishedAt,profile:copy(saved.goal.profile)}};}
    else if(!number(form.pressWeight,0,200)||!whole(form.pressReps,10)||!['Left','Right'].includes(form.pressSide))throw Error('Enter your clean and strict press result.');
    passed=passed&&form.pressWeight>=d.pressWeight&&form.pressReps>=1;
   }else if(d.kind==='snatch'){
    if(!whole(form.reps,100))throw Error('Enter your valid reps (0–100).');
    passed=form.reps>=d.reps&&elapsed<=d.seconds&&form.controlled===true;
   }else if(d.kind==='timeless'||d.kind==='timed'){
    if(!whole(form.swingLeft,50)||!whole(form.swingRight,50)||!whole(form.getupLeft,5)||!whole(form.getupRight,5))throw Error('Enter swings (0–50) and get-ups (0–5) for each side.');
    passed=form.swingLeft===50&&form.swingRight===50&&form.getupLeft===5&&form.getupRight===5&&form.controlled===true&&(d.kind==='timeless'||elapsed===960);
   }else if(d.kind==='press'){
    if(!number(form.weight,1,200)||!['Left','Right'].includes(form.side))throw Error('Enter the actual bell weight and side.');
    passed=form.weight>=d.weight&&form.controlled===true;
   }else passed=form.controlled===true;
  }
  passed=passed&&!a.clockInvalid&&elapsed>0;
  const result={goal:copy(d),startedAt:a.startedAt,finishedAt:Math.max(a.startedAt,clock.wall),elapsed,outcome:aborted?'aborted':passed?'passed':'failed',result:copy(form),clockInvalid:a.clockInvalid===true};
  m.attempts.push(result);m.active=null;return result;
 }
 function comparison(m,a){
  if(a.goal.kind!=='snatch'||a.outcome==='aborted')return null;
  const previous=m.attempts.filter(x=>x!==a&&x.goal.kind==='snatch'&&x.outcome!=='aborted'&&x.goal.weight===a.goal.weight&&x.goal.seconds===a.goal.seconds&&x.goal.reps===a.goal.reps&&x.finishedAt<=a.finishedAt&&Number.isInteger(x.result?.reps)).at(-1);
  return previous?a.result.reps-previous.result.reps:null;
 }
 return {sfg2Press,sfg2Skills,sfg2SavedPress,ids,titles,lifts,names,reps,DAY,profile,profileReady,standards,definition,normalize,evidence,awards,cooldown,requirements,start,tick,frame,stop,finish,comparison};
})();
if(typeof module!=='undefined')module.exports=Milestones;
