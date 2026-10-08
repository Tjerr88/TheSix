function escapeName(id){return EXERCISES.find(e=>e.id===id)?.name||id;}
function renderEscapeSettings(){
 const box=document.getElementById('escapeSettings');if(!box)return;
 const s=state.standard,e=s.escape,offer=Standard.escapeOffer(s);
 box.hidden=!e&&!offer;
 if(e){box.innerHTML='<p class="small-copy"><strong>Temporary split</strong><br>'+escapeName(e.lag)+(e.catchingUp?' is now joining the others at '+e.target+' kg.':' keeps its current build. The other five build to '+e.target+' kg.')+' Everyone must finish at '+e.target+' kg before the next increase. No second escape while catching up.</p>';return;}
 if(offer)box.innerHTML='<p class="small-copy">'+escapeName(offer.id)+' · '+offer.count+' attempts since the last improvement, including that attempt.</p><button class="secondary" id="openEscapeBtn">Review one-step escape</button>';
}
function maybeOfferEscape(){
 if(state.milestones.active||isSkippingProgressToday())return;
 const offer=Standard.escapeOffer(state.standard);if(!offer||state.standard.escapeDismissed===offer.key)return;
 openEscapeDialog(offer);
}
function openEscapeDialog(offer=Standard.escapeOffer(state.standard)){
 if(!offer||state.milestones.active)return;
 const dialog=document.getElementById('escapeDialog');if(dialog.open)return;
 dialog.dataset.offer=offer.key;
 // Mark it seen before opening, so closing/restarting never repeats this prompt.
 state.standard.escapeDismissed=offer.key;saveState();
 document.getElementById('escapeMessage').textContent=escapeName(offer.id)+' has logged '+offer.count+' attempts on this step, including the last improvement. No new best since then. Keep this lift on its current build and let the other five start building from '+offer.from+' to '+offer.suggested+' kg?';
 document.getElementById('escapeLimit').textContent='The stalled lift keeps training. All six must reach '+offer.suggested+' kg before anyone goes higher.';
 if(!day7Active()&&standardCompletion().done>0)document.getElementById('escapeLimit').textContent+=' Changing weights clears reps and checks for the current unfinished session; Undo can restore them.';
 dialog.showModal();
}
function setupEscapeUI(){
 const box=document.createElement('div');box.id='escapeSettings';box.hidden=true;document.getElementById('liftProgress').after(box);
 const dialog=document.createElement('dialog');dialog.id='escapeDialog';dialog.setAttribute('aria-labelledby','escapeTitle');
 dialog.innerHTML='<h2 id="escapeTitle">Let the other five move ahead?</h2><p id="escapeMessage"></p><p class="small-copy" id="escapeLimit"></p><button class="primary" id="acceptEscapeBtn">Yes, let the others progress</button><button class="secondary" id="declineEscapeBtn">No, keep building together</button><p class="small-copy">You can revisit this choice in Settings → Training.</p>';
 document.body.append(dialog);
 box.addEventListener('click',event=>{if(event.target.closest('#openEscapeBtn'))openEscapeDialog();});
 document.getElementById('declineEscapeBtn').addEventListener('click',()=>{dialog.close();renderEscapeSettings();});
 document.getElementById('acceptEscapeBtn').addEventListener('click',()=>{
  const offer=Standard.escapeOffer(state.standard);if(!offer||offer.key!==dialog.dataset.offer){dialog.close();render();return;}
  rememberUndo('one-step escape');Standard.acceptEscape(state.standard,offer.suggested);
  // Existing checks belong to the old prescription. Revision creates a fresh bucket.
  state.skipProgressDay=null;clearRestTimerSilently();saveState();dialog.close();render();toast('One-step escape started.');
 });
}
