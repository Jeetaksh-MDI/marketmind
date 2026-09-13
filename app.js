(() => {
  'use strict';

  const TOTAL_ROUNDS = 9;
  const STORAGE_KEY = 'marketmind_state_v1';
  const THEME_KEY = 'marketmind_theme';

  const TRAITS = {
    risk: 'Risk appetite',
    loss: 'Loss sensitivity',
    patience: 'Patience',
    independence: 'Independent thinking',
    competitive: 'Competitive drive',
    social: 'Social orientation',
    value: 'Value discipline',
    sunk: 'Sunk-cost resistance'
  };

  const ARCHETYPES = [
    {name:'Strategic Optimizer', icon:'♟', ideal:{risk:64,loss:45,patience:82,independence:76,competitive:67,social:55,value:76,sunk:86}, blurb:'You tend to play the system rather than chase the loudest immediate outcome. You balance upside with evidence, stay patient, and are willing to change course when the economics stop making sense.'},
    {name:'Bold Builder', icon:'🚀', ideal:{risk:88,loss:28,patience:58,independence:68,competitive:90,social:38,value:48,sunk:58}, blurb:'You lean into upside, move fast and accept uncertainty when growth is available. You are comfortable sacrificing some safety and margin for expansion.'},
    {name:'Security Architect', icon:'🛡', ideal:{risk:24,loss:88,patience:80,independence:58,competitive:34,social:62,value:88,sunk:78}, blurb:'You design around downside first. Predictability, liquidity and resilience matter to you, even when protecting them means leaving some potential upside on the table.'},
    {name:'Independent Contrarian', icon:'🐺', ideal:{risk:70,loss:38,patience:62,independence:94,competitive:62,social:42,value:70,sunk:82}, blurb:'Consensus has relatively little pull on you. You are comfortable holding a view that differs from the crowd and prefer decisions that survive your own scrutiny.'},
    {name:'Cooperative Strategist', icon:'🤝', ideal:{risk:50,loss:52,patience:76,independence:66,competitive:42,social:92,value:68,sunk:80}, blurb:'You repeatedly consider outcomes beyond your own immediate payoff. You combine patience and economic reasoning with a strong preference for shared or socially sustainable outcomes.'},
    {name:'Adaptive Opportunist', icon:'⚡', ideal:{risk:78,loss:36,patience:38,independence:72,competitive:78,social:44,value:46,sunk:88}, blurb:'You are willing to move quickly when the opportunity set changes. You favor flexibility, upside and rapid reallocation over rigid long-term plans.'},
    {name:'Calculated Explorer', icon:'🧭', ideal:{risk:64,loss:52,patience:66,independence:68,competitive:58,social:60,value:65,sunk:72}, blurb:'You explore without betting the entire house. Your decisions usually combine curiosity with a meaningful safety margin and a willingness to learn from outcomes.'},
    {name:'Consistent Planner', icon:'🧱', ideal:{risk:42,loss:62,patience:88,independence:72,competitive:46,social:58,value:84,sunk:84}, blurb:'You favor stable internal rules, patience and disciplined trade-offs. Short-term noise tends to move you less than longer-term structure.'}
  ];

  const state = loadState() || freshState();
  let submissionLocked = false;

  const $ = (s, root=document) => root.querySelector(s);
  const app = $('#app');
  const landing = $('#landing');
  const game = $('#game');
  const result = $('#result');
  const scenarioMount = $('#scenarioMount');

  function freshState(){
    return {
      sessionId: crypto.randomUUID ? crypto.randomUUID() : `mm-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name:'', seed:Math.floor(Math.random()*2147483646)+1, roundIndex:0, completed:false, started:false,
      world:{cash:600000, portfolio:400000, businessValue:0, reputation:50, wellbeing:70, socialImpact:50},
      evidence:{risk:[],loss:[],patience:[],independence:[],competitive:[],social:[],value:[],sunk:[]},
      decisions:[], temp:{}, startedAt:null, completedAt:null
    };
  }

  function loadState(){
    try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return null; const parsed=JSON.parse(raw); return parsed && parsed.sessionId ? parsed : null; }catch(_){ return null; }
  }
  function saveState(){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }catch(_){} }
  function clamp(v,min,max){ v=Number(v); return Number.isFinite(v)?Math.min(max,Math.max(min,v)):min; }
  function money(v){ const n=Number.isFinite(Number(v))?Number(v):0; return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n); }
  function pct(v,d=0){ return `${Number(v||0).toFixed(d)}%`; }
  function safeText(s){ return String(s??'').replace(/[<>]/g,'').trim(); }
  function seeded(salt){ let x=(state.seed + salt*2654435761)>>>0; x^=x<<13; x^=x>>>17; x^=x<<5; return ((x>>>0)%100000)/100000; }
  function addEvidence(trait,value,weight=1){ if(!state.evidence[trait]) state.evidence[trait]=[]; state.evidence[trait].push({value:clamp(value,0,100),weight:clamp(weight,.1,5)}); }
  function traitScore(trait){ const a=state.evidence[trait]||[]; if(!a.length) return 50; const w=a.reduce((s,x)=>s+x.weight,0); return Math.round(a.reduce((s,x)=>s+x.value*x.weight,0)/w); }
  function traitConfidence(trait){ const a=state.evidence[trait]||[]; if(!a.length) return 20; const w=a.reduce((s,x)=>s+x.weight,0); const mean=traitScore(trait); const spread=Math.sqrt(a.reduce((s,x)=>s+x.weight*Math.pow(x.value-mean,2),0)/w); return Math.round(clamp(28+w*16-spread*.25,25,96)); }
  function scores(){ return Object.fromEntries(Object.keys(TRAITS).map(k=>[k,traitScore(k)])); }
  function band(v){ return v<=20?0:v<=40?1:v<=60?2:v<=80?3:4; }
  function bandLabel(v){ return ['Very low','Low','Balanced','High','Very high'][band(v)]; }

  const traitCopy = {
    risk:[
      'You consistently favored certainty and downside protection over uncertain upside.',
      'You generally preferred security, but accepted limited risk when the payoff was compelling.',
      'Your risk-taking changed with context; you balanced upside against potential downside.',
      'You were comfortable accepting meaningful uncertainty when you saw enough upside.',
      'You repeatedly embraced high-variance outcomes and tolerated substantial uncertainty.'
    ],
    loss:[
      'Losses had relatively little pull on your decisions once the underlying economics changed.',
      'You showed limited sensitivity to protecting existing gains when a better expected outcome was available.',
      'You balanced protecting what you had with pursuing recovery or upside.',
      'Avoiding losses meaningfully shaped several of your choices.',
      'You strongly prioritized protecting existing value, especially after negative outcomes.'
    ],
    patience:[
      'You placed a large premium on immediate outcomes.',
      'You preferred sooner rewards unless waiting offered a substantial premium.',
      'You balanced immediate consumption with future value.',
      'You were willing to wait for moderately better future outcomes.',
      'You showed a strong preference for delayed value and long-horizon payoffs.'
    ],
    independence:[
      'Social and framing cues materially shifted several of your choices.',
      'External cues influenced you, although you did not follow them mechanically.',
      'You showed a mixed pattern: sometimes independent, sometimes responsive to context and consensus.',
      'Your decisions were usually anchored in your own assessment rather than the crowd.',
      'You remained remarkably stable even when framing or social proof pushed strongly in another direction.'
    ],
    competitive:[
      'You tended to protect margin and stability rather than fight aggressively for share.',
      'You competed selectively and avoided expensive battles for growth.',
      'You balanced market share against profitability.',
      'You were willing to spend margin and resources to improve your competitive position.',
      'You repeatedly prioritized market share, attack and strategic pressure over short-term comfort.'
    ],
    social:[
      'You placed relatively little weight on shared or external outcomes when they reduced your own payoff.',
      'Your decisions were primarily self-payoff oriented, with some willingness to support collective outcomes.',
      'You balanced personal payoff with community and social consequences.',
      'You repeatedly accepted some private cost for broader social outcomes.',
      'Collective welfare and external impacts strongly influenced your economic choices.'
    ],
    value:[
      'You were comfortable paying for perceived upside and convenience even at relatively rich prices.',
      'You showed moderate willingness to stretch for products or opportunities you valued.',
      'You balanced willingness-to-pay with price discipline.',
      'You usually required a strong value case before committing money.',
      'You were highly price-disciplined and consistently demanded substantial value before spending.'
    ],
    sunk:[
      'Past investment exerted a strong pull on whether you kept committing resources.',
      'You showed some tendency to keep funding prior commitments after their economics weakened.',
      'You were mixed: previous investment mattered, but did not dominate your decision.',
      'You were generally willing to walk away when future economics deteriorated.',
      'You cleanly separated past spending from future-value decisions.'
    ]
  };

  function showView(which){ [landing,game,result].forEach(v=>v.classList.remove('active')); which.classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }

  function renderWorld(){
    const w=state.world;
    const items=[['Cash',money(w.cash)],['Portfolio',money(w.portfolio)],['Business',money(w.businessValue)],['Reputation',Math.round(w.reputation)],['Impact',Math.round(w.socialImpact)]];
    $('#worldStats').innerHTML=items.map(([k,v])=>`<div class="world-chip"><span>${k}</span><b>${v}</b></div>`).join('');
  }

  function updateProgress(){
    const idx=Math.min(state.roundIndex+1,TOTAL_ROUNDS), p=Math.round((idx/TOTAL_ROUNDS)*100);
    $('#roundLabel').textContent=`Decision ${idx} of ${TOTAL_ROUNDS}`;
    $('#progressPct').textContent=`${p}%`;
    $('#progressFill').style.width=`${p}%`;
  }

  function storyVisual(big,note,accent='violet'){
    const c=accent==='cyan'?'var(--cyan)':accent==='rose'?'var(--rose)':accent==='lime'?'var(--lime)':'var(--violet)';
    return `<div class="story-visual"><span class="small-note">${note}</span><div class="spark"><svg viewBox="0 0 500 90" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true"><path d="M0 70 C55 62 62 18 112 34 S178 82 225 48 S285 20 330 44 S410 78 500 15" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity=".9"/><path d="M0 72 L500 72" stroke="var(--line)"/></svg></div><div class="big-num">${big}</div></div>`;
  }

  function rangeControl({id,label,min,max,step,value,format=(x)=>x,left,right}){
    return `<div class="control-group"><div class="control-top"><label for="${id}">${label}</label><output id="${id}Out">${format(value)}</output></div><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"/><div class="range-ends"><span>${left??format(min)}</span><span>${right??format(max)}</span></div></div>`;
  }

  function bindRange(id,formatter,onInput){
    const el=$(`#${id}`), out=$(`#${id}Out`); if(!el||!out) return;
    const fn=()=>{ const v=Number(el.value); out.textContent=formatter(v); if(onInput) onInput(v); };
    el.addEventListener('input',fn); fn();
  }

  function scenarioShell({tag,title,copy,visual,controls,prompt,button='Lock decision',substep='',facts=[],accent='violet'}){
    const factHtml=facts.length?`<div class="scenario-facts">${facts.map(([label,value])=>`<div class="scenario-fact"><span>${label}</span><b>${value}</b></div>`).join('')}</div>`:'';
    scenarioMount.innerHTML=`<div class="scenario accent-${accent} result-flash"><article class="scenario-story"><div class="scenario-tag">${tag}</div><h2>${title}</h2><p>${copy}</p>${factHtml}${visual}</article><section class="decision-panel">${substep?`<p class="substep-note">${substep}</p>`:''}<h3>Your move</h3><p class="prompt">${prompt}</p>${controls}<div class="live-hint" id="liveHint">Move the controls. There is no single “correct” answer — choose what you would genuinely do.</div><button class="primary" id="submitDecision" type="button">${button} →</button></section></div>`;
  }

  function renderRound(){
    if(state.roundIndex>=TOTAL_ROUNDS){ finishSimulation(); return; }
    submissionLocked=false; state.temp=state.temp||{}; updateProgress(); renderWorld();
    const f=[roundWindfall,roundAnchor,roundCafe,roundSunk,roundTime,roundHerd,roundPublic,roundExternality,roundCrash][state.roundIndex];
    f();
  }

  function lockSubmit(fn){
    const btn=$('#submitDecision'); if(!btn) return;
    btn.addEventListener('click',()=>{ if(submissionLocked) return; submissionLocked=true; btn.disabled=true; try{ fn(); }catch(err){ console.error(err); submissionLocked=false; btn.disabled=false; showInlineError('Something went wrong. Your previous progress is safe — please try again.'); } });
  }
  function showInlineError(msg){ const h=$('#liveHint'); if(h){ h.textContent=msg; h.style.color='var(--rose)'; } }

  function commitDecision(decision,outcome){
    state.decisions.push(decision); state.roundIndex+=1; state.temp={}; saveState();
    track('round',{round:state.roundIndex,decision,decisions:state.decisions,world:state.world}).catch(()=>{});
    showOutcome(outcome);
  }

  function showOutcome({headline,copy,deltas=[],tease='Your reasoning stays hidden for now. We’ll decode it at the end.'}){
    updateProgress(); renderWorld();
    scenarioMount.innerHTML=`<div class="round-result result-flash"><article class="result-card"><div class="outcome-kicker">THE WORLD REACTED</div><h2>${headline}</h2><p class="outcome-copy">${copy}</p><div class="delta-grid">${deltas.map(d=>`<div class="delta ${d.type||''}"><span>${d.label}</span><b>${d.value}</b></div>`).join('')}</div></article><aside class="result-side"><div class="tease"><strong>Not explaining the theory yet.</strong><br>${tease}</div><button class="primary" id="continueBtn" type="button">Continue simulation →</button></aside></div>`;
    $('#continueBtn').addEventListener('click',()=>{ if(state.roundIndex>=TOTAL_ROUNDS) finishSimulation(); else renderRound(); });
  }

  // 1 — Windfall allocation
  function roundWindfall(){
    const v=clamp(state.temp.riskPct??45,0,100);
    scenarioShell({tag:'01 · UNCERTAINTY',title:'₹1,00,000 just landed in your account.',copy:'You must decide how much to protect and how much to expose to a one-year risky opportunity. The safe account earns a guaranteed 3%. The risky opportunity has roughly a 50–50 chance of either more than doubling or losing most of its value.',facts:[['Safe option','Guaranteed +3%'],['Risky upside','2.15× outcome'],['Risky downside','0.35× outcome'],['Horizon','1 year']],accent:'cyan',visual:storyVisual('₹1,00,000','ONE-TIME WINDFALL','cyan'),prompt:'Choose the percentage you would genuinely put at risk. Whatever you do not allocate stays in the guaranteed account.',controls:rangeControl({id:'riskPct',label:'Share invested in the risky opportunity',min:0,max:100,step:1,value:v,format:x=>`${x}%`,left:'0% · fully protected',right:'100% · fully exposed'})});
    bindRange('riskPct',x=>`${x}%`,x=>{ state.temp.riskPct=x; const amt=100000*x/100; $('#liveHint').textContent=`${money(amt)} at risk · ${money(100000-amt)} protected.`; });
    lockSubmit(()=>{
      const r=clamp(Number($('#riskPct').value),0,100), risky=100000*r/100, safe=100000-risky;
      const factor=seeded(11)>.52?2.15:.35, riskyEnd=risky*factor, safeEnd=safe*1.03, total=safeEnd+riskyEnd;
      state.world.cash+=safeEnd; state.world.portfolio+=riskyEnd;
      addEvidence('risk',r,1.5);
      commitDecision({round:1,title:'The windfall',concepts:['Expected utility','Risk–return trade-off'],choiceSummary:`You put ${r}% (${money(risky)}) into the risky opportunity and protected ${100-r}%.`,personalityText:r<25?'You strongly preferred certainty in a pure-gain setting.':r<50?'You took some upside while keeping most of the windfall protected.':r<75?'You accepted meaningful uncertainty for higher potential upside.':'You put most of the windfall at risk, showing high tolerance for variance when the upside was attractive.',data:{riskPct:r,factor}}, {headline:factor>1?'The bet paid off.':'The risky side stumbled.',copy:`Your protected money grew slightly. The risky portion finished at ${factor.toFixed(2)}×. Your ₹1,00,000 windfall is now worth ${money(total)} across cash and investments.`,deltas:[{label:'Protected',value:money(safeEnd),type:'positive'},{label:'Risky outcome',value:money(riskyEnd),type:factor>1?'positive':'negative'},{label:'Total value',value:money(total)}]});
    });
  }

  // 2 — Anchoring / WTP, two-stage
  function roundAnchor(){
    if(!state.temp.anchorStage){
      const base=clamp(state.temp.baseWtp??7000,3000,12000);
      scenarioShell({tag:'02 · CONSUMER CHOICE',title:'You need new headphones.',copy:'Nova Pro is a premium pair with strong active noise cancellation, 35-hour battery life and a two-year warranty. Before you see any price or discount, decide what the product itself is worth to you.',facts:[['Battery','35 hours'],['Warranty','2 years'],['Reviews','Strong'],['Price shown','Not yet']],accent:'violet',visual:storyVisual('Nova Pro','VALUE IT BEFORE YOU SEE A PRICE','violet'),prompt:'Set the highest price at which you would still prefer owning the headphones to keeping the money.',controls:rangeControl({id:'baseWtp',label:'Your maximum willingness to pay',min:3000,max:12000,step:100,value:base,format:money,left:'₹3,000',right:'₹12,000'}),button:'Lock my valuation'});
      bindRange('baseWtp',money,x=>{state.temp.baseWtp=x;$('#liveHint').textContent=`At prices above ${money(x)}, you would walk away.`;});
      lockSubmit(()=>{state.temp.baseWtp=clamp(Number($('#baseWtp').value),3000,12000);state.temp.anchorStage=1;submissionLocked=false;roundAnchor();});
      return;
    }
    const base=clamp(state.temp.baseWtp,3000,12000), revised=clamp(state.temp.revisedWtp??base,3000,15000);
    scenarioShell({tag:'02 · CONSUMER CHOICE',title:'Now you see the price tag.',copy:`The product is unchanged, but the store now frames it as “MRP ₹14,999 — today ₹8,999”. Decide again after seeing that reference price.`,facts:[['Displayed MRP','₹14,999'],['Sale price','₹8,999'],['Product specs','Unchanged'],['Your first valuation',money(base)]],accent:'rose',visual:storyVisual('₹8,999','SAME PRODUCT · NEW FRAME','rose'),prompt:'Set your maximum willingness to pay again. If your number is at least ₹8,999, the simulation will treat that as a purchase.',substep:`Before seeing any price, you valued it at ${money(base)}.`,controls:rangeControl({id:'revisedWtp',label:'Your revised maximum willingness to pay',min:3000,max:15000,step:100,value:revised,format:money,left:'₹3,000',right:'₹15,000'}),button:'Make purchase decision'});
    bindRange('revisedWtp',money,x=>{state.temp.revisedWtp=x;const delta=x-base;$('#liveHint').textContent=`Your valuation has ${delta===0?'not changed':`${delta>0?'risen':'fallen'} by ${money(Math.abs(delta))}`}. ${x>=8999?'You would buy at ₹8,999.':'You would still walk away at ₹8,999.'}`;});
    lockSubmit(()=>{
      const r=clamp(Number($('#revisedWtp').value),3000,15000), delta=r-base, buy=r>=8999;
      const independence=100-clamp(Math.abs(delta)/4000*100,0,100); const value=100-clamp((r-3000)/12000*100,0,100);
      addEvidence('independence',independence,1.2); addEvidence('value',value,1.5);
      if(buy){state.world.cash=Math.max(0,state.world.cash-8999);state.world.wellbeing=clamp(state.world.wellbeing+3,0,100);}
      const person=Math.abs(delta)<500?'The reference price barely moved your internal valuation; you stayed anchored to your own estimate.':delta>0?'The high reference price increased how much the product felt worth to you.':'Seeing the commercial framing actually reduced your willingness to pay.';
      commitDecision({round:2,title:'The price tag',concepts:['Anchoring','Reference prices','Willingness to pay'],choiceSummary:`Before the price tag you valued Nova Pro at ${money(base)}. After seeing “₹14,999 → ₹8,999”, your valuation was ${money(r)}.`,personalityText:person,data:{baseWtp:base,revisedWtp:r,delta,buy}}, {headline:buy?'You bought the headphones.':'You walked away.',copy:buy?`₹8,999 left your cash balance. Your internal valuation was ${money(r)}, so the purchase still felt acceptable to you.`:`Even with the large “discount” framing, ₹8,999 stayed above your personal valuation.`,deltas:[{label:'Initial valuation',value:money(base)},{label:'After framing',value:money(r),type:delta>0?'positive':delta<0?'negative':''},{label:'Cash impact',value:buy?'-₹8,999':'₹0',type:buy?'negative':''}]});
    });
  }

  // 3 — Cafe strategy
  function roundCafe(){
    const price=clamp(state.temp.cafePrice??210,100,320), marketing=clamp(state.temp.marketing??70000,0,200000);
    scenarioShell({tag:'03 · MARKET STRATEGY',title:'You just opened a café beside an established rival.',copy:'Customers compare price and visibility. Each cup costs you about ₹85 to serve, and your rival can react after seeing your launch strategy. Lower prices may win volume; heavier marketing may win attention; both can hurt profit.',facts:[['Unit cost','₹85 per cup'],['Demand pool','Large but price-sensitive'],['Rival','Reacts after you commit'],['Decision period','1 month']],accent:'lime',visual:storyVisual('1,200','POTENTIAL DAILY CUSTOMERS','lime'),prompt:'Choose your selling price and monthly marketing spend. The simulation will estimate demand, market share and profit after the rival responds.',controls:rangeControl({id:'cafePrice',label:'Coffee price',min:100,max:320,step:5,value:price,format:money,left:'₹100 · aggressive',right:'₹320 · premium'})+rangeControl({id:'marketing',label:'Marketing budget',min:0,max:200000,step:5000,value:marketing,format:money,left:'₹0',right:'₹2,00,000'})});
    const live=()=>{const p=Number($('#cafePrice').value),m=Number($('#marketing').value);const margin=Math.max(0,p-85);$('#liveHint').textContent=`Gross margin before marketing: ${money(margin)} per cup · marketing commitment ${money(m)}.`;};
    bindRange('cafePrice',money,x=>{state.temp.cafePrice=x;live();});bindRange('marketing',money,x=>{state.temp.marketing=x;live();});
    lockSubmit(()=>{
      const p=clamp(Number($('#cafePrice').value),100,320),m=clamp(Number($('#marketing').value),0,200000),rnd=seeded(31);
      const rival=clamp(Math.round(235+(rnd-.5)*45-(p<180?18:0)),145,300);
      const demand=Math.max(80,Math.round(720-2.0*(p-200)+m/650-1.7*(p-rival)+(rnd-.5)*90));
      const profit=Math.round(demand*(p-85)*30-m); const share=clamp(50+(rival-p)*.18+m/9000-8,12,82);
      state.world.cash=Math.max(0,state.world.cash+profit); state.world.businessValue=Math.max(150000,state.world.businessValue+Math.max(0,profit)*4); state.world.reputation=clamp(state.world.reputation+m/50000+Math.max(0,share-50)/20,0,100);
      const competitive=clamp(50+(rival-p)*.25+m/5000,0,100); addEvidence('competitive',competitive,1.7); addEvidence('risk',clamp(m/2000,0,100),.45);
      const personality=competitive>70?'You were willing to spend margin and marketing resources to pressure the rival and grow share.':competitive<35?'You protected economics and avoided an expensive fight for market share.':'You balanced market-share ambition with unit economics.';
      commitDecision({round:3,title:'The café launch',concepts:['Demand elasticity','Oligopoly','Strategic interdependence','Profit vs market share'],choiceSummary:`You charged ${money(p)} and spent ${money(m)} on marketing. Your rival responded at ${money(rival)}.`,personalityText:personality,data:{price:p,marketing:m,rival,demand,profit,share}}, {headline:profit>=0?'Your café finished profitable.':'Growth got expensive.',copy:`The rival priced at ${money(rival)}. Your strategy produced about ${demand.toLocaleString('en-IN')} cups/day, ${share.toFixed(0)}% simulated share and monthly profit of ${money(profit)}.`,deltas:[{label:'Market share',value:pct(share),type:share>50?'positive':''},{label:'Monthly profit',value:money(profit),type:profit>=0?'positive':'negative'},{label:'Rival price',value:money(rival)}]});
    });
  }

  // 4 — sunk cost
  function roundSunk(){
    const v=clamp(state.temp.sunkSpend??100000,0,300000);
    scenarioShell({tag:'04 · CAPITAL ALLOCATION',title:'A project you backed is in trouble.',copy:'The ₹6,00,000 already spent cannot be recovered. New research now values the finished feature at only about ₹2,00,000, while completing all remaining work could require another ₹3,00,000. Partial work may recover only a small amount.',facts:[['Already spent','₹6,00,000 · unrecoverable'],['Estimated future value','≈ ₹2,00,000'],['Maximum remaining cost','₹3,00,000'],['Alternative','Stop and preserve cash']],accent:'rose',visual:storyVisual('₹6,00,000','PAST SPEND CANNOT BE UNDONE','rose'),prompt:'Ignore what you wish had happened. How much new money are you willing to commit from this point forward?',controls:rangeControl({id:'sunkSpend',label:'Additional investment',min:0,max:300000,step:10000,value:v,format:money,left:'₹0 · stop now',right:'₹3,00,000 · complete it'})});
    bindRange('sunkSpend',money,x=>{state.temp.sunkSpend=x;$('#liveHint').textContent=x>200000?'Your new commitment now exceeds the project’s estimated future value.':x===0?'You would stop immediately and redirect the remaining capital.':'You are willing to fund part of the remaining work, but not necessarily all of it.';});
    lockSubmit(()=>{
      const inv=clamp(Number($('#sunkSpend').value),0,300000), completed=inv>=250000, recovered=completed?200000:Math.round(inv*.25);
      state.world.cash=Math.max(0,state.world.cash-inv+recovered); state.world.businessValue+=completed?150000:0;
      const resistance=100-inv/300000*100; addEvidence('sunk',resistance,2); addEvidence('value',resistance, .4);
      const personality=inv<70000?'You were willing to abandon a prior commitment quickly when new evidence weakened its future economics.':inv<=200000?'Past investment mattered, but you capped how much more you were willing to risk.':'You continued funding the project even after the remaining spend approached or exceeded its estimated future value.';
      commitDecision({round:4,title:'The failing project',concepts:['Sunk-cost fallacy','Marginal analysis','Opportunity cost'],choiceSummary:`After ₹6,00,000 had already been spent, you committed another ${money(inv)}.`,personalityText:personality,data:{additional:inv,completed,recovered}}, {headline:completed?'You finished the feature.':'You limited the damage.',copy:completed?`The feature shipped, but the current expected value only recovered about ${money(recovered)} against your new commitment.`:`You stopped or limited further spending. A small amount of work was salvaged, but the original ₹6,00,000 remained unrecoverable.`,deltas:[{label:'New spend',value:`-${money(inv)}`,type:inv?'negative':''},{label:'Recovered value',value:money(recovered),type:'positive'},{label:'Net new impact',value:money(recovered-inv),type:recovered-inv>=0?'positive':'negative'}]});
    });
  }

  // 5 — time preference
  function roundTime(){
    const v=clamp(state.temp.futureNeed??62000,50000,90000);
    scenarioShell({tag:'05 · TIME',title:'₹50,000 today — or a guaranteed amount one year later?',copy:'There is no default risk: both payments are certain. Your task is to find the future amount that would make waiting exactly worthwhile for you.',facts:[['Take-now option','₹50,000 today'],['Future payment','Guaranteed'],['Waiting period','12 months'],['What you set','Your indifference point']],accent:'cyan',visual:storyVisual('12 months','CERTAINTY ON BOTH SIDES','cyan'),prompt:'Move the slider to the smallest guaranteed amount one year from now that would make you choose waiting over ₹50,000 today.',controls:rangeControl({id:'futureNeed',label:'Minimum future amount required',min:50000,max:90000,step:500,value:v,format:money,left:'₹50,000 · willing to wait for no premium',right:'₹90,000 · need a large premium'})});
    bindRange('futureNeed',money,x=>{state.temp.futureNeed=x;const annual=(x/50000-1)*100;$('#liveHint').textContent=`Your implied one-year premium for waiting is ${annual.toFixed(1)}%.`;});
    lockSubmit(()=>{
      const future=clamp(Number($('#futureNeed').value),50000,90000), premium=(future/50000-1)*100, patience=100-(future-50000)/40000*100;
      addEvidence('patience',patience,2);
      const personality=premium<15?'You required only a modest premium to delay consumption for a full year.':premium<40?'You value both immediacy and future payoff; waiting needs to be meaningfully rewarded.':'Immediate access carried a large premium for you.';
      commitDecision({round:5,title:'Money across time',concepts:['Time preference','Discounting'],choiceSummary:`You would wait one year only once the guaranteed future payment reached ${money(future)} — a ${premium.toFixed(1)}% premium over ₹50,000 today.`,personalityText:personality,data:{future,premium,patience}}, {headline:'Your crossover point is set.',copy:`For you, ${money(future)} in one year is roughly where waiting becomes worth giving up ₹50,000 today.`,deltas:[{label:'Today',value:'₹50,000'},{label:'Your future threshold',value:money(future)},{label:'Required premium',value:pct(premium,1)}]});
    });
  }

  // 6 — Herding, two-stage
  function roundHerd(){
    if(!state.temp.herdStage){
      const a=clamp(state.temp.initialAlloc??25,0,100);
      scenarioShell({tag:'06 · MARKETS',title:'A hot stock lands on your radar.',copy:'Aurora Tech could grow quickly, but its valuation is uncertain and the stock is volatile. Analysts disagree, so there is no clear consensus signal yet. You have ₹2,00,000 available for this decision.',facts:[['Capital available','₹2,00,000'],['Growth outlook','High potential'],['Volatility','Medium–high'],['Analyst view','Split']],accent:'violet',visual:storyVisual('Aurora','MAKE A PRIVATE VIEW FIRST','violet'),prompt:'Before you learn what friends or other players are doing, choose how much of this ₹2,00,000 you would allocate to Aurora.',controls:rangeControl({id:'initialAlloc',label:'Allocation to Aurora',min:0,max:100,step:1,value:a,format:x=>`${x}%`,left:'0% · no position',right:'100% · fully concentrated'}),button:'Lock initial view'});
      bindRange('initialAlloc',x=>`${x}%`,x=>{state.temp.initialAlloc=x;$('#liveHint').textContent=`That is ${money(200000*x/100)} of your investable capital.`;});
      lockSubmit(()=>{state.temp.initialAlloc=clamp(Number($('#initialAlloc').value),0,100);state.temp.herdStage=1;submissionLocked=false;roundHerd();});return;
    }
    const initial=clamp(state.temp.initialAlloc,0,100), revised=clamp(state.temp.revisedAlloc??initial,0,100);
    scenarioShell({tag:'06 · MARKETS',title:'Then the crowd arrives.',copy:'You now learn that 82% of players bought Aurora, and three friends mention strong gains last year. Crucially, the company’s revenue outlook, valuation and business fundamentals have not changed since your first decision.',facts:[['Peer participation','82% invested'],['Friend anecdotes','≈ 24% last year'],['Fundamentals','Unchanged'],['Your first allocation',`${initial}%`]],accent:'lime',visual:storyVisual('82%','POPULARITY CHANGED · FUNDAMENTALS DID NOT','lime'),prompt:'Keep your original view or revise it after seeing the popularity signal.',substep:`Your private-information allocation was ${initial}%.`,controls:rangeControl({id:'revisedAlloc',label:'Final allocation to Aurora',min:0,max:100,step:1,value:revised,format:x=>`${x}%`,left:'0% · avoid it',right:'100% · fully concentrated'}),button:'Finalize allocation'});
    bindRange('revisedAlloc',x=>`${x}%`,x=>{state.temp.revisedAlloc=x;const d=x-initial;$('#liveHint').textContent=d===0?'You kept your original view.':`The crowd shifted your allocation ${d>0?'up':'down'} by ${Math.abs(d)} percentage points.`;});
    lockSubmit(()=>{
      const final=clamp(Number($('#revisedAlloc').value),0,100),delta=final-initial,independence=100-clamp(Math.abs(delta)*2.5,0,100),avg=(initial+final)/2;
      addEvidence('independence',independence,2); addEvidence('risk',avg, .8);
      const ret=seeded(61)>.55?.18:-.12, invested=200000*final/100,pnl=invested*ret;state.world.portfolio=Math.max(0,state.world.portfolio+pnl);
      const personality=Math.abs(delta)<=5?'Social proof barely changed your position; you relied primarily on your own initial assessment.':delta>5?'The popularity signal increased your exposure despite unchanged fundamentals.':'The crowd made you more cautious rather than more enthusiastic.';
      commitDecision({round:6,title:'The popular investment',concepts:['Herd behaviour','Social proof','Information cascades'],choiceSummary:`You initially allocated ${initial}% to Aurora. After seeing strong social proof, you finished at ${final}% (${delta>=0?'+':''}${delta} pts).`,personalityText:personality,data:{initial,final,delta,return:ret,pnl}}, {headline:ret>0?'Aurora rallied.':'Aurora pulled back.',copy:`Over the simulated period Aurora returned ${pct(ret*100)}. Your final allocation created a portfolio impact of ${money(pnl)}.`,deltas:[{label:'Final allocation',value:`${final}%`},{label:'Aurora return',value:pct(ret*100),type:ret>0?'positive':'negative'},{label:'Portfolio impact',value:money(pnl),type:pnl>=0?'positive':'negative'}]});
    });
  }

  // 7 — Public good
  function roundPublic(){
    const c=clamp(state.temp.contrib??3000,0,10000);
    scenarioShell({tag:'07 · COLLECTIVE ACTION',title:'Your neighborhood is ₹4,000 short of a public park.',copy:'Twenty residents will all enjoy the park if total funding reaches ₹50,000, including people who contribute nothing. Others have already pledged ₹46,000. Your pledge is charged only if the threshold is reached.',facts:[['Funding target','₹50,000'],['Already pledged','₹46,000'],['Gap remaining','₹4,000'],['Benefit','Shared by all residents']],accent:'lime',visual:storyVisual('₹46,000','₹4,000 MORE BUILDS THE PARK','lime'),prompt:'Choose how much of your own money you are willing to pledge, knowing that everyone receives the benefit if the park is funded.',controls:rangeControl({id:'contrib',label:'Your contribution',min:0,max:10000,step:250,value:c,format:money,left:'₹0 · contribute nothing',right:'₹10,000 · contribute heavily'})});
    bindRange('contrib',money,x=>{state.temp.contrib=x;$('#liveHint').textContent=x>=4000?'Your contribution is enough to push the park over its funding threshold.':`The group would still be ${money(4000-x)} short unless someone else adds more.`;});
    lockSubmit(()=>{
      const c=clamp(Number($('#contrib').value),0,10000),funded=46000+c>=50000;if(funded){state.world.cash=Math.max(0,state.world.cash-c);state.world.wellbeing=clamp(state.world.wellbeing+7,0,100);state.world.reputation=clamp(state.world.reputation+c/1400,0,100);state.world.socialImpact=clamp(state.world.socialImpact+10,0,100);} addEvidence('social',c/10000*100,1.8);
      const personality=c===0?'You relied entirely on others to fund a benefit you would still receive.':c<4000?'You contributed something, but stopped short of personally closing the funding gap.':c<=6000?'You were willing to absorb a private cost to ensure the shared project happened.':'You contributed well beyond the minimum needed to secure the collective outcome.';
      commitDecision({round:7,title:'The public park',concepts:['Public goods','Free-rider problem','Collective action'],choiceSummary:`With the community at ₹46,000 of ₹50,000, you contributed ${money(c)}.`,personalityText:personality,data:{contribution:c,funded}}, {headline:funded?'The park gets built.':'The park remains unfunded.',copy:funded?'Your contribution pushed the project over the line. Every resident receives the benefit, including those who paid nothing.':'The group remained below the threshold. Everyone keeps their contribution, but the shared project does not happen.',deltas:[{label:funded?'Your contribution':'Your pledge',value:money(c),type:funded&&c?'negative':''},{label:'Final funding',value:money(46000+c),type:funded?'positive':'negative'},{label:'Community outcome',value:funded?'Park built':'No park'}]});
    });
  }

  // 8 — externality
  function roundExternality(){
    const prod=clamp(state.temp.prod??70,20,100), clean=clamp(state.temp.clean??40,0,100);
    scenarioShell({tag:'08 · EXTERNALITIES',title:'Your factory can earn more by producing more — but the river absorbs the damage.',copy:'Production raises revenue. Pollution treatment costs money, but it removes part of the environmental damage and protects reputation. Severe untreated pollution also creates simulated regulatory and reputational costs.',facts:[['Production','Raises revenue and emissions'],['Treatment','Costs money but cuts pollution'],['High pollution','Can trigger extra costs'],['Who bears harm','The nearby community too']],accent:'rose',visual:storyVisual('🏭 → 🌊','PRIVATE PROFIT · SHARED CONSEQUENCES','rose'),prompt:'Choose both how hard the factory runs and how much of its potential pollution you pay to treat.',controls:rangeControl({id:'prod',label:'Production intensity',min:20,max:100,step:1,value:prod,format:x=>`${x}%`,left:'20% · low output',right:'100% · maximum output'})+rangeControl({id:'clean',label:'Pollution treatment',min:0,max:100,step:1,value:clean,format:x=>`${x}%`,left:'0% · no treatment',right:'100% · full treatment'})});
    const live=()=>{const p=Number($('#prod').value),c=Number($('#clean').value),poll=p*(100-c)/100;$('#liveHint').textContent=`Estimated untreated pollution index: ${poll.toFixed(0)} / 100. Cleanup is reducing ${c}% of potential emissions.`;};
    bindRange('prod',x=>`${x}%`,x=>{state.temp.prod=x;live();});bindRange('clean',x=>`${x}%`,x=>{state.temp.clean=x;live();});
    lockSubmit(()=>{
      const p=clamp(Number($('#prod').value),20,100),c=clamp(Number($('#clean').value),0,100),poll=p*(100-c)/100;
      const revenue=p*18000,cost=350000+p*4500+c*5200,penalty=poll>45?(poll-45)*8500:0,profit=Math.round(revenue-cost-penalty);
      state.world.cash=Math.max(0,state.world.cash+profit);state.world.businessValue=Math.max(0,state.world.businessValue+Math.max(profit,0)*1.5);state.world.socialImpact=clamp(state.world.socialImpact+c*.22-poll*.28,0,100);state.world.reputation=clamp(state.world.reputation+c*.08-poll*.1,0,100);
      const social=clamp(c*.75+(100-poll)*.25,0,100);addEvidence('social',social,2);addEvidence('competitive',p,.35);
      const personality=c<25&&p>70?'You prioritized private output and profit while accepting substantial external impact.':c>70?'You accepted a meaningful private cleanup cost to reduce harm beyond the firm.':'You tried to balance production economics with treatment rather than maximizing either extreme.';
      commitDecision({round:8,title:'The factory and the river',concepts:['Negative externalities','Social cost','Pigouvian incentives'],choiceSummary:`You ran production at ${p}% and treated ${c}% of potential pollution.`,personalityText:personality,data:{production:p,cleanup:c,pollution:poll,profit,penalty}}, {headline:profit>=0?'The factory made money.':'The economics tightened.',copy:`Your pollution index ended at ${poll.toFixed(0)}. ${penalty>0?`Because untreated pollution was high, the simulation imposed ${money(penalty)} of regulatory/reputation cost.`:'Your treatment level kept simulated externality penalties limited.'}`,deltas:[{label:'Operating profit',value:money(profit),type:profit>=0?'positive':'negative'},{label:'Pollution index',value:poll.toFixed(0),type:poll>45?'negative':'positive'},{label:'Externality cost',value:money(penalty),type:penalty?'negative':''}]});
    });
  }

  // 9 — crash
  function roundCrash(){
    const a=clamp(state.temp.crashAction??0,-100,100);
    scenarioShell({tag:'09 · LOSS & UNCERTAINTY',title:'Markets fall 28% in six weeks.',copy:'Your portfolio is already down sharply, and the next move is genuinely uncertain. Buying uses up to ₹2,00,000 of available cash; selling converts the chosen percentage of your current portfolio into cash. Holding changes nothing.',facts:[['Recent drawdown','−28%'],['If you buy','Uses available cash'],['If you sell','Moves portfolio to cash'],['Next period','Uncertain']],accent:'rose',visual:storyVisual('-28%','NO ONE KNOWS THE NEXT MOVE','rose'),prompt:'Choose your rebalance. Move left to buy more after the fall, stay at zero to hold, or move right to sell part of your portfolio.',controls:rangeControl({id:'crashAction',label:'Rebalance after the crash',min:-100,max:100,step:1,value:a,format:x=>x<0?`Buy ${Math.abs(x)}% more`:x>0?`Sell ${x}%`:'Hold',left:'Buy more',right:'Sell more'})});
    bindRange('crashAction',x=>x<0?`Buy ${Math.abs(x)}% more`:x>0?`Sell ${x}%`:'Hold',x=>{state.temp.crashAction=x;$('#liveHint').textContent=x<0?'You are increasing exposure after a large loss.':x>0?'You are reducing exposure after the drawdown.':'You are leaving the portfolio unchanged.';});
    lockSubmit(()=>{
      const a=clamp(Number($('#crashAction').value),-100,100),before=state.world.portfolio;let trade=0;
      if(a>0){trade=before*a/100;state.world.portfolio-=trade;state.world.cash+=trade;}
      else if(a<0){trade=Math.min(state.world.cash,200000)*Math.abs(a)/100;state.world.cash-=trade;state.world.portfolio+=trade;}
      const nextRet=seeded(91)>.5?.16:-.08,pnl=state.world.portfolio*nextRet;state.world.portfolio=Math.max(0,state.world.portfolio+pnl);state.world.wellbeing=clamp(state.world.wellbeing-Math.abs(a)*.02+(a===0?1:0),0,100);
      const risk=clamp(50-a/2,0,100),loss=clamp(50+a/2,0,100);addEvidence('risk',risk,2);addEvidence('loss',loss,2);
      const personality=a>45?'The drawdown pushed you strongly toward protecting remaining value.':a>10?'You reduced risk after the loss, but kept meaningful exposure.':a>=-10?'You largely stayed with the existing allocation despite uncertainty.':a>=-50?'You treated lower prices as an opportunity and increased exposure moderately.':'You responded to the loss by buying aggressively, showing very high tolerance for further downside.';
      commitDecision({round:9,title:'The market crash',concepts:['Loss aversion','Prospect theory','Ambiguity','Rebalancing'],choiceSummary:a<0?`After a 28% drawdown, you increased exposure by ${Math.abs(a)}% of your available buying budget.`:a>0?`After a 28% drawdown, you sold ${a}% of your portfolio.`:'After a 28% drawdown, you held your allocation unchanged.',personalityText:personality,data:{action:a,trade,nextReturn:nextRet,pnl}}, {headline:nextRet>0?'Markets partially recovered.':'Markets fell again.',copy:`After your rebalance, the next simulated period returned ${pct(nextRet*100)}. Your action changed both how much downside you carried and how much recovery you captured.`,deltas:[{label:'Your action',value:a<0?`Buy ${Math.abs(a)}%`:a>0?`Sell ${a}%`:'Hold'},{label:'Next-period return',value:pct(nextRet*100),type:nextRet>0?'positive':'negative'},{label:'Portfolio impact',value:money(pnl),type:pnl>=0?'positive':'negative'}]});
    });
  }

  function closestArchetype(sc){
    let best=null,bestDist=Infinity;
    for(const a of ARCHETYPES){let d=0;for(const k of Object.keys(TRAITS)){const diff=(sc[k]-a.ideal[k])/100;d+=diff*diff;}if(d<bestDist){bestDist=d;best=a;}}
    return best;
  }

  function finishSimulation(){
    if(!state.completed){state.completed=true;state.completedAt=new Date().toISOString();saveState();const sc=scores(),arch=closestArchetype(sc);track('complete',{scores:sc,personalityType:arch.name,world:state.world,decisions:state.decisions,completedAt:state.completedAt}).catch(()=>{});}
    showResults();
  }

  function showResults(){
    showView(result); $('#restartBtn').hidden=false;
    const sc=scores(),arch=closestArchetype(sc);
    $('#resultName').textContent=`${state.name}, your decision personality is`;
    $('#archetypeTitle').textContent=`${arch.icon} ${arch.name}`;
    $('#archetypeBlurb').textContent=arch.blurb;
    $('#profileCode').textContent=`R${sc.risk}·P${sc.patience}·I${sc.independence}`;
    $('#traitGrid').innerHTML=Object.entries(TRAITS).map(([k,label])=>{const v=sc[k],c=traitConfidence(k);return `<article class="trait-card"><header><h3>${label}</h3><div class="trait-score">${v}</div></header><div class="trait-bar"><i style="--score:${v}%"></i></div><div class="trait-meta"><span>${bandLabel(v)}</span><span>${c}% confidence</span></div><p style="color:var(--muted);font-size:13px;line-height:1.5;margin:12px 0 0">${traitCopy[k][band(v)]}</p></article>`;}).join('');
    const w=state.world;$('#finalWorld').innerHTML=[['Cash',money(w.cash)],['Portfolio',money(w.portfolio)],['Business',money(w.businessValue)],['Reputation',Math.round(w.reputation)+'/100'],['Social impact',Math.round(w.socialImpact)+'/100']].map(([k,v])=>`<div class="final-stat"><span>${k}</span><b>${v}</b></div>`).join('');
    $('#decisionReport').innerHTML=state.decisions.map((d,i)=>`<article class="report-item"><button type="button" aria-expanded="false"><span class="report-num">${String(i+1).padStart(2,'0')}</span><span class="report-title"><b>${d.title}</b><span>${d.choiceSummary}</span></span><span class="chev">⌄</span></button><div class="report-body"><p><strong>What your choice suggests</strong><br>${d.personalityText}</p><p><strong>The economics</strong><br>${conceptExplanation(d.concepts)}</p><div>${d.concepts.map(c=>`<span class="concept-chip">${c}</span>`).join('')}</div></div></article>`).join('');
    $$('.report-item button').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.report-item'),open=item.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));}));
  }

  function $$(s,root=document){return [...root.querySelectorAll(s)];}

  function conceptExplanation(concepts){
    const map={
      'Expected utility':'Expected utility describes how people choose between uncertain outcomes based on both payoff and personal tolerance for risk.',
      'Risk–return trade-off':'Potentially higher returns usually require accepting more uncertainty or downside.',
      'Anchoring':'Anchoring occurs when an initial reference number changes later judgments, even when it should not change the underlying value.',
      'Reference prices':'A displayed “original” price can alter how attractive a current price feels by changing the comparison point.',
      'Willingness to pay':'Willingness to pay is the maximum price at which a buyer still values the product more than the money they give up.',
      'Demand elasticity':'Elasticity measures how strongly quantity demanded responds when price changes.',
      'Oligopoly':'In an oligopoly, a small number of firms interact strategically; one firm’s decision changes the incentives of its rivals.',
      'Strategic interdependence':'Your best move depends partly on how competitors are likely to react.',
      'Profit vs market share':'Growing share can destroy value if the acquisition cost or price cuts required exceed the contribution from new customers.',
      'Sunk-cost fallacy':'A sunk cost is already unrecoverable. Rational future decisions should depend on future costs and benefits, not money already spent.',
      'Marginal analysis':'Marginal analysis compares the additional benefit of one more unit of action with its additional cost.',
      'Opportunity cost':'The true cost of a choice includes the best alternative use of the resources you commit.',
      'Time preference':'Time preference captures how much people value consumption now relative to consumption later.',
      'Present bias':'Present bias is an extra preference for immediate rewards beyond standard long-term discounting.',
      'Discounting':'Discounting converts future value into an equivalent value today.',
      'Herd behaviour':'Herd behaviour occurs when people move toward the crowd’s action, sometimes even without new fundamental information.',
      'Social proof':'Social proof makes an option feel more credible or attractive because many other people chose it.',
      'Information cascades':'A cascade can form when people infer information from others’ actions and stop relying as heavily on their own private signal.',
      'Public goods':'Public goods create benefits that are difficult to exclude non-payers from, which can weaken individual incentives to contribute.',
      'Free-rider problem':'A free rider receives a shared benefit without paying a corresponding share of its cost.',
      'Collective action':'Collective action problems arise when individually rational choices can fail to produce a beneficial group outcome.',
      'Negative externalities':'A negative externality is a cost imposed on third parties that is not fully reflected in the private market transaction.',
      'Social cost':'Social cost equals private cost plus costs imposed on other people or society.',
      'Pigouvian incentives':'Taxes or prices on harmful externalities can push private decision-makers to internalize part of the social cost.',
      'Loss aversion':'Loss aversion describes the tendency for losses to feel more consequential than equivalent gains.',
      'Prospect theory':'Prospect theory models choices relative to gains and losses around a reference point rather than only final wealth.',
      'Ambiguity':'Ambiguity is uncertainty where probabilities or future states are not known precisely.',
      'Rebalancing':'Rebalancing changes portfolio weights after market movements to restore or deliberately alter risk exposure.'
    };
    return concepts.map(c=>map[c]).filter(Boolean).join(' ');
  }

  function cardPalette(arch){
    if(arch.name.includes('Bold'))return ['#ff6b6b','#f7b733'];
    if(arch.name.includes('Security'))return ['#2563eb','#22d3ee'];
    if(arch.name.includes('Cooperative'))return ['#10b981','#84cc16'];
    if(arch.name.includes('Contrarian'))return ['#7c3aed','#ec4899'];
    if(arch.name.includes('Opportunist'))return ['#f59e0b','#fb7185'];
    return ['#8b5cf6','#22d3ee'];
  }

  async function makeReportCard(){
    const canvas=$('#reportCanvas'),ctx=canvas.getContext('2d'),sc=scores(),arch=closestArchetype(sc),[a,b]=cardPalette(arch);
    const grad=ctx.createLinearGradient(0,0,1080,1350);grad.addColorStop(0,'#070b16');grad.addColorStop(.55,'#11182b');grad.addColorStop(1,'#070b16');ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1350);
    const glow=ctx.createRadialGradient(850,180,0,850,180,620);glow.addColorStop(0,a+'66');glow.addColorStop(1,'#00000000');ctx.fillStyle=glow;ctx.fillRect(0,0,1080,800);
    ctx.fillStyle='#ffffff';ctx.font='800 34px system-ui, sans-serif';ctx.fillText('MARKETMIND',72,90);
    ctx.fillStyle='#96a3c5';ctx.font='700 21px system-ui, sans-serif';ctx.fillText('ECONOMIC DECISION PROFILE',72,138);
    ctx.fillStyle='#ffffff';ctx.font='800 28px system-ui, sans-serif';ctx.fillText(`${state.name.toUpperCase()}'S DECISION PERSONALITY`,72,240);
    ctx.fillStyle=a;ctx.font='900 70px system-ui, sans-serif';wrapText(ctx,`${arch.icon} ${arch.name.toUpperCase()}`,72,335,920,78);
    ctx.fillStyle='#b7c0d7';ctx.font='500 27px system-ui, sans-serif';wrapText(ctx,arch.blurb,72,505,910,42);
    const ordered=Object.entries(TRAITS).sort((x,y)=>sc[y[0]]-sc[x[0]]).slice(0,6);let y=720;
    ordered.forEach(([k,label],i)=>{const v=sc[k];ctx.fillStyle='#dfe5f5';ctx.font='700 24px system-ui, sans-serif';ctx.fillText(label,72,y);ctx.fillStyle='#27334f';roundRect(ctx,340,y-20,560,18,9,true);const g=ctx.createLinearGradient(340,0,900,0);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;roundRect(ctx,340,y-20,560*v/100,18,9,true);ctx.fillStyle='#ffffff';ctx.font='900 24px system-ui, sans-serif';ctx.textAlign='right';ctx.fillText(String(v),960,y);ctx.textAlign='left';y+=72;});
    ctx.fillStyle='#96a3c5';ctx.font='600 20px system-ui, sans-serif';ctx.fillText('Strongest signal',72,1195);ctx.fillStyle='#ffffff';ctx.font='900 30px system-ui, sans-serif';ctx.fillText(ordered[0][1],72,1238);ctx.fillStyle='#96a3c5';ctx.font='600 18px system-ui, sans-serif';ctx.textAlign='right';ctx.fillText('Play yours at MarketMind',1000,1238);ctx.textAlign='left';
    return new Promise(resolve=>canvas.toBlob(resolve,'image/png',.95));
  }
  function roundRect(ctx,x,y,w,h,r,fill){if(w<0)w=0;r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();if(fill)ctx.fill();}
  function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=text.split(' ');let line='';for(let n=0;n<words.length;n++){const test=line+words[n]+' ';if(ctx.measureText(test).width>maxWidth&&n>0){ctx.fillText(line,x,y);line=words[n]+' ';y+=lineHeight;}else line=test;}ctx.fillText(line,x,y);return y;}

  async function downloadCard(){ const blob=await makeReportCard(); if(!blob)return; const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`MarketMind-${state.name.replace(/[^a-z0-9]+/gi,'-')}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  async function shareCard(){
    const blob=await makeReportCard(); const file=blob?new File([blob],`MarketMind-${state.name}.png`,{type:'image/png'}):null; const arch=closestArchetype(scores()); const text=`I got ${arch.name} ${arch.icon} on MarketMind. What does the way you make economic decisions say about you?`;
    try{if(file&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:'My MarketMind profile',text,files:[file]});}else if(navigator.share){await navigator.share({title:'My MarketMind profile',text,url:location.origin});}else{await navigator.clipboard.writeText(`${text} ${location.origin}`);alert('Share text copied.');}}catch(err){if(err&&err.name!=='AbortError')console.error(err);}
  }
  async function shareChallenge(){const text=`I just played MarketMind — it predicts your economic decision personality from a simulation, not a quiz. Try it and compare with me.`;try{if(navigator.share)await navigator.share({title:'Try MarketMind',text,url:location.origin});else{await navigator.clipboard.writeText(`${text} ${location.origin}`);alert('Challenge link copied.');}}catch(err){if(err&&err.name!=='AbortError')console.error(err);}}

  async function track(action,payload){
    const body={action,sessionId:state.sessionId,name:state.name,seed:state.seed,...payload};
    const res=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true});
    if(!res.ok&&res.status!==204)throw new Error(`Tracking failed: ${res.status}`);
  }

  function startGame(name){
    state.name=safeText(name).slice(0,40);state.started=true;state.startedAt=state.startedAt||new Date().toISOString();saveState();
    track('start',{startedAt:state.startedAt}).catch(()=>{});showView(game);$('#restartBtn').hidden=false;renderRound();
  }

  $('#startForm').addEventListener('submit',e=>{e.preventDefault();const name=safeText($('#nameInput').value),consent=$('#consentInput').checked,error=$('#startError');error.textContent='';if(name.length<2){error.textContent='Please enter at least 2 characters.';return;}if(!consent){error.textContent='Please confirm the privacy consent to start.';return;}startGame(name);});

  $('#restartBtn').addEventListener('click',()=>{if(confirm('Restart MarketMind? Your current local simulation progress will be cleared.')){localStorage.removeItem(STORAGE_KEY);location.href='/';}});
  $('#downloadCardBtn').addEventListener('click',downloadCard);$('#shareCardBtn').addEventListener('click',shareCard);$('#shareChallengeBtn').addEventListener('click',shareChallenge);

  const savedTheme=localStorage.getItem(THEME_KEY);if(savedTheme==='light')document.documentElement.classList.add('light');
  $('#themeBtn').addEventListener('click',()=>{document.documentElement.classList.toggle('light');localStorage.setItem(THEME_KEY,document.documentElement.classList.contains('light')?'light':'dark');});

  if(state.started){$('#nameInput').value=state.name;$('#consentInput').checked=true;if(state.completed){showResults();$('#restartBtn').hidden=false;}else{showView(game);$('#restartBtn').hidden=false;renderRound();}}
})();
