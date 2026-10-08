/* Compact presentation only: training data and progression stay unchanged. */
var CompactUI = {
  session:null,baseDone:false,
  openKeys(container){return new Set([...container.querySelectorAll('details[data-fold][open]')].map(el=>el.dataset.fold));},
  restore(container,keys){container.querySelectorAll('details[data-fold]').forEach(el=>{el.open=keys.has(el.dataset.fold);});},
  fold(panel,title,statusId){
    const d=document.createElement('details');d.className=panel.className+' compact-panel';d.id=panel.id;d.hidden=panel.hidden;
    const summary=document.createElement('summary');summary.innerHTML='<span>'+title+'</span>'+(statusId?'<small id="'+statusId+'"></small>':'');d.append(summary);
    [...panel.children].forEach(el=>{if(el.classList.contains('eyebrow')||el.tagName==='H2')el.remove();else d.append(el);});
    panel.replaceWith(d);return d;
  },
  help(panel,title){
    const paragraphs=[...panel.children].filter(el=>el.tagName==='P'&&el.classList.contains('small-copy'));
    if(!paragraphs.length)return;
    const d=document.createElement('details');d.className='compact-help';d.innerHTML='<summary>'+title+'</summary>';paragraphs.forEach(p=>d.append(p));panel.append(d);
  },
  workout(base,last){
    const first=getCurrentWorkout().slice(0,5),sv=getSVExercise();
    const total=first.length+(sv?1:0),done=first.reduce((sum,e)=>sum+(sv?.id===e.id?[1,2].filter(n=>getCount(svCounterId(e),'set'+n)>0).length:Number(isChecked(e.id))),0);
    const completed=done===total,key=getSessionKey()+(isSkippingProgressToday()?':easy':'')+':'+state.tp.enabled;
    const oldBase=document.getElementById('baseTraining'),oldFocus=document.getElementById('focusTraining');
    const same=this.session===key;
    let baseOpen=same&&oldBase?oldBase.open:!completed,focusOpen=same&&oldFocus?oldFocus.open:completed;
    if(same&&!this.baseDone&&completed){baseOpen=false;focusOpen=true;}
    this.session=key;this.baseDone=completed;
    const e=getCurrentWorkout()[5];
    return `<details class="training-step panel" id="baseTraining" ${baseOpen?'open':''}><summary><span>1 · Base${sv?' & SV':''}</span><small>${done}/${total} checked</small></summary>${base}</details>
      ${renderSkillPractice()}
      <details class="training-step panel" id="focusTraining" ${focusOpen?'open':''}><summary><span>2 · ${e.name}</span><small>${tpActive()?state.tp.lifts[e.id].focusWeight+' kg · focus':'Focus sets'}</small></summary>${last}</details>`;
  }
};
(() => {
  const actions=document.querySelector('#trainControls .actions');actions.querySelector(':scope > .eyebrow')?.remove();actions.querySelector(':scope > h2')?.remove();
  const extra=document.createElement('details');extra.className='compact-help';extra.innerHTML='<summary>More session options</summary>';
  ['repeatBtn','undoBtn','resetCountersBtn'].forEach(id=>extra.append(document.getElementById(id)));actions.append(extra);
})();
