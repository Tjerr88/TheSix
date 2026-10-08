// Actual repetitions use the existing session counter bucket and backup/undo path.
function focusReps(id,index){
 const target=Standard.repTarget(id),sides=Standard.repSides(id);
 const entered=getCount(id,'repsEntered'+index)>0;
 return sides.map(side=>entered?Math.max(0,Math.min(target,Math.floor(Number(getCount(id,'reps'+index+side))||0))):getCount(id,'set'+index)>0?target:0);
}
function focusRepSnapshot(){const id=standardFocus().id;return standardPlan().map(row=>({index:row.index,values:focusReps(id,row.index)}));}
function renderFocusSet(e,set,ballistic){
 const target=Standard.repTarget(e.id),values=focusReps(e.id,set.index),sides=Standard.repSides(e.id),full=values.every(v=>v===target);
 const controls=sides.map((side,i)=>'<div class="rep-side"><span class="rep-side-label">'+(side==='both'?'Reps':side==='left'?'L':'R')+'</span>'+[-1,1].map(delta=>'<button type="button" data-rep-set="'+set.index+'" data-rep-side="'+side+'" data-rep-delta="'+delta+'" aria-label="'+(delta<0?'Decrease':'Increase')+' set '+set.index+' '+(side==='both'?'reps':side+' reps')+'" aria-disabled="'+(delta<0?values[i]===0:values[i]===target)+'">'+(delta<0?'−':'+')+'</button>'+(delta<0?'<output aria-live="polite" aria-label="Set '+set.index+' '+side+' reps">'+values[i]+'<small>/'+target+'</small></output>':'')).join('')+'</div>').join('');
 return '<section class="focus-rep-set'+(full?' is-full':'')+'"><div class="rep-heading"><strong>Set '+set.index+' · '+set.weight+' kg'+(sides.length===1?' / bell':'')+'</strong><button type="button" class="rep-full" data-rep-set="'+set.index+'" data-rep-full="true">'+(full?'✓ Full set':'Full set')+'</button></div><div class="rep-controls">'+controls+'</div>'+(!ballistic?'<button type="button" class="rep-rest" data-action="start-rest" data-exercise-id="'+e.id+'" data-set-index="'+set.index+'">Rest 2:00</button>':'')+'</section>';
}
function handleFocusReps(event){
 const button=event.target.closest('[data-rep-set]');if(!button||day7Active()||state.standard.setupRequired)return;
 const index=Number(button.dataset.repSet),id=standardFocus().id;
 if(!standardPlan().some(row=>row.index===index))return;
 const sides=Standard.repSides(id),target=Standard.repTarget(id),values=focusReps(id,index);
 if(button.dataset.repFull)values.fill(target);
 else {const side=sides.indexOf(button.dataset.repSide),delta=Number(button.dataset.repDelta);if(side<0||![-1,1].includes(delta))return;values[side]=Math.max(0,Math.min(target,values[side]+delta));}
 setCountSilently(id,'repsEntered'+index,1);
 sides.forEach((side,i)=>setCountSilently(id,'reps'+index+side,values[i]));
 setCountSilently(id,'set'+index,values.every(v=>v===target)?1:0);
 const selector='[data-rep-set="'+index+'"]'+(button.dataset.repFull?'[data-rep-full]':'[data-rep-side="'+button.dataset.repSide+'"][data-rep-delta="'+button.dataset.repDelta+'"]');
 saveState();render();els.workoutList.querySelector(selector)?.focus({preventScroll:true});
}
