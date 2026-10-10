function tpActive(){return false;} // Legacy backups remain readable; TP is no longer a training mode.
function standardFocus(){return getCurrentWorkout()[5];}
function standardPlan(){return isSkippingProgressToday()?[{index:1,weight:Standard.loads(state.standard,standardFocus().id).base}]:Standard.plan(state.standard,standardFocus().id);}
function assessment(){return standardPlan().every(row=>isLastSetChecked(standardFocus().id,row.index))?'achieved':'repeat';}
function renderStandardSettings(){
 const s=state.standard;
 document.getElementById('getupInterval').value=s.getupInterval;
 document.querySelector('#tpPanel > h2').textContent=s.setupRequired?'Set up your training':'Training';
 document.getElementById('programWeights').hidden=s.setupRequired;
 document.getElementById('liftProgress').hidden=s.setupRequired;
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
 const lesson=els.lessonHeading.closest('.lesson');
 if(lesson){if(state.standard.setupRequired)lesson.before(els.workoutList);else (document.querySelector('#trainPanel > .warmup')||lesson).after(els.workoutList);}
 if(state.standard.setupRequired){els.workoutList.innerHTML='<section class="panel workout-card"><h2>Set up before your first session</h2><p class="small-copy">Choose your weights and starting point, then save to begin.</p><button class="primary" id="openProgramSetup">Choose weights &amp; start</button></section>';return;}
 if(day7Active()){els.workoutList.innerHTML=renderDay7Workout();return;}
 const e=standardFocus(),plan=standardPlan(),ballistic=['swing','snatch'].includes(e.id);
 const base='<article class="workout-card panel"><div class="check-list">'+getCurrentWorkout().slice(0,5).map(renderBaseExercise).join('')+'</div></article>';
 const last='<article class="workout-card panel"><h2>'+e.name+'</h2><p class="small-copy">'+e.reps+' · '+(isSkippingProgressToday()?'Easy practice':standardStepLabel(e.id))+'</p>'+
 (ballistic?'<button class="secondary" data-start-interval="'+e.id+'">Start intervals · 1:'+state.standard.ratios[e.id]+'</button><p class="small-copy">'+(e.id==='swing'?18:22)+' sec work · '+((e.id==='swing'?18:22)*state.standard.ratios[e.id])+' sec rest. Alternate sides.</p>':'')+
 (e.id==='getup'?'<button class="secondary" data-start-interval="getup">Start intervals · '+state.standard.getupInterval+' sec</button><p class="small-copy">'+(plan.length*2)+' intervals · alternate sides. One Get-Up, then rest until the beep.</p>':'')+
 plan.map(set=>renderFocusSet(e,set,ballistic)).join('')+
 '<p class="small-copy">Log controlled reps. Full set fills both sides where shown.</p></article>';
 els.workoutList.innerHTML=CompactUI.workout(base,last);
}
function standardCompletion(){
 if(state.standard.setupRequired)return {done:0,total:1,complete:false};
 if(day7Active())return day7Completion();
 const base=getCurrentWorkout().slice(0,5).filter(e=>isChecked(e.id)).length,plan=standardPlan(),done=plan.filter(x=>isLastSetChecked(standardFocus().id,x.index)).length;
 return {done:base+done,total:5+plan.length,complete:base===5&&(!isSkippingProgressToday()||done===plan.length)};
}
function standardProgress(){
 document.getElementById('skipDay7Btn').hidden=!day7Active();
 document.getElementById('groupAdvanceBtn').hidden=state.standard.setupRequired||!Standard.allReady(state.standard)||day7Active();
 if(day7Active()){renderDay7Progress();return;}
 const c=standardCompletion(),easy=isSkippingProgressToday();
 els.completedBtn.disabled=!c.complete||(easy&&state.skipProgressDay.completed);els.completedBtn.textContent=easy?'Finish easy practice':'Save session';
 els.actionNote.textContent=state.standard.setupRequired?'Choose your starting point in Settings.':c.done+' / '+c.total+' sets complete'+(!easy?(assessment()==='repeat'?' · Saving will repeat this focus step.':' · Focus target completed.'):'.');
 els.repeatBtn.disabled=state.standard.setupRequired;els.resetCountersBtn.disabled=state.standard.setupRequired||easy;els.resetCountersBtn.textContent='Easy practice today';els.undoBtn.disabled=!state.undo;
}
function saveStandardSession(){
 if(doneForToday())return false;
 if(day7Active())return finishDay7(false);
 if(!standardCompletion().complete)return false;
 rememberUndo('session');
 if(isSkippingProgressToday()){state.skipProgressDay.completed=true;state.lastTrainingDate=getLocalDateKey();markDoneToday();clearRestTimerSilently();saveState();render();return true;}
 SkillPractice.close(state.skillPractice);
 const e=standardFocus();Standard.record(state.standard,e.id,assessment()==='achieved',{date:getLocalDateKey(),session:getSessionKey(),reps:focusRepSnapshot(),checked:standardPlan().filter(x=>isLastSetChecked(e.id,x.index)).map(x=>x.index)});
 state.kbWeight=state.standard.base;state.lastTrainingDate=getLocalDateKey();markSessionSuccessful();
 if(isWeekComplete()){const cycle=getWeekKey();advanceWeekOrPhase();state.standard.cycle++;if(state.day7.enabled)state.day7.pending=cycle;}else moveToNextSessionOnly();
 clearRestTimerSilently();advanceLesson();markDoneToday();saveState();render();toast('Session saved.');setTimeout(maybeOfferEscape,0);return true;
}
function startIntervals(id){
 if(day7Active()||state.standard.setupRequired||id!==standardFocus().id||!['swing','snatch','getup'].includes(id))return;
 if(state.restTimer&&!confirm('Replace the current timer?'))return;
 const now=Date.now(),work=id==='getup'?state.standard.getupInterval:id==='swing'?18:22,ratio=id==='getup'?0:state.standard.ratios[id],sets=standardPlan();
 state.restTimer={mode:'interval',exerciseId:id,sets,work,ratio,extra:{},startedAt:now,endsAt:now+sets.length*2*work*(1+ratio)*1000,seconds:sets.length*2*work*(1+ratio),lastCue:'0-work'};
 saveState();render();scheduleRestTick();requestWakeLock();beep();
}
function intervalRemaining(){return Standard.frame(state.restTimer).totalRemaining;}
function intervalTick(){
 const t=state.restTimer;if(t?.mode!=='interval')return false;
 const f=Standard.frame(t);if(!f.done){const key=f.index+'-'+f.phase;if(key!==t.lastCue&&!t.pausedAt){t.lastCue=key;beep();if(state.settings.vibration&&navigator.vibrate)navigator.vibrate(150);saveState();}}return false;
}
function renderIntervalTimer(){
 const t=state.restTimer,f=Standard.frame(t);els.timerPanel.classList.toggle('show',!f.done);
 els.timerLabel.textContent=f.done?'Intervals complete':(t.pausedAt?'Paused · ':t.exerciseId==='getup'?'Get-Up · ':f.phase==='work'?'Work · ':'Rest · ')+(t.exerciseId==='getup'?'Interval '+(f.index+1)+' / '+(t.sets.length*2):'Set '+f.set)+' · '+f.side+' · '+f.weight+' kg';els.timerTime.textContent=formatTime(f.remaining);els.cancelTimerBtn.textContent='Stop';
 document.getElementById('pauseIntervalBtn').hidden=false;document.getElementById('pauseIntervalBtn').textContent=t.pausedAt?'Resume':'Pause';
 document.getElementById('extraIntervalBtn').hidden=f.phase!=='rest';
}
function setupStandardUI(){
 els.workoutList.addEventListener('click',handleFocusReps);
 document.getElementById('getupInterval').addEventListener('change',event=>{const seconds=Number(event.target.value);if(!Number.isInteger(seconds)||seconds<15||seconds>300){event.target.value=state.standard.getupInterval;toast('Choose 15–300 seconds.');return;}state.standard.getupInterval=seconds;saveState();render();});
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
  state.standard=Standard.normalize({base,next,stage:mode,steps:Object.fromEntries(Standard.ids.map(id=>[id,mode==='baseline'?5:1])),ratios:old.ratios,getupInterval:old.getupInterval,history:old.history,revision:old.revision+1,setupRequired:false});
  state.doneToday='';nextSessionPreviewDate='';SkillPractice.close(state.skillPractice);state.kbWeight=base;state.phase++;state.week=1;state.session=1;state.day7.pending=null;state.skipProgressDay=null;clearRestTimerSilently();saveState();render();switchView('train');toast('Training is ready.');
 });
 document.getElementById('resetProgramBtn').addEventListener('click',()=>{if(!confirm('Choose a new starting point? Saved results stay in your backup.'))return;rememberUndo('new starting point');state.standard.setupRequired=true;clearRestTimerSilently();saveState();render();});
 for(const id of ['swing','snatch'])document.getElementById(id+'Ratio').addEventListener('change',event=>{const ratio=Number(event.target.value);if(![1,2,3].includes(ratio))return;state.standard.ratios[id]=ratio;saveState();render();});
 els.workoutList.addEventListener('click',event=>{const b=event.target.closest('[data-start-interval]');if(b)startIntervals(b.dataset.startInterval);if(event.target.closest('#openProgramSetup'))switchView('settings');});
 for(const [id,label]of [['pauseIntervalBtn','Pause'],['extraIntervalBtn','Extra rest · 30 sec']]){const b=document.createElement('button');b.id=id;b.type='button';b.className='secondary';b.textContent=label;b.hidden=true;els.cancelTimerBtn.before(b);}
 document.getElementById('pauseIntervalBtn').addEventListener('click',()=>{const t=state.restTimer;if(t?.mode!=='interval')return;if(t.pausedAt){const delta=Date.now()-t.pausedAt;t.startedAt+=delta;t.endsAt+=delta;delete t.pausedAt;}else t.pausedAt=Date.now();saveState();renderTimerPanel();});
 document.getElementById('extraIntervalBtn').addEventListener('click',()=>{const t=state.restTimer;if(t?.mode!=='interval')return;const f=Standard.frame(t);if(f.phase!=='rest')return;t.extra[f.index]=(t.extra[f.index]||0)+30;t.endsAt+=30000;saveState();renderTimerPanel();});
 const more=document.querySelector('#trainControls .compact-help');more.querySelector('summary').textContent='More options';more.append(document.getElementById('skipDay7Btn'));
 const timerOptions=document.createElement('details');timerOptions.id='timerOptions';timerOptions.className='compact-help';timerOptions.innerHTML='<summary>Timer options</summary>';timerOptions.append(document.getElementById('extraIntervalBtn'),els.cancelTimerBtn);els.timerPanel.append(timerOptions);
 els.autoCheckToggleBtn.hidden=true;els.resetWeekBtn.hidden=true; // Neither timer completion nor a week reset should award progress.
 els.repeatBtn.textContent='Skip this session';
}
