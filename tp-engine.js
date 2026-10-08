/* Triple Progression: proposals are guidance; a load increase is always explicit. */
var TP = (() => {
  const specs = {getup:{target:1,side:true},swing:{target:10,side:true,start:5},press:{target:5,side:true},clean:{target:10,side:false,start:5},squat:{target:5,side:false},snatch:{target:10,side:true,start:5}};
  const stages={elbow:'Roll to elbow & return',stand:'To standing (ascent only)',full:'Full get-up (up & down)'};
  const stageOf=x=>stages[x]?x:'full';
  const number = (n, fallback, min=0, max=500) => Number.isFinite(n)&&n>=min&&n<=max?n:fallback;
  const rep = n => Number.isInteger(n)&&n>=0&&n<=100?n:null;
  function rows(raw) { return Array.from({length:5},(_,i)=>({left:rep(raw?.[i]?.left),right:rep(raw?.[i]?.right)})); }
  function validRows(raw, side) {
    let ended=false, count=0;
    for(const r of raw) {
      if(r.left===null && (!side || r.right===null)) { ended=true; continue; }
      if(ended || r.left===null || (side && r.right===null) || r.left<0 || (side && r.right<0)) return false;
      if(r.left>0 || (side && r.right>0)) count++;
    }
    return count>0;
  }
  function normalize(raw, fallback=16) {
    const clean={enabled:raw?.enabled===true,rest:number(raw?.rest,150,120,600),lifts:{},draft:null};
    for(const [id,spec] of Object.entries(specs)) {
      const item=raw?.lifts?.[id];
      const history=Array.isArray(item?.history)?item.history.filter(x=>x&&typeof x==='object').map(x=>({
        weight:number(x.weight,-1),target:spec.target,rows:rows(x.rows),stage:id==='getup'?stageOf(x.stage):'full',
        feedback:['owned','repeat','lighter'].includes(x.feedback)?x.feedback:'repeat',
        date:typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)?x.date:'',
      })).filter(x=>x.weight>=0&&validRows(x.rows,spec.side)):[];
      clean.lifts[id]={focusWeight:number(item?.focusWeight,fallback),increment:number(item?.increment,4,0.5,100),history};
      if(id==='getup') {
        const lift=clean.lifts[id];lift.stage=stageOf(item?.stage);lift.stageWeights={};
        for(const stage of Object.keys(stages)) lift.stageWeights[stage]={focusWeight:number(item?.stageWeights?.[stage]?.focusWeight,fallback)};
        lift.stageWeights[lift.stage]={focusWeight:lift.focusWeight};
      }
    }
    const d=raw?.draft;
    if(d && specs[d.id] && typeof d.key==='string') clean.draft={id:d.id,key:d.key,stage:d.id==='getup'?stageOf(d.stage):'full',weight:number(d.weight,clean.lifts[d.id].focusWeight),rows:rows(d.rows),feedback:['owned','repeat','lighter'].includes(d.feedback)?d.feedback:''};
    return clean;
  }
  function mastered(entry,id) {
    const s=specs[id];return entry.feedback==='owned'&&entry.rows.length===5&&entry.rows.every(r=>r.left>=s.target&&(!s.side||r.right>=s.target));
  }
  function baseReps(lift,id) {
    const previous=lift.history.filter(x=>x.weight===lift.focusWeight&&(id!=='getup'||stageOf(x.stage)===stageOf(lift.stage))).at(-1);
    if(!previous)return specs[id].start || 1;
    const reps=previous.rows.filter(r=>r.left!==null).map(r=>specs[id].side?Math.min(r.left,r.right):r.left);
    if(!reps.length)return specs[id].start || 1;
    const minimum=Math.min(specs[id].target,...reps);
    return previous.feedback==='lighter'?Math.max(minimum>0?1:0,Math.floor(minimum*0.8)):minimum;
  }
  function proposal(lift,id) {
    const sameStage=x=>id!=='getup'||stageOf(x.stage)===stageOf(lift.stage);
    const relevant=lift.history.filter(sameStage);
    const previous=relevant.filter(x=>x.weight===lift.focusWeight).at(-1);
    if(!previous && specs[id].start) return {sets:[5,5,5,5,5],reason:'Start with 5 reps per set, up to 5 sets. Record what you can control, then build toward 5 × 10.',ready:false};
    if(!previous && id==='getup') return {sets:[1,1,1,1,1],reason:'One controlled rep per side at your selected stage. Build up to five sets as needed.',ready:false};
    if(!previous) return {sets:[],reason:'Baseline: record controlled sets and reps. Up to 5 sets; do not force extra reps.',ready:false};
    const history=relevant.slice(-2);
    const ready=history.length===2&&history.every(x=>x.weight===lift.focusWeight&&mastered(x,id));
    let sets=previous.rows.filter(r=>r.left!==null).map(r=>Math.min(specs[id].target,specs[id].side?Math.min(r.left,r.right):r.left));
    if(previous.feedback==='lighter') return {sets:sets.map(n=>Math.max(1,Math.floor(n*0.8))),reason:'Reduced volume suggested. Adjust your working weight in Settings if needed.',ready:false};
    if(previous.feedback==='repeat') return {sets,reason:'Repeat your previous performance. No increase needed.',ready:false};
    if(ready && id==='getup' && stageOf(lift.stage)!=='full') return {sets,reason:'Stage mastered twice. Keep it or choose the next stage in Settings and check the weight.',ready:true};
    if(ready) return {sets,reason:'Target mastered twice. Keep this weight or confirm an increase in Settings.',ready:true};
    if(sets.length<5) { sets.push(Math.max(1,Math.min(...sets))); return {sets,reason:'First build up to five controlled sets.',ready:false}; }
    const minimum=Math.min(...sets), index=sets.indexOf(minimum);
    if(minimum<specs[id].target) { sets[index]++; return {sets,reason:'One extra rep in one set suggested, provided technique stays solid.',ready:false}; }
    return {sets,reason:'Repeat the full target to confirm you own the weight.',ready:false};
  }
  return {specs,stages,stageOf,normalize,rows,validRows,baseReps,proposal,mastered};
})();
if(typeof module!=='undefined') module.exports=TP;
