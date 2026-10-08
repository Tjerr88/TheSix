function tpActive(){return false;} // Legacy backups remain readable; TP is no longer a training mode.
function standardFocus(){return getCurrentWorkout()[5];}
function standardPlan(){return isSkippingProgressToday()?[{index:1,weight:Standard.loads(state.standard,standardFocus().id).base}]:Standard.plan(state.standard,standardFocus().id);}
function assessment(){return state.standard.assessmentKey===getSessionKey()?state.standard.assessment:'';}
function renderStandardSettings(){
 const s=state.standard;
 document.getElementById('standardSetupNotice').hidden=!s.setupRequired;
 document.getElementById('startMode').value=s.stage==='breakin'?'breakin':'baseline';
 document.getElementById('baseWeight').value=s.base;document.getElementById('nextWeight').value=s.next;
 document.getElementById('startFields').hidden=!s.setupRequired;
 document.getElementById('resetProgramBtn').hidden=s.setupRequired;
 document.getElementById('programWeights').textContent=s.escape?'Temporary split · reunite at '+s.escape.target+' kg':s.base+' → '+s.next+' kg per bell';
 renderEscapeSettings();
 for(const id of ['swing','snatch'])document.getElementById(id+'Ratio').value=s.ratios[id];
 document.getElementById('liftProgress').innerHTML='<table class="weight-table"><tbody>'+EXERCISES.map(e=>'<tr><th>'+e.name+'</th><td>'+standardStepLabel(e.id)+'</td></tr>').join('')+'</tbody></table>';
 els.kbInput.closest('.status-kb').hidden=true;
}
function standardStepLabel(id){const s=state.standard,l=Standard.loads(s,id);return s.ready[id]?'Ready · '+(l.stage==='build'?l.next:l.base)+' kg':l.stage==='breakin'?s.steps[id]+' / 5 sets':l.stage==='baseline'?'Confirm 5 sets':s.steps[id]+' / 5 at '+l.next+' kg';}
function standardWorkout(){
 if(state.standard.setupRequired){els.workoutList.innerHTML='<section class="panel workout-card"><h2>Your starting point</h2><p class="small-copy">Choose break-in or five sets, then check your two weights.</p><button class="primary" id="openProgramSetup">Set up training</button></section>';return;}
 if(day7Active()){els.workoutList.innerHTML=renderDay7Workout();return;}
 const e=standardFocus(),plan=standardPlan(),ballistic=['swing','snatch'].includes(e.id);
 const base='<article class="workout-card panel"><div class="check-list">'+getCurrentWorkout().slice(0,5).map(renderBaseExercise).join('')+'</div></article>';
 const last='<article class="workout-card panel"><h2>'+e.name+'</h2><p class="small-copy">'+e.reps+' · '+(isSkippingProgressToday()?'Easy practice':standardStepLabel(e.id))+'</p>'+
 (ballistic?'<button class="secondary" data-start-interval="'+e.id+'">Start intervals · 1:'+state.standard.ratios[e.id]+'</button><p class="small-copy">'+(e.id==='swing'?18:22)+' sec work · '+((e.id==='swing'?18:22)*state.standard.ratios[e.id])+' sec rest. Alternate sides.</p>':'')+
 plan.map(set=>'<div class="check-row"><label><span class="check-name">Set '+set.index+' · '+set.weight+' kg'+(['clean','squat'].includes(e.id)?' / bell':'')+'</span><span class="check-sub">'+e.reps+'</span><input aria-label="Focus set '+set.index+' complete" type="checkbox" data-action="toggle-last-set" data-exercise-id="'+e.id+'" data-set-index="'+set.index+'" '+(isLastSetChecked(e.id,set.index)?'checked':'')+'></label>'+(!ballistic?'<button type="button" class="rest-button" data-action="start-rest" data-exercise-id="'+e.id+'" data-set-index="'+set.index+'">Rest 2:00</button>':'')+'</div>').join('')+
 (!isSkippingProgressToday()?'<label class="tp-feedback">Focus result<select id="standardResult"><option value="">Choose</option><option value="achieved" '+(assessment()==='achieved'?'selected':'')+'>All reps controlled</option><option value="repeat" '+(assessment()==='repeat'?'selected':'')+'>Repeat this step</option></select></label>':'')+'</article>';
 els.workoutList.innerHTML=CompactUI.workout(base,last);
}
function standardCompletion(){
 if(state.standard.setupRequired)return {done:0,total:1,complete:false};
 if(day7Active())return day7Completion();
 const base=getCurrentWorkout().slice(0,5).filter(e=>isChecked(e.id)).length,plan=standardPlan(),done=plan.filter(x=>isLastSetChecked(standardFocus().id,x.index)).length;
 return {done:base+done,total:5+plan.length,complete:base===5&&(isSkippingProgressToday()?done===plan.length:assessment()==='repeat'||assessment()==='achieved'&&done===plan.length)};
}
function standardProgress(){
 document.getElementById('skipDay7Btn').hidden=!day7Active();
 document.getElementById('groupAdvanceBtn').hidden=state.standard.setupRequired||!Standard.allReady(state.standard)||day7Active();
 if(day7Active()){renderDay7Progress();return;}
 const c=standardCompletion(),easy=isSkippingProgressToday();
 els.completedBtn.disabled=!c.complete||(easy&&state.skipProgressDay.completed);els.completedBtn.textContent=easy?'Finish easy practice':'Save session';
 els.actionNote.textContent=state.standard.setupRequired?'Choose your starting point in Settings.':c.done+' / '+c.total+' sets checked'+(!easy&&assessment()==='repeat'?' · This exercise keeps its current step.':'.');
 els.repeatBtn.disabled=state.standard.setupRequired;els.resetCountersBtn.disabled=state.standard.setupRequired||easy;els.resetCountersBtn.textContent='Easy practice today';els.undoBtn.disabled=!state.undo;
}
function saveStandardSession(){
 if(day7Active())return finishDay7(false);
 if(!standardCompletion().complete)return false;
 rememberUndo('session');
 if(isSkippingProgressToday()){state.skipProgressDay.completed=true;state.lastTrainingDate=getLocalDateKey();clearRestTimerSilently();saveState();render();return true;}
 SkillPractice.close(state.skillPractice);
 const e=standardFocus();Standard.record(state.standard,e.id,assessment()==='achieved',{date:getLocalDateKey(),session:getSessionKey(),checked:standardPlan().filter(x=>isLastSetChecked(e.id,x.index)).map(x=>x.index)});
 state.kbWeight=state.standard.base;state.lastTrainingDate=getLocalDateKey();markSessionSuccessful();
 if(isWeekComplete()){const cycle=getWeekKey();advanceWeekOrPhase();state.standard.cycle++;if(state.day7.enabled)state.day7.pending=cycle;}else moveToNextSessionOnly();
 clearRestTimerSilently();advanceLesson();saveState();render();toast('Session saved.');setTimeout(maybeOfferEscape,0);return true;
}
function startIntervals(id){
 if(day7Active()||state.standard.setupRequired||id!==standardFocus().id||!['swing','snatch'].includes(id))return;
 if(state.restTimer&&!confirm('Replace the current timer?'))return;
 const now=Date.now(),work=id==='swing'?18:22,sets=standardPlan();
 state.restTimer={mode:'interval',exerciseId:id,sets,work,ratio:state.standard.ratios[id],extra:{},startedAt:now,endsAt:now+sets.length*2*work*(1+state.standard.ratios[id])*1000,seconds:sets.length*2*work*(1+state.standard.ratios[id]),lastCue:'0-work'};
 saveState();render();scheduleRestTick();requestWakeLock();beep();
}
function intervalRemaining(){return Standard.frame(state.restTimer).totalRemaining;}
function intervalTick(){
 const t=state.restTimer;if(t?.mode!=='interval')return false;
 const f=Standard.frame(t);if(!f.done){const key=f.index+'-'+f.phase;if(key!==t.lastCue&&!t.pausedAt){t.lastCue=key;beep();if(state.settings.vibration&&navigator.vibrate)navigator.vibrate(150);saveState();}}return false;
}
function renderIntervalTimer(){
 const t=state.restTimer,f=Standard.frame(t);els.timerPanel.classList.toggle('show',!f.done);
 els.timerLabel.textContent=f.done?'Intervals complete':(t.pausedAt?'Paused · ':f.phase==='work'?'Work · ':'Rest · ')+'Set '+f.set+' · '+f.side+' · '+f.weight+' kg';els.timerTime.textContent=formatTime(f.remaining);els.cancelTimerBtn.textContent='Stop';
 document.getElementById('pauseIntervalBtn').hidden=false;document.getElementById('pauseIntervalBtn').textContent=t.pausedAt?'Resume':'Pause';
 document.getElementById('extraIntervalBtn').hidden=f.phase!=='rest';
}
function setupStandardUI(){
 document.getElementById('trainingCode').previousElementSibling.textContent='Stage';document.getElementById('weekLabel').previousElementSibling.textContent='Cycle';
 const group=document.createElement('button');group.id='groupAdvanceBtn';group.className='secondary';group.type='button';group.textContent='All six ready · next level';els.completedBtn.after(group);
 group.addEventListener('click',()=>{
  if(!Standard.allReady(state.standard)||day7Active())return;
  const s=state.standard;let next=s.next;
  if(s.stage==='build'){const answer=prompt('All six have mastered '+s.next+' kg. Choose the next target weight (kg per bell).',String(s.next+(s.next-s.base)));if(answer===null)return;next=Number(answer);if(!Number.isFinite(next)||next<=s.next||next>500){toast('Choose a higher weight, up to 500 kg.');return;}}
  if(!confirm(s.stage==='build'?'Move all six to '+s.next+' kg, building toward '+next+' kg?':'Begin building from '+s.base+' to '+s.next+' kg?'))return;
  rememberUndo('next level');Standard.advance(s,next);state.kbWeight=s.base;clearRestTimerSilently();saveState();render();
 });
 document.getElementById('saveProgramBtn').addEventListener('click',()=>{
  const base=Number(document.getElementById('baseWeight').value),next=Number(document.getElementById('nextWeight').value),mode=document.getElementById('startMode').value;
  if(!Number.isFinite(base)||base<=0||!Number.isFinite(next)||next<=base||next>500){toast('Choose a positive weight and a higher target.');return;}
  rememberUndo('program setup');const old=state.standard;
  state.standard=Standard.normalize({base,next,stage:mode,steps:Object.fromEntries(Standard.ids.map(id=>[id,mode==='baseline'?5:1])),ratios:old.ratios,history:old.history,revision:old.revision+1,setupRequired:false});
  SkillPractice.close(state.skillPractice);state.kbWeight=base;state.phase++;state.week=1;state.session=1;state.day7.pending=null;state.skipProgressDay=null;clearRestTimerSilently();saveState();render();switchView('train');
 });
 document.getElementById('resetProgramBtn').addEventListener('click',()=>{if(!confirm('Choose a new starting point? Saved results stay in your backup.'))return;rememberUndo('new starting point');state.standard.setupRequired=true;clearRestTimerSilently();saveState();render();});
 for(const id of ['swing','snatch'])document.getElementById(id+'Ratio').addEventListener('change',event=>{const ratio=Number(event.target.value);if(![1,2,3].includes(ratio))return;state.standard.ratios[id]=ratio;saveState();render();});
 els.workoutList.addEventListener('change',event=>{if(event.target.id!=='standardResult')return;state.standard.assessment=event.target.value;state.standard.assessmentKey=getSessionKey();saveState();renderProgress();});
 els.workoutList.addEventListener('click',event=>{const b=event.target.closest('[data-start-interval]');if(b)startIntervals(b.dataset.startInterval);if(event.target.closest('#openProgramSetup'))switchView('settings');});
 for(const [id,label]of [['pauseIntervalBtn','Pause'],['extraIntervalBtn','Extra rest · 30 sec']]){const b=document.createElement('button');b.id=id;b.type='button';b.className='secondary';b.textContent=label;b.hidden=true;els.cancelTimerBtn.before(b);}
 document.getElementById('pauseIntervalBtn').addEventListener('click',()=>{const t=state.restTimer;if(t?.mode!=='interval')return;if(t.pausedAt){const delta=Date.now()-t.pausedAt;t.startedAt+=delta;t.endsAt+=delta;delete t.pausedAt;}else t.pausedAt=Date.now();saveState();renderTimerPanel();});
 document.getElementById('extraIntervalBtn').addEventListener('click',()=>{const t=state.restTimer;if(t?.mode!=='interval')return;const f=Standard.frame(t);if(f.phase!=='rest')return;t.extra[f.index]=(t.extra[f.index]||0)+30;t.endsAt+=30000;saveState();renderTimerPanel();});
 const more=document.querySelector('#trainControls .compact-help');more.querySelector('summary').textContent='More options';more.append(document.getElementById('skipDay7Btn'));
 const timerOptions=document.createElement('details');timerOptions.id='timerOptions';timerOptions.className='compact-help';timerOptions.innerHTML='<summary>Timer options</summary>';timerOptions.append(document.getElementById('extraIntervalBtn'),els.cancelTimerBtn);els.timerPanel.append(timerOptions);
 els.autoCheckToggleBtn.hidden=true;els.resetWeekBtn.hidden=true; // Neither timer completion nor a week reset should award progress.
 els.repeatBtn.textContent='Skip this session';
}
