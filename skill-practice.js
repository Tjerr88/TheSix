/* Optional technical practice. No dependency on Big Six progress or badge awards. */
var SkillPractice=(()=>{
 const skills=[
  {id:'windmill',name:'Windmill',dose:'1 × 5 / side',double:false},
  {id:'bent',name:'Bent press',dose:'1 × 1–3 / side',double:false},
  {id:'push',name:'Double push press',dose:'1 × 5',double:true},
  {id:'jerk',name:'Double jerk',dose:'1 × 3–5',double:true},
  {id:'snatch',name:'Double snatch',dose:'1 × 3–5',double:true}
 ];
 const positive=x=>Number.isFinite(x)&&x>0&&x<=500;
 function normalize(raw){
  const s={enabled:raw?.enabled===true,position:Number.isInteger(raw?.position)&&raw.position>=0?raw.position%5:0,bells:Array.isArray(raw?.bells)?raw.bells.filter(positive).sort((a,b)=>a-b):[],lower:{},decision:null,history:Array.isArray(raw?.history)?raw.history.filter(x=>x&&skills.some(s=>s.id===x.id)&&['complete','skip'].includes(x.outcome)):[]};
  for(const skill of skills)if(positive(raw?.lower?.[skill.id]))s.lower[skill.id]=raw.lower[skill.id];
  if(raw?.decision&&skills.some(x=>x.id===raw.decision.id)&&['complete','skip'].includes(raw.decision.outcome))s.decision={...raw.decision};
  return s;
 }
 function available(s,skill,workBell){
  const counts=new Map();s.bells.forEach(w=>counts.set(w,(counts.get(w)||0)+1));
  const cap=workBell-8;
  return [...counts].filter(([w,n])=>w<=cap&&n>=(skill.double?2:1)).map(([w])=>w).sort((a,b)=>b-a);
 }
 function plan(s,workBell){
  const skill=s.decision?skills.find(x=>x.id===s.decision.id):skills[s.position];
  const options=available(s,skill,workBell),cap=Math.min(workBell-8,s.lower[skill.id]||Infinity);
  return {skill,target:workBell-8,workBell,options,weight:s.decision?s.decision.weight:(options.find(w=>w<=cap)??null),decision:s.decision};
 }
 function act(s,workBell,outcome,meta={}){
  if(s.decision)return false;
  const p=plan(s,workBell);
  if(!['complete','skip'].includes(outcome)||outcome==='complete'&&p.weight===null)return false;
  const entry={...meta,id:p.skill.id,outcome,workBell,target:p.target,weight:p.weight,double:p.skill.double,dose:p.skill.dose};
  s.decision=entry;s.history.push(entry);if(outcome==='complete')s.position=(s.position+1)%5;return true;
 }
 function close(s){s.decision=null;}
 return {skills,normalize,available,plan,act,close};
})();
if(typeof module!=='undefined')module.exports=SkillPractice;

function skillUnlocked(){return Milestones.awards(state.milestones,'sfg').length>0;}
function skillPracticeActive(){return skillUnlocked()&&state.skillPractice.enabled&&!state.standard.setupRequired&&!day7Active()&&!isSkippingProgressToday();}
function renderSkillPractice(){
 if(!skillPracticeActive())return '';
 const p=SkillPractice.plan(state.skillPractice,state.standard.base),d=p.decision;
 return '<article class="panel skill-practice" id="skillPracticeCard"><p class="eyebrow">SFG II · Skill Practice</p><h3>'+p.skill.name+'</h3><p>'+p.skill.dose+'</p><p class="small-copy">'+(p.weight!==null?(p.skill.double?'2 × ':'')+p.weight+' kg · ':'No suitable bell'+(p.skill.double?' pair':'')+' · ')+'Workbell '+p.workBell+' kg − 8 kg'+(p.weight!==null&&p.weight<p.target?' · lower bell':'')+'</p>'+(d?'<p class="small-copy">'+(d.outcome==='complete'?'Completed. Next skill follows next session.':'Skipped. This skill returns next session.')+'</p>':'<p class="small-copy"><em>Technique first. Practice, don’t exhaust.</em> Fewer reps are fine.</p>'+(p.options.length?'<label class="skill-load">Practice weight<select id="skillPracticeWeight">'+(!p.weight?'<option value="" selected>Choose a lower available bell</option>':'')+p.options.map(w=>'<option value="'+w+'" '+(w===p.weight?'selected':'')+'>'+(p.skill.double?'2 × ':'')+w+' kg</option>').join('')+'</select></label>':'')+'<div class="skill-actions"><button class="secondary" id="skillComplete" '+(p.weight===null?'disabled':'')+'>Complete</button><button class="ghost" id="skillSkip">Skip</button></div>')+'</article>';
}
function renderSkillSettings(){
 const root=document.getElementById('skillPracticeSettings');if(!root)return;
 const unlocked=skillUnlocked(),s=state.skillPractice;
 root.innerHTML='<label class="ms-confirm"><input id="skillPracticeToggle" type="checkbox" '+(s.enabled?'checked':'')+' '+(!unlocked?'disabled':'')+'>SFG II Skill Practice</label>'+(unlocked?'<p class="small-copy">One technical set before the focus lift. Workbell − 8 kg.</p>':'<p class="small-copy">Unlocks after earning your personal SFG I badge.</p>')+(unlocked&&s.enabled?'<label class="skill-inventory">Available kettlebells · kg<input id="skillBells" type="text" value="'+s.bells.join(', ')+'" placeholder="16, 16, 20, 24, 24"><small>List each bell once. Repeat a weight for a pair.</small></label><button id="skillSaveBells" class="secondary">Save bells</button>':'');
}
function setupSkillPractice(){
 const settings=document.createElement('div');settings.id='skillPracticeSettings';document.getElementById('tpPanel').append(settings);
 settings.addEventListener('change',event=>{if(event.target.id==='skillPracticeToggle'&&skillUnlocked()){state.skillPractice.enabled=event.target.checked;saveState();render();}});
 settings.addEventListener('click',event=>{
  if(event.target.id!=='skillSaveBells')return;
  const raw=document.getElementById('skillBells').value.trim(),values=raw?raw.split(/[,;\s]+/).map(Number):[];
  if(values.some(x=>!Number.isFinite(x)||x<=0||x>500)){toast('Use bell weights separated by commas, for example 16, 16, 24.');return;}
  state.skillPractice.bells=values.sort((a,b)=>a-b);saveState();render();toast('Available bells saved.');
 });
 els.workoutList.addEventListener('change',event=>{
  if(event.target.id!=='skillPracticeWeight'||!skillPracticeActive()||state.skillPractice.decision)return;
  const p=SkillPractice.plan(state.skillPractice,state.standard.base),weight=Number(event.target.value);if(!p.options.includes(weight))return;
  state.skillPractice.lower[p.skill.id]=weight;saveState();render();
 });
 els.workoutList.addEventListener('click',event=>{
  const button=event.target.closest('#skillComplete,#skillSkip');if(!button||!skillPracticeActive())return;
  if(state.skillPractice.decision)return;
  rememberUndo('skill practice');SkillPractice.act(state.skillPractice,state.standard.base,button.id==='skillComplete'?'complete':'skip',{date:getLocalDateKey(),session:getSessionKey()});saveState();render();
 });
}
