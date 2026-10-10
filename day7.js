var Day7 = (()=>{
  const ranges={pullup:[5,8],pistol:[3,6],floor:[8,12],row:[8,12]};
  const exercises=[{id:'pullup',name:'Pull-Up',side:false,body:true},{id:'row',name:'Kettlebell Row',side:true},{id:'floor',name:'Floor Press',side:true},{id:'pistol',name:'Pistol Squat',side:true,body:true},{id:'carry',name:'Suitcase Carry',side:true,timed:true}];
  exercises.sort((a,b)=>['pullup','pistol','floor','row','carry'].indexOf(a.id)-['pullup','pistol','floor','row','carry'].indexOf(b.id));
  function normalize(raw,legacy,fallback=16){
    const weight=Number.isFinite(fallback)&&fallback>=0&&fallback<=500?fallback:16;
    const s={enabled:typeof raw?.enabled==='boolean'?raw.enabled:legacy?.enabled===true,sets:[2,3].includes(raw?.sets)?raw.sets:2,reps:[3,4,5].includes(raw?.reps)?raw.reps:3,carry:[20,30,40].includes(raw?.carry)?raw.carry:20,supported:raw?.supported!==false,weights:{},pending:typeof raw?.pending==='string'&&/^\d+\.[1-5]$/.test(raw.pending)?raw.pending:null,history:Array.isArray(raw?.history)?raw.history.filter(x=>x&&typeof x.date==='string'):[]};
    for(const e of exercises){const v=raw?.weights?.[e.id];s.weights[e.id]=Number.isFinite(v)&&v>=0&&v<=500?v:e.body?0:weight;}
    s.targets={};for(const [id,[min,max]]of Object.entries(ranges)){const v=raw?.targets?.[id]??raw?.reps;s.targets[id]=Number.isInteger(v)&&v>=min&&v<=max?v:min;}
    s.legacyTargets=null;
    if(s.pending){const old=raw?.legacyTargets??(!raw?.targets?Object.fromEntries(Object.keys(ranges).map(id=>[id,s.reps])):null);if(old&&Object.keys(ranges).every(id=>Number.isInteger(old[id])&&old[id]>=1&&old[id]<=100))s.legacyTargets={...old};}
    if(!s.enabled){s.pending=null;s.legacyTargets=null;}
    return s;
  }
  return {exercises,ranges,normalize};
})();
function day7Active(){return !!(state.day7?.enabled&&state.day7.pending);}
function day7Completion(){const total=Day7.exercises.length*state.day7.sets,done=Day7.exercises.reduce((n,e)=>n+Array.from({length:state.day7.sets},(_,i)=>Number(getCount('day7-'+e.id,'set'+(i+1))>0)).reduce((a,b)=>a+b,0),0);return {total,done,complete:done===total};}
function renderDay7Workout(){
  const d=state.day7,targets=d.legacyTargets??d.targets;
  return '<section class="panel workout-card"><p class="eyebrow">Optional · Day 7</p><h2>Accessory circuit</h2><p class="small-copy">Controlled effort · 2–3 reps in reserve · Never compromise tomorrow’s Six.</p><p class="small-copy">Complete each round in order. Both sides where shown. Rest as needed.</p>'+(d.legacyTargets?'<p class="small-copy">This session keeps its saved reps. New targets apply next cycle.</p>':'')+'</section>'+Array.from({length:d.sets},(_,i)=>'<article class="panel workout-card day7-round" data-round="'+(i+1)+'"><h3>Round '+(i+1)+'</h3>'+Day7.exercises.map(e=>{
    const name=e.id==='pistol'&&d.supported?'Supported Pistol Squat':e.name,load=d.weights[e.id],target=e.timed?d.carry+' sec / side':targets[e.id]+' reps'+(e.side?' / side':'');
    return '<label class="check-row"><span><span class="check-name">'+name+'</span><span class="check-sub">'+target+' · '+(e.body?(load?'Bodyweight + '+load+' kg':'Bodyweight'):load+' kg')+'</span></span><input aria-label="Round '+(i+1)+' '+name+' complete" type="checkbox" data-action="day7-set" data-exercise-id="day7-'+e.id+'" data-set-index="'+(i+1)+'" '+(getCount('day7-'+e.id,'set'+(i+1))?'checked':'')+'></label>';
  }).join('')+'<button class="rest-button" type="button" data-day7-rest data-exercise-id="day7-carry" data-set-index="'+(i+1)+'">Rest 2:00</button></article>').join('');
}
function renderDay7Progress(){const c=day7Completion();els.completedBtn.disabled=!c.complete;els.completedBtn.textContent='Finish Day 7';els.completedBtn.title='Save accessory practice';els.repeatBtn.disabled=true;els.resetCountersBtn.disabled=true;els.undoBtn.disabled=!state.undo;els.actionNote.textContent=c.done+' / '+c.total+' stations checked. Skipping leaves your Big Six progress intact.';}
function finishDay7(skipped){
  if(!day7Active()||(!skipped&&!day7Completion().complete))return false;
  rememberUndo(skipped?'skip Day 7':'complete Day 7');
  state.day7.history.push({date:getLocalDateKey(),cycle:state.day7.pending,skipped,format:'circuit',order:Day7.exercises.map(e=>e.id),sets:state.day7.sets,targets:clone(state.day7.legacyTargets??state.day7.targets),carry:state.day7.carry,supported:state.day7.supported,weights:clone(state.day7.weights),counters:clone(ensureCounterBucket())});
  if(!skipped){state.lastTrainingDate=getLocalDateKey();markDoneToday();}
  state.day7.pending=null;state.day7.legacyTargets=null;clearRestTimerSilently();saveState();render();toast(skipped?'Day 7 skipped. Your next Big Six session is ready.':'Day 7 saved.');return true;
}
function renderDay7Settings(){
  const d=state.day7;document.getElementById('day7Toggle').checked=d.enabled;document.getElementById('day7Options').hidden=!d.enabled;
  for(const [id,key]of [['day7Sets','sets'],['day7Carry','carry']])document.getElementById(id).value=d[key];
  document.getElementById('day7Supported').checked=d.supported;
  document.getElementById('day7Weights').innerHTML='<table class="weight-table"><thead><tr><th>Exercise</th><th>Reps</th><th>Kg</th></tr></thead><tbody>'+Day7.exercises.map(e=>'<tr><th>'+e.name+(e.body?' <small>(added kg)</small>':'')+'</th><td>'+(e.timed?'Timed':'<select aria-label="'+e.name+' reps" data-day7-reps="'+e.id+'">'+Array.from({length:Day7.ranges[e.id][1]-Day7.ranges[e.id][0]+1},(_,i)=>Day7.ranges[e.id][0]+i).map(n=>'<option '+(d.targets[e.id]===n?'selected':'')+'>'+n+'</option>').join('')+'</select>')+'</td><td><input type="number" min="0" max="500" step="0.5" aria-label="'+e.name+' weight" data-day7-weight="'+e.id+'" value="'+d.weights[e.id]+'"></td></tr>').join('')+'</tbody></table>';

}
function setupDay7UI(){
  const skip=document.createElement('button');skip.id='skipDay7Btn';skip.className='secondary';skip.textContent='Skip Day 7';skip.type='button';skip.hidden=true;els.completedBtn.after(skip);skip.addEventListener('click',()=>finishDay7(true));
  document.getElementById('day7Panel').addEventListener('change',event=>{
    const t=event.target;
    if(day7Active()&&day7Completion().done>0&&!confirm('Changing Day 7 settings clears this session’s checked sets. Continue?')){renderDay7Settings();return;}
    const id=t.dataset.day7Weight,key=({day7Sets:'sets',day7Carry:'carry'})[t.id];
    const value=Number(t.value),repId=t.dataset.day7Reps;
    if(repId&&(!Day7.ranges[repId]||!Number.isInteger(value)||value<Day7.ranges[repId][0]||value>Day7.ranges[repId][1])){renderDay7Settings();return;}
    if(id&&(!t.value.trim()||!Number.isFinite(value)||value<0||value>500)){renderDay7Settings();return;}
    rememberUndo('Day 7 settings');
    state.day7.legacyTargets=null;
    if(day7Active())state.counters[getSessionKey()]={};
    if(t.id==='day7Toggle'){if(!t.checked&&day7Active())state.day7.history.push({date:getLocalDateKey(),cycle:state.day7.pending,skipped:true});state.day7.enabled=t.checked;if(!t.checked)state.day7.pending=null;}
    else if(t.id==='day7Supported')state.day7.supported=t.checked;
    else if(repId)state.day7.targets[repId]=value;
    else if(id)state.day7.weights[id]=value;
    else if(key)state.day7[key]=value;
    clearRestTimerSilently();saveState();render();
  });
}
function setupFlatSettings(){
  const panel=document.getElementById('settingsPanel'),tp=document.getElementById('tpPanel'),day=document.getElementById('day7Panel');
  const other=[...panel.children].filter(x=>x!==tp&&x!==day);
  const app=document.createElement('section');app.className='panel actions';app.id='appSettings';app.innerHTML='<h2>App</h2>';
  for(const section of other){
    if(section.matches('details')){section.removeAttribute('open');continue;}
    section.querySelector(':scope > .eyebrow')?.remove();
    const heading=section.querySelector('h2');if(heading){const h=document.createElement('h3');h.textContent=heading.textContent;heading.replaceWith(h);}
    app.append(section);
  }
  panel.prepend(day);panel.prepend(tp);panel.append(app);
  const warmup=other.find(x=>x.matches('details'));if(warmup)document.querySelector('#trainPanel > .lesson').after(warmup);
  const rest=document.getElementById('restPresetGroup').closest('.setting-row');rest.hidden=true;
}
