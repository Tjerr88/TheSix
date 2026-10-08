var Standard = (()=>{
 const ids=['getup','swing','press','clean','squat','snatch'];
 const num=(v,f,min,max)=>Number.isFinite(v)&&v>=min&&v<=max?v:f;
 const integer=(v,f,min,max)=>Number.isInteger(v)&&v>=min&&v<=max?v:f;
 function normalize(raw,legacy={}){
  const base=num(raw?.base,num(legacy.kbWeight,16,0.5,500),0.5,500);
  const stage=['breakin','baseline','build'].includes(raw?.stage)?raw.stage:legacy.phase>0?'build':'breakin';
  const s={version:1,base,next:num(raw?.next,Math.min(500,base+4),base+0.5,500),stage,cycle:integer(raw?.cycle,1,1,100000),revision:integer(raw?.revision,1,1,100000),setupRequired:raw?raw.setupRequired===true:true,steps:{},ready:{},ratios:{swing:[1,2,3].includes(raw?.ratios?.swing)?raw.ratios.swing:3,snatch:[1,2,3].includes(raw?.ratios?.snatch)?raw.ratios.snatch:3},history:Array.isArray(raw?.history)?raw.history.filter(x=>x&&ids.includes(x.id)&&typeof x.date==='string'):[],assessment:['achieved','repeat'].includes(raw?.assessment)?raw.assessment:'',assessmentKey:typeof raw?.assessmentKey==='string'?raw.assessmentKey:''};
  for(const id of ids){s.steps[id]=stage==='baseline'?5:integer(raw?.steps?.[id],raw?1:integer(legacy.week,1,1,5),1,5);s.ready[id]=raw?.ready?.[id]===true&&s.steps[id]===5;}
  return s;
 }
 function plan(s,id){
  const n=s.steps[id],count=s.stage==='breakin'?n:5;
  const heavier=s.stage==='build'?new Set([2,3,4,5,1].slice(0,n)):new Set();
  return Array.from({length:count},(_,i)=>({index:i+1,weight:heavier.has(i+1)?s.next:s.base}));
 }
 function record(s,id,passed,entry){
  s.history.push({...entry,id,passed,stage:s.stage,base:s.base,next:s.next,step:s.steps[id],plan:plan(s,id)});
  if(!passed)s.ready[id]=false;
  if(passed&&!s.ready[id]){if(s.steps[id]<5)s.steps[id]++;else s.ready[id]=true;}
  s.assessment='';s.assessmentKey='';
 }
 const allReady=s=>ids.every(id=>s.ready[id]);
 function advance(s,nextTarget){
  if(!allReady(s))throw Error('All six exercises must be ready');
  if(s.stage==='build'){const newBase=s.next;if(!Number.isFinite(nextTarget)||nextTarget<=newBase||nextTarget>500)throw Error('Choose a higher next weight');s.base=newBase;s.next=nextTarget;}
  s.stage='build';for(const id of ids){s.steps[id]=1;s.ready[id]=false;}s.revision++;s.assessment='';s.assessmentKey='';
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
 return {ids,normalize,plan,record,allReady,advance,frame,timer};
})();
if(typeof module!=='undefined')module.exports=Standard;
