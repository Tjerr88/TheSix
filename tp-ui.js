function tpActive() { return state.tp.enabled && !day7Active() && !isSkippingProgressToday(); }
function tpFocus() { return getCurrentWorkout()[5]; }
function tpDraft() {
  const e=tpFocus(), lift=state.tp.lifts[e.id], key=getSessionKey();
  if(!state.tp.draft || state.tp.draft.key!==key || state.tp.draft.id!==e.id || state.tp.draft.weight!==lift.focusWeight || (e.id==='getup' && state.tp.draft.stage!==lift.stage)) {
    state.tp.draft={id:e.id,key,stage:e.id==='getup'?lift.stage:'full',weight:lift.focusWeight,rows:TP.rows(null),feedback:''};
  }
  return state.tp.draft;
}
function tpValid() {
  const d=tpDraft();return ['owned','repeat','lighter'].includes(d.feedback)&&TP.validRows(d.rows,TP.specs[d.id].side);
}
function tpSummary(rows,id) { return rows.filter(r=>r.left!==null).map(r=>TP.specs[id].side ? `${r.left}/${r.right}` : r.left).join(' · '); }
function renderTPFocus() {
  const e=tpFocus(), lift=state.tp.lifts[e.id], d=tpDraft(), p=TP.proposal(lift,e.id), side=TP.specs[e.id].side;
  const previous=lift.history.filter(x=>e.id!=='getup'||TP.stageOf(x.stage)===lift.stage).at(-1);
  return `<article class="workout-card panel tp-focus">
    ${e.id==='getup'?`<p class="eyebrow">${TP.stages[lift.stage]}</p>${lift.stage==='stand'?'<p class="small-copy">Record the ascent only; bring the kettlebell back down under control.</p>':''}`:''}
    <div class="tp-plan"><strong>${p.sets.length?'Suggested: '+p.sets.join(' · '):'Baseline · up to 5 sets'}</strong></div>
    <p class="small-copy">Actual reps${side?' per side':''}. Not performed? Leave blank.${['clean','squat'].includes(e.id)?' Weight per kettlebell.':''}</p>
    <div class="tp-row tp-heading ${side?'':'tp-single'}"><span>Set / target</span><span>${side?'Left':'Reps'}</span>${side?'<span>Right</span>':''}<span>Rest</span></div>
    ${d.rows.map((r,i)=>`<div class="tp-row ${side?'':'tp-single'}"><span>${i+1} <small>${p.sets[i]!==undefined?'→ '+p.sets[i]:'free'}</small></span>
      <input type="number" min="0" max="100" step="1" inputmode="numeric" aria-label="Set ${i+1} ${side?'left':'reps'}" data-tp-row="${i}" data-tp-side="left" value="${r.left??''}" />
      ${side?`<input type="number" min="0" max="100" step="1" inputmode="numeric" aria-label="Set ${i+1} right" data-tp-row="${i}" data-tp-side="right" value="${r.right??''}" />`:''}
      <button type="button" class="rest-button" data-action="tp-rest" data-set-index="${i+1}" aria-label="Rest after set ${i+1}">${formatTime(state.tp.rest)}</button></div>`).join('')}
    <label class="tp-feedback">How did it feel?<select id="tpFeedback"><option value="">Choose your assessment</option><option value="owned" ${d.feedback==='owned'?'selected':''}>Owned it</option><option value="repeat" ${d.feedback==='repeat'?'selected':''}>Repeat this session</option><option value="lighter" ${d.feedback==='lighter'?'selected':''}>Go lighter next time</option></select></label>
    <details class="compact-help"><summary>Guidance & previous session</summary>
      <p class="small-copy">${p.reason}</p>
      <p class="small-copy">Target: 5 × ${TP.specs[e.id].target}${side?' per side':''}. Rest ${formatTime(state.tp.rest)} or longer. Fewer sets or reps still count as training.</p>
      ${e.id==='getup'?`<p class="small-copy">${lift.stage==='elbow'?'One rep: roll to the elbow and return.':lift.stage==='full'?'One rep: stand up fully and return to the floor.':'Unable to return the kettlebell under control? Choose a smaller partial.'}</p>`:''}
      ${previous?`<p class="small-copy">Last time: ${previous.weight} kg · ${tpSummary(previous.rows,e.id)}.</p>`:''}
      ${lift.history.length?`<details><summary>History (${lift.history.length})</summary>${lift.history.slice(-10).reverse().map(x=>`<p class="small-copy">${x.date} · ${x.weight} kg${e.id==='getup'?' · '+TP.stages[TP.stageOf(x.stage)]:''} · ${tpSummary(x.rows,e.id)} · ${({owned:'owned',repeat:'repeat',lighter:'lighter'})[x.feedback]}</p>`).join('')}</details>`:''}
    </details>
  </article>`;
}
function renderTPSettings() {
  document.getElementById('tpToggle').checked=state.tp.enabled;
  document.getElementById('tpRest').value=state.tp.rest;
  document.getElementById('tpChoices').hidden=!state.tp.enabled;
  document.getElementById('tpRest').closest('label').hidden=!state.tp.enabled;
  document.getElementById('tpChoices').innerHTML='<table class="weight-table"><thead><tr><th>Exercise</th><th>Kg / bell</th><th>Step · kg</th></tr></thead><tbody>'+EXERCISES.map(e=>{
    const lift=state.tp.lifts[e.id],p=TP.proposal(lift,e.id);
    return '<tr><th>'+e.name+'</th>'+[['focusWeight',0,500],['increment',0.5,100]].map(([f,min,max])=>'<td><input aria-label="'+e.name+' '+(f==='focusWeight'?'weight':'weight step')+'" type="number" min="'+min+'" max="'+max+'" step="0.5" data-tp-lift="'+e.id+'" data-tp-field="'+f+'" value="'+lift[f]+'"></td>').join('')+'</tr>'+(p.ready?'<tr><td colspan="3">'+(e.id==='getup'&&lift.stage!=='full'?'<button class="secondary" data-tp-next-stage>Next get-up stage</button>':'<button class="secondary" data-tp-increase="'+e.id+'">'+e.name+': confirm '+(lift.focusWeight+lift.increment)+' kg</button>')+'</td></tr>':'');
  }).join('')+'</tbody></table><label class="tp-feedback">Get-up stage<select id="tpGetupStage">'+Object.entries(TP.stages).map(([id,name])=>'<option value="'+id+'" '+(state.tp.lifts.getup.stage===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label>';
  els.kbInput.closest('.status-kb').hidden=state.tp.enabled||day7Active();
}
function recordTPFocus() {
  if(!tpActive()) return;
  const d=tpDraft();
  state.tp.lifts[d.id].history.push({weight:d.weight,stage:d.stage,target:TP.specs[d.id].target,rows:clone(d.rows),feedback:d.feedback,date:getLocalDateKey()});
  state.tp.draft=null;
}
document.getElementById('tpToggle').addEventListener('change',event=>{
  rememberUndo('Triple Progression setting');state.tp.enabled=event.target.checked;clearRestTimerSilently();saveState();render();
});
document.getElementById('tpRest').addEventListener('change',event=>{
  const seconds=Number(event.target.value);if(!Number.isInteger(seconds)||seconds<120||seconds>600){renderTPSettings();return;}
  state.tp.rest=seconds;saveState();render();
});
document.getElementById('tpChoices').addEventListener('change',event=>{
  const t=event.target;
  if(t.id==='tpGetupStage'){changeGetupStage(t.value);return;}
  const id=t.dataset.tpLift,field=t.dataset.tpField;
  if(!TP.specs[id]||!['focusWeight','increment'].includes(field))return;
  const value=Number(t.value), min=field==='increment'?0.5:0,max=field==='increment'?100:500;
  if(!t.value.trim()||!Number.isFinite(value)||value<min||value>max){renderTPSettings();return;}
  if(value===state.tp.lifts[id][field])return;
  if(field==='focusWeight'&&state.tp.draft?.id===id&&state.tp.draft.rows.some(r=>r.left!==null||r.right!==null)) {
    if(!confirm('Changing weight clears unsaved reps for this exercise. Continue?')){renderTPSettings();return;}
  }
  rememberUndo('exercise weight');state.tp.lifts[id][field]=value;
  if(field==='focusWeight'&&state.tp.draft?.id===id)state.tp.draft=null;
  saveState();render();
});
document.getElementById('tpChoices').addEventListener('click',event=>{
  if(event.target.closest('[data-tp-next-stage]')){const stage=state.tp.lifts.getup.stage;changeGetupStage(stage==='elbow'?'stand':'full');return;}
  const button=event.target.closest('[data-tp-increase]');if(!button)return;
  const id=button.dataset.tpIncrease,lift=state.tp.lifts[id];if(!TP.proposal(lift,id).ready)return;
  const next=lift.focusWeight+lift.increment;
  if(next>500||!confirm(`Increase working weight from ${lift.focusWeight} to ${next} kg? This applies to base sets and focus days. The next focus day will establish a new baseline.`))return;
  if(state.tp.draft?.id===id&&state.tp.draft.rows.some(r=>r.left!==null||r.right!==null)&&!confirm('This clears unsaved reps for this focus day. Continue?'))return;
  rememberUndo('focus weight increase');lift.focusWeight=next;if(state.tp.draft?.id===id)state.tp.draft=null;saveState();render();
});
document.getElementById('workoutList').addEventListener('input',event=>{
  const t=event.target;if(!t.matches('[data-tp-row]')||!tpActive())return;
  const value=t.value===''?null:Number(t.value), index=Number(t.dataset.tpRow), side=t.dataset.tpSide;
  if(![0,1,2,3,4].includes(index)||!['left','right'].includes(side))return;
  tpDraft().rows[index][side]=Number.isInteger(value)&&value>=0&&value<=100?value:null;
  saveState();renderProgress();
});
document.getElementById('workoutList').addEventListener('change',event=>{
  if(event.target.id==='tpFeedback'&&tpActive()){tpDraft().feedback=event.target.value;saveState();renderProgress();}
});
document.getElementById('workoutList').addEventListener('click',event=>{
  const button=event.target.closest('[data-action="tp-rest"]');if(!button||!tpActive())return;
  startRest(tpFocus().id,Number(button.dataset.setIndex),state.tp.rest);
});

function changeGetupStage(stage) {
  const lift=state.tp.lifts.getup;if(!TP.stages[stage]||stage===lift.stage)return;
  const weight=lift.stageWeights[stage].focusWeight;
  if(!confirm(TP.stages[stage]+' with the saved working weight of '+weight+' kg? Check that this weight is suitable. Unsaved get-up reps will be cleared.')){renderTPSettings();return;}
  rememberUndo('get-up stage');lift.stageWeights[lift.stage]={focusWeight:lift.focusWeight};
  lift.stage=stage;lift.focusWeight=weight;
  if(state.tp.draft?.id==='getup')state.tp.draft=null;saveState();render();
}
