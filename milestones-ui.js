const milestoneImages={'sfg':'sfg','sfg-plus':'sfg-plus','super-sfg':'super-sfg','press':'half-bw-press','super-sinister':'super-sinister'};
let milestoneDetail=null, milestoneCue=null, milestonePersistAt=0;
function milestoneClock(){
 try {if(window.TheSixAndroid?.milestoneClock)return JSON.parse(window.TheSixAndroid.milestoneClock());}catch{}
 return {wall:Date.now(),mono:performance.now(),token:'web:'+performance.timeOrigin};
}
function msEscape(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function msImage(id){return 'badge-'+(milestoneImages[id]||id)+'.png';}
function msTime(s){return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');}
function msSummary(d){
 if(d.kind==='sfg2')return 'Five skills · '+d.weight+' kg test bell · '+d.pressWeight+' kg clean & strict press';
 if(d.kind==='snatch')return d.weight+' kg / bell · six skills + '+d.reps+' snatches in '+msTime(d.seconds);
 if(d.kind==='press')return d.weight+' kg minimum · one strict rep · either arm';
 if(d.kind==='six')return '48 kg / bell · five full focus sets of every lift';
 return '100 swings · '+d.swing+' kg + 10 get-ups · '+d.getup+' kg'+(d.kind==='timed'?' · 5 + 1 + 10 min':' · no time limit');
}
function msTitle(d){return d.id==='press'?(d.profile.pressGoal?'Personal Press':d.profile.sex==='female'?'⅓ Bodyweight Press':'½ Bodyweight Press'):d.title;}
function msProfileMarkup(){
 const p=state.milestones.profile;
 return '<details class="panel ms-profile" '+(!Milestones.profileReady(p)?'open':'')+'><summary>Milestone profile</summary><form id="milestoneProfileForm"><div class="ms-fields"><label>Category<select id="msSex"><option value="male" '+(p.sex==='male'?'selected':'')+'>Male</option><option value="female" '+(p.sex==='female'?'selected':'')+'>Female</option></select></label><label>Age<input id="msAge" type="number" min="18" max="120" step="1" required value="'+(p.age||'')+'"></label><label>Bodyweight · kg<input id="msBodyweight" type="number" min="20" max="350" step="0.1" required value="'+(p.bodyweight||'')+'"></label><label>Press goal · kg (optional)<input id="msPress" type="number" min="1" max="200" step="0.1" value="'+(p.pressGoal||'')+'" placeholder="Automatic"></label></div><p class="small-copy">Automatic press goal: ½ bodyweight for men, ⅓ for women. A personal strength goal, not an SFG II certification test.</p><button class="secondary" type="submit">Save profile</button></form></details>';
}
function renderMilestones(){
 const panel=document.getElementById('milestonesPanel');if(!panel)return;
 const m=state.milestones;
 if(m.active){renderMilestoneAttempt();renderMilestoneNudge();return;}
 if(milestoneDetail){renderMilestoneDetail();renderMilestoneNudge();return;}
 const ready=Milestones.profileReady(m.profile);
 panel.innerHTML='<header><p class="eyebrow">The Six 3.7</p><h2>Milestones</h2><p class="small-copy">Earned through practice. Tested when you choose.</p></header>'+msProfileMarkup()+
 '<div class="ms-grid">'+Milestones.ids.map(id=>{const r=Milestones.requirements(m,state.standard.history,id),d=r.goal,award=Milestones.awards(m,id).at(-1);return '<button type="button" class="ms-badge '+(award?'earned':r.available?'available':'locked')+'" data-ms-detail="'+id+'"><img src="'+msImage(id)+'" alt="'+msEscape(msTitle(d))+' badge" loading="lazy"><strong>'+msEscape(msTitle(d))+'</strong><span>'+(!ready&&!award?'Set up profile':award?'Achieved · '+new Date(award.finishedAt).toLocaleDateString('en-GB'):r.available?'Available':'In progress')+'</span></button>';}).join('')+'</div><p class="small-copy">Personal, self-reported achievements. SFG I tiers include the skills and snatch test. SFG II has a separate skill and press check. These do not represent instructor certification. SFG+, Super SFG, Solid and Super Sinister are personal extensions.</p><p class="small-copy">Badge artwork shows the men’s example weights. Your requirements are shown in each milestone.</p>';
 renderMilestoneNudge();
}
function renderMilestoneDetail(){
 const m=state.milestones,r=Milestones.requirements(m,state.standard.history,milestoneDetail),d=r.goal;
 if(d.kind==='sfg2'){renderSfg2Detail(r);return;}
 const results=m.attempts.filter(a=>a.goal.id===d.id).slice().reverse();
 const history=results.map(a=>{const delta=Milestones.comparison(m,a);return '<li><strong>'+new Date(a.finishedAt).toLocaleDateString('en-GB')+' · '+a.outcome+'</strong><br>'+msEscape(msSummary(a.goal))+'<br>'+ (a.goal.kind==='snatch'?(a.result?.reps??'—')+' valid reps · ':'')+msTime(a.elapsed)+(delta!==null?' · '+(delta>=0?'+':'')+delta+' reps vs previous':'')+'<br><small>'+msEscape(a.goal.profile.sex)+' · age '+a.goal.profile.age+' · '+a.goal.profile.bodyweight+' kg bodyweight'+(a.goal.kind==='press'?' · actual '+msEscape(a.result?.weight)+' kg · '+msEscape(a.result?.side):'')+(a.clockInvalid?' · interrupted clock':'')+'</small></li>';}).join('');
 document.getElementById('milestonesPanel').innerHTML='<button class="ghost" data-ms-back>← All milestones</button><article class="panel ms-detail"><img class="ms-art" src="'+msImage(d.id)+'" alt="'+msEscape(msTitle(d))+' badge"><h2>'+msEscape(msTitle(d))+'</h2><p>'+msEscape(msSummary(d))+'</p><p class="small-copy">'+(d.kind==='snatch'?'The timer cues every 30 seconds. Switch hands and rest as needed; count only valid snatches. All recorded attempts, including ended attempts, start an eight-week cooldown.':d.kind==='timed'?'10 swings every 30 seconds, alternating sides. Rest one minute, then one full get-up every minute, alternating sides.':d.kind==='timeless'?'Complete both movements in this attempt: 50 swings and 5 full get-ups per side. Rest as needed.':d.kind==='press'?'Clean and strictly press once on either arm. Enter the actual bell weight after the lift.':'Confirm the logged five-set performances for all six lifts.')+'</p><details '+(!r.available?'open':'')+'><summary>Requirements · '+r.checks.filter(c=>c.done).length+' / '+r.checks.length+'</summary><ul class="ms-checks">'+r.checks.map(c=>'<li><span aria-label="'+(c.done?'Complete':'Pending')+'">'+(c.done?'✓':'○')+'</span> '+msEscape(c.label)+'</li>').join('')+'</ul></details>'+(d.kind==='snatch'&&Milestones.cooldown(m)?'<p class="small-copy">Next snatch attempt: '+new Date(Date.now()+Milestones.cooldown(m)).toLocaleDateString('en-GB')+'</p>':'')+'<button class="primary" id="msStart" '+(!r.available?'disabled':'')+'>Start '+(r.achieved?'another attempt':'attempt')+'</button><p class="small-copy">This replaces today’s regular session. Your Six rotation stays in place.</p><details><summary>About the standard</summary><p class="small-copy">Use controlled technique, full lockouts and full get-ups. For the snatch test, no press-outs or chest contact on descent; three no-counts or another disqualifying fault means a failed attempt. Keep the app visible for audible cues. The timer continues if the app is backgrounded.</p><p class="small-copy">StrongFirst SFG I requirements and Simple &amp; Sinister standards, checked 8 October 2026. At exactly 100 kg, this app uses the men’s 24 kg category (the published table leaves that exact boundary unspecified). The press badge is a personal fraction or chosen bell goal, not the SFG II weight table. Artwork is decorative; the requirements above apply.</p></details></article>'+(history?'<details class="panel" open><summary>Attempt history</summary><ul class="ms-history">'+history+'</ul></details>':'');
}
function renderMilestoneNudge(){
 const box=document.getElementById('milestoneNudge');if(!box)return;
 const m=state.milestones;
 if(m.active){box.hidden=false;box.innerHTML='<button class="secondary" data-ms-resume>Resume milestone attempt</button>';return;}
 const id=Milestones.ids.find(id=>{const r=Milestones.requirements(m,state.standard.history,id);return r.available&&!r.achieved&&!m.seen.includes(id+':'+JSON.stringify(r.goal));});
 box.hidden=!id;
 if(id)box.innerHTML='<div class="ms-nudge"><button class="secondary" data-ms-detail="'+id+'">You’re ready for '+msEscape(msTitle(Milestones.definition(id,m.profile)))+'</button><button class="ghost" data-ms-dismiss="'+id+'" aria-label="Dismiss milestone suggestion">×</button></div>';
}
function msMarkSeen(id){const m=state.milestones,key=id+':'+JSON.stringify(Milestones.definition(id,m.profile));if(!m.seen.includes(key)){m.seen.push(key);saveState();}}
function msInput(name,label,max,value){return '<label>'+label+'<input type="number" name="'+name+'" min="0" max="'+max+'" step="1" required value="'+msEscape(value??'')+'"></label>';}
function renderMilestoneAttempt(){
 const a=state.milestones.active,d=a.goal,f=a.form||{};
 if(d.kind==='sfg2'){renderSfg2Attempt();return;}
 let fields='';
 if(d.kind==='snatch')fields=msInput('reps','Valid snatches',100,f.reps);
 else if(['timed','timeless'].includes(d.kind))fields=msInput('swingLeft','Swings · left',50,f.swingLeft)+msInput('swingRight','Swings · right',50,f.swingRight)+msInput('getupLeft','Get-ups · left',5,f.getupLeft)+msInput('getupRight','Get-ups · right',5,f.getupRight);
 else if(d.kind==='press')fields='<label>Actual bell · kg<input name="weight" type="number" min="1" max="200" step="0.1" required value="'+msEscape(f.weight??'')+'"></label><label>Arm<select name="side"><option value="Left" '+(f.side!=='Right'?'selected':'')+'>Left</option><option value="Right" '+(f.side==='Right'?'selected':'')+'>Right</option></select></label>';
 document.getElementById('milestonesPanel').innerHTML='<article class="panel ms-attempt"><p class="eyebrow">Milestone attempt</p><h2>'+msEscape(msTitle(d))+'</h2><p class="small-copy">'+msEscape(msSummary(d))+'</p><p id="msPhase" role="status"></p><div id="msClock" class="ms-clock"></div><p id="msElapsed" class="small-copy"></p><p id="msClockWarning" class="small-copy" hidden>The clock was interrupted. This attempt can be saved, but cannot earn a badge.</p><button class="primary" id="msStop">Finish effort · stop clock</button><form id="msResultForm" hidden><div class="ms-fields">'+fields+'</div><label class="ms-confirm"><input type="checkbox" name="controlled" '+(f.controlled?'checked':'')+'> '+(d.kind==='timed'?'All reps completed within their prescribed intervals, with controlled technique.':d.kind==='snatch'?'Valid technique throughout; no disqualifying faults.':d.kind==='six'?'All logged full sets were controlled, including both bells for clean and squat.':'Completed with controlled technique and full range.')+'</label><button class="primary" type="submit">Save result</button><p class="small-copy">Save your actual result, including an incomplete attempt.</p></form><button class="ghost" id="msAbort">End attempt without a result</button></article>';
 updateMilestoneClock();
}
function updateMilestoneClock(){
 const a=state.milestones.active;if(!a)return;
 Milestones.tick(a,milestoneClock());
 if(a.goal.kind==='sfg2')return;
 const frame=Milestones.frame(a);
 if(frame.done&&!a.stopped){Milestones.stop(a);saveState();}
 if(frame.cue!==milestoneCue&&!a.stopped&&document.visibilityState==='visible'){milestoneCue=frame.cue;beep();if(state.settings.vibration&&navigator.vibrate)navigator.vibrate(120);}
 if(frame.done&&milestoneCue!=='done'){milestoneCue='done';if(document.visibilityState==='visible')beep();}
 const phase=document.getElementById('msPhase');if(!phase)return;
 phase.textContent=a.stopped?'Record your result':frame.phase;
 document.getElementById('msClock').textContent=msTime(a.stopped?a.elapsedMs/1000:frame.remaining);
 document.getElementById('msElapsed').textContent=a.goal.seconds?'Elapsed '+msTime(a.elapsedMs/1000)+' / '+msTime(a.goal.seconds):'Elapsed time · rest as needed';
 document.getElementById('msStop').hidden=a.stopped;
 document.getElementById('msResultForm').hidden=!a.stopped;
 document.getElementById('msClockWarning').hidden=!a.clockInvalid;
}
function msKeepAwake(on){
 window.TheSixAndroid?.milestoneAwake?.(on);
 if(on)requestWakeLock();else if(!state.restTimer)releaseWakeLock();
}
function setupMilestonesUI(){
 const panel=document.createElement('section');panel.id='milestonesPanel';panel.hidden=true;panel.setAttribute('aria-label','Milestones');els.appRoot.append(panel);
 const tab=document.createElement('button');tab.id='milestonesTabBtn';tab.className='tab-button';tab.type='button';tab.setAttribute('aria-controls','milestonesPanel');tab.textContent='Milestones';els.settingsTabBtn.before(tab);
 tab.addEventListener('click',()=>{milestoneDetail=null;renderMilestones();switchView('milestones');});
 const nudge=document.createElement('div');nudge.id='milestoneNudge';nudge.hidden=true;els.workoutList.before(nudge);
 document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.msDetail){milestoneDetail=b.dataset.msDetail;msMarkSeen(milestoneDetail);renderMilestones();switchView('milestones');}
  if(b.hasAttribute('data-ms-back')){milestoneDetail=null;renderMilestones();}
  if(b.dataset.msDismiss){msMarkSeen(b.dataset.msDismiss);renderMilestoneNudge();}
  if(b.hasAttribute('data-ms-resume')){renderMilestones();switchView('milestones');}
  if(b.id==='msStart'){
   if(!confirm('Use this milestone attempt instead of today’s regular session? Your Six progression will stay unchanged.'))return;
   try{Milestones.start(state.milestones,state.standard.history,milestoneDetail,milestoneClock());clearRestTimerSilently();state.undo=null;milestoneCue=null;saveState();render();msKeepAwake(true);}catch(e){toast(e.message);}
  }
  if(b.id==='msStop'){updateMilestoneClock();Milestones.stop(state.milestones.active);saveState();renderMilestoneAttempt();}
  if(b.id==='msAbort'&&confirm('End and save an aborted attempt? Snatch attempts still start the eight-week cooldown.')){
   Milestones.finish(state.milestones,{},milestoneClock(),true);state.undo=null;saveState();msKeepAwake(false);render();
  }
 });
 panel.addEventListener('input',()=>{syncSfg2PressFields();const a=state.milestones.active,form=document.getElementById('msResultForm');if(a&&form){a.form=msReadResult(form);saveState();}});
 panel.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;
  if(form.id==='milestoneProfileForm'){
   if(state.milestones.active)return;
   state.milestones.profile=Milestones.profile({sex:document.getElementById('msSex').value,age:Number(document.getElementById('msAge').value),bodyweight:Number(document.getElementById('msBodyweight').value),pressGoal:Number(document.getElementById('msPress').value)||null});
   saveState();renderMilestones();toast('Profile saved.');
  }
  if(form.id==='msResultForm'){
   try{const result=Milestones.finish(state.milestones,msReadResult(form),milestoneClock());state.lastTrainingDate=getLocalDateKey();state.undo=null;saveState();msKeepAwake(false);render();if(result.outcome==='passed'){launchConfetti();toast('Milestone achieved!');}else toast('Attempt saved.');}catch(e){toast(e.message);}
  }
 });
 // A running test owns the session. Stop/save it before editing training or importing backups.
 for(const type of ['click','change'])document.addEventListener(type,event=>{
  if(!state.milestones.active)return;
  const target=event.target;
  if(target.closest('#milestonesPanel,#milestonesTabBtn,#milestoneNudge'))return;
  if(target.closest('button,input,select,label')){event.preventDefault();event.stopImmediatePropagation();toast('Finish or end your milestone attempt first.');switchView('milestones');}
 },true);
 setInterval(()=>{if(state.milestones.active){updateMilestoneClock();if(Date.now()-milestonePersistAt>=1000){milestonePersistAt=Date.now();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}}},250);
 document.addEventListener('visibilitychange',()=>{if(state.milestones.active){updateMilestoneClock();saveState();if(document.visibilityState==='visible')msKeepAwake(true);}});
 window.addEventListener('pagehide',()=>{if(state.milestones.active){Milestones.tick(state.milestones.active,milestoneClock());saveState();}});
 if(state.milestones.active)msKeepAwake(true);
}
function msReadResult(form){const values={};for(const element of form.elements){if(!element.name||element.disabled)continue;values[element.name]=element.type==='checkbox'?element.checked:element.type==='number'?(element.value===''?null:Number(element.value)):element.value;}return values;}
