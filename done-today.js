let nextSessionPreviewDate='';
function doneForToday(){return !state.standard.setupRequired&&state.doneToday===getLocalDateKey()&&nextSessionPreviewDate!==getLocalDateKey();}
function markDoneToday(){state.doneToday=getLocalDateKey();nextSessionPreviewDate='';window.scrollTo({top:0,behavior:'instant'});}
function renderDoneToday(){
 let card=document.getElementById('doneTodayCard');
 if(!card){
  card=document.createElement('section');card.id='doneTodayCard';card.className='panel';card.setAttribute('aria-labelledby','doneTodayTitle');
  card.innerHTML='<p class="eyebrow">Session saved</p><h2 id="doneTodayTitle">Done for today</h2><p class="small-copy">Your work is saved. Rest, recover, and come back when you’re ready.</p><button class="secondary" id="viewNextSession" type="button">View next session</button><button class="ghost" id="undoDoneSession" type="button">Undo last action</button>';
  els.trainPanel.prepend(card);
  card.querySelector('#viewNextSession').addEventListener('click',()=>{nextSessionPreviewDate=getLocalDateKey();render();});
  card.querySelector('#undoDoneSession').addEventListener('click',()=>{nextSessionPreviewDate='';undoLastAction();});
 }
 const done=doneForToday();card.hidden=!done;els.appRoot.classList.toggle('done-today',done);card.querySelector('#undoDoneSession').disabled=!state.undo;
}
// Re-evaluate the local calendar date on resume and while the app stays open.
let doneScreenDate='';
function refreshDoneDate(){const date=getLocalDateKey();if(doneScreenDate!==date){doneScreenDate=date;render();}}
window.addEventListener('focus',refreshDoneDate);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDoneDate();});
setInterval(refreshDoneDate,60000);
