var Standard = (()=>{
 const ids=['getup','swing','press','clean','squat','snatch'];
 const num=(v,f,min,max)=>Number.isFinite(v)&&v>=min&&v<=max?v:f;
 const integer=(v,f,min,max)=>Number.isInteger(v)&&v>=min&&v<=max?v:f;
 function normalize(raw,legacy={}){
  const base=num(raw?.base,num(legacy.kbWeight,16,0.5,500),0.5,500);
  const stage=['breakin','baseline','build'].includes(raw?.stage)?raw.stage:legacy.phase>0?'build':'breakin';
  const s={version:1,base,next:num(raw?.next,Math.min(500,base+4),base+0.5,500),stage,cycle:integer(raw?.cycle,1,1,100000),revision:integer(raw?.revision,1,1,100000),setupRequired:raw?raw.setupRequired===true:true,steps:{},ready:{},ratios:{swing:[1,2,3].includes(raw?.ratios?.swing)?raw.ratios.swing:3,snatch:[1,2,3].includes(raw?.ratios?.snatch)?raw.ratios.snatch:3},history:Array.isArray(raw?.history)?raw.history.filter(x=>x&&ids.includes(x.id)&&typeof x.date==='string'):[],assessment:['achieved','repeat'].includes(raw?.assessment)?raw.assessment:'',assessmentKey:typeof raw?.assessmentKey==='string'?raw.assessmentKey:''};
  s.escape=null;
  const e=raw?.escape;
  if(e&&ids.includes(e.lag)&&e.stage===s.stage&&e.target<=(e.stage==='build'?s.next+(s.next-s.base):s.next)&&e.base===s.base&&e.next===s.next&&num(e.target,0,e.stage==='build'?s.next+0.5:s.base+0.5,500)>0){
   s.escape={lag:e.lag,base:e.base,next:e.next,stage:e.stage,target:e.target,catchingUp:e.catchingUp===true};
  }
  for(const id of ids){const l=loads(s,id);s.steps[id]=l.stage==='baseline'?5:integer(raw?.steps?.[id],raw?1:integer(legacy.week,1,1,5),1,5);s.ready[id]=raw?.ready?.[id]===true&&s.steps[id]===5;}
  s.escapeDismissed=typeof raw?.escapeDismissed==='string'?raw.escapeDismissed:'';
  return s;
 }
 function loads(s,id){
  const e=s.escape;
  if(!e||id===e.lag&&!e.catchingUp)return {base:s.base,next:s.next,stage:s.stage};
  return {base:e.stage==='build'?e.next:e.base,next:e.target,stage:'build'};
 }
 function plan(s,id){
  const l=loads(s,id),n=s.steps[id],count=l.stage==='breakin'?n:5;
  const heavier=l.stage==='build'?new Set([2,3,4,5,1].slice(0,n)):new Set();
  return Array.from({length:count},(_,i)=>({index:i+1,weight:heavier.has(i+1)?l.next:l.base}));
 }
 function record(s,id,passed,entry){
  const l=loads(s,id);
  s.history.push({...entry,id,passed,...l,revision:s.revision,step:s.steps[id],plan:plan(s,id)});
  if(!passed)s.ready[id]=false;
  if(passed&&!s.ready[id]){if(s.steps[id]<5)s.steps[id]++;else s.ready[id]=true;}
  if(s.escape&&id===s.escape.lag&&!s.escape.catchingUp&&s.ready[id]){
   s.escape.catchingUp=true;s.steps[id]=1;s.ready[id]=false;
  }
  if(s.escape&&s.escape.catchingUp&&ids.every(lift=>s.ready[lift])){
   s.base=s.escape.stage==='build'?s.escape.next:s.escape.base;s.next=s.escape.target;s.stage='build';s.escape=null;s.escapeDismissed='';
  }
  s.assessment='';s.assessmentKey='';
 }
 const allReady=s=>!s.escape&&ids.every(id=>s.ready[id]);
 const repTarget=id=>({getup:1,swing:10,press:5,clean:10,squat:5,snatch:10})[id];
 const repSides=id=>['clean','squat'].includes(id)?['both']:['left','right'];
 function repVector(h,id,rows){
  if(!Array.isArray(h.reps)||h.reps.length!==rows.length||!Array.isArray(h.plan)||h.plan.length!==rows.length)return null;
  const values=[];
  for(let i=0;i<rows.length;i++){
   const r=h.reps[i];if(h.plan[i]?.index!==rows[i].index||h.plan[i]?.weight!==rows[i].weight||r?.index!==rows[i].index||!Array.isArray(r.values)||r.values.length!==repSides(id).length||r.values.some(v=>!Number.isInteger(v)||v<0||v>repTarget(id)))return null;
   values.push(...r.values);
  }return values;
 }
 function stagnation(s,id){
  const l=loads(s,id),rows=plan(s,id),attempts=[];
  for(let i=s.history.length-1;i>=0;i--){const h=s.history[i];if(h.id!==id)continue;
   if(h.revision!==s.revision||h.passed!==false||h.stage!==l.stage||h.base!==l.base||h.next!==l.next||h.step!==s.steps[id])break;
   const values=repVector(h,id,rows);if(!values)break;attempts.unshift({values,index:i});
  }
  let best=null,count=0,baseline=-1;
  for(const a of attempts){
   // Improvement must preserve the best reps of every set and side.
   if(!best||a.values.every((v,i)=>v>=best[i])&&a.values.some((v,i)=>v>best[i])){best=a.values;count=1;baseline=a.index;}
   else count++;
  }return {count,baseline};
 }
 const failureCount=(s,id)=>stagnation(s,id).count;
 function escapeOffer(s){
  if(s.setupRequired||s.escape||s.stage==='build'&&s.next+(s.next-s.base)>500)return null;
  const lagging=ids.filter(id=>!s.ready[id]);if(lagging.length!==1)return null;
  const id=lagging[0],count=failureCount(s,id);if(count<5)return null;
  const key=[s.revision,id,s.stage,s.base,s.next,s.steps[id],stagnation(s,id).baseline].join(':');
  return {id,count,key,from:s.stage==='build'?s.next:s.base,suggested:s.stage==='build'?s.next+(s.next-s.base):s.next};
 }
 function acceptEscape(s,target){
  const offer=escapeOffer(s);if(!offer)throw Error('One stalled lift and five ready lifts are required.');
  if(!Number.isFinite(target)||target<=offer.from||target>offer.suggested||target>500)throw Error('Choose one weight step above '+offer.from+' kg, up to '+offer.suggested+' kg.');
  s.escape={lag:offer.id,base:s.base,next:s.next,stage:s.stage,target,catchingUp:false};
  for(const id of ids)if(id!==offer.id){s.steps[id]=1;s.ready[id]=false;}
  s.revision++;s.assessment='';s.assessmentKey='';
 }
 function advance(s,nextTarget){
  if(!allReady(s))throw Error('All six exercises must be ready');
  if(s.stage==='build'){const newBase=s.next;if(!Number.isFinite(nextTarget)||nextTarget<=newBase||nextTarget>500)throw Error('Choose a higher next weight');s.base=newBase;s.next=nextTarget;}
  s.stage='build';for(const id of ids){s.steps[id]=1;s.ready[id]=false;}s.revision++;s.escapeDismissed='';s.assessment='';s.assessmentKey='';
 }
 function frame(timer,now=Date.now()){
  const stamp=timer.pausedAt??now,elapsed=Math.max(0,(stamp-timer.startedAt)/1000);let end=0;
  for(let i=0;i<timer.sets.length*2;i++){
   const start=end,work=timer.work,rest=timer.work*timer.ratio+(timer.extra?.[i]||0);end+=work+rest;
   if(elapsed<end)return {done:false,index:i,set:Math.floor(i/2)+1,side:i%2?'Right':'Left',phase:elapsed<start+work?'work':'rest',remaining:Math.ceil((elapsed<start+work?start+work:end)-elapsed),totalRemaining:Math.ceil(timer.sets.length*2*work*(1+timer.ratio)+Object.values(timer.extra||{}).reduce((a,b)=>a+b,0)-elapsed),weight:timer.sets[Math.floor(i/2)].weight};
  }
  return {done:true,remaining:0,totalRemaining:0};
 }
 function timer(raw){
  if(!raw||!Number.isFinite(raw.endsAt)||raw.mode==='emom')return null;
  if(raw.mode!=='interval')return raw;
  if(!['swing','snatch'].includes(raw.exerciseId)||raw.work!==(raw.exerciseId==='swing'?18:22)||![1,2,3].includes(raw.ratio)||!Number.isFinite(raw.startedAt)||!Array.isArray(raw.sets)||raw.sets.length<1||raw.sets.length>5||raw.sets.some(x=>!x||!Number.isFinite(x.weight)||x.weight<=0||x.weight>500)||raw.pausedAt!==undefined&&!Number.isFinite(raw.pausedAt))return null;
  const extra={};for(const [k,v]of Object.entries(raw.extra||{}))if(Number.isInteger(Number(k))&&Number(k)>=0&&Number(k)<raw.sets.length*2&&Number.isFinite(v)&&v>=0)extra[k]=v;
  return {...raw,extra};
 }
 return {ids,normalize,loads,plan,record,allReady,advance,frame,timer,repTarget,repSides,stagnation,failureCount,escapeOffer,acceptEscape};
})();
if(typeof module!=='undefined')module.exports=Standard;
