// Programme screen
// Big drag-and-drop slots, a wall of every work in the library (no popout),
// rehearsal allocator + production controls + live forecast rail.

const { useState: useS, useMemo: useM, useRef: useR } = React;

const ERA_LABEL = {
  classical:'Classical',
  romantic:'Romantic',
  'late-romantic':'Late Romantic',
  contemporary:'Contemporary',
};
const ERA_TONE = {
  classical:'silver',
  romantic:'bark',
  'late-romantic':'ember',
  contemporary:'pine',
};
const ERA_HEX = {
  classical:'#b8c0bc',
  romantic:'#8a6b4f',
  'late-romantic':'#c97a4a',
  contemporary:'#5c8a6f',
};

const TOTAL_REHEARSAL = 20;
const ROMAN = ['I','II','III'];
const SECTIONS = ['strings','winds','brass','percussion'];
const SECTION_INITIAL = { strings:'S', winds:'W', brass:'B', percussion:'P' };

function demandTone(v){
  if (v>=70) return 'ember';
  if (v>=45) return 'bark';
  return 'silver';
}

// Forecast — quick illustrative numbers from the current programme ------------
function deriveForecast(prog, works){
  const filled = prog.workIds.map(id=>works.find(w=>w.id===id)).filter(Boolean);
  const isComplete = filled.length === prog.workCount;
  if (!isComplete){
    return {
      isComplete:false,
      attn:null, net:null,
      revenue:0, expenses:0,
      perfRisk:null, audienceFit:null, identityImpact:null,
      sectionStress: { strings:0, winds:0, brass:0, percussion:0 },
      notes:['Drop works into every slot to see the forecast take shape.'],
    };
  }
  const avgDraw = filled.reduce((s,w)=>s+w.draw,0) / filled.length;
  const avgPrestige = filled.reduce((s,w)=>s+w.prestige,0) / filled.length;
  const avgLoad = filled.reduce((s,w)=>s+w.load,0) / filled.length;
  const totalRehearsalNeeded = filled.reduce((s,w)=>s + (w.load / 8), 0); // ~hours
  const allocated = prog.rehearsalAllocation.slice(0, prog.workCount).reduce((a,b)=>a+b,0);
  const rehearsalGap = Math.max(0, totalRehearsalNeeded - allocated);

  const attn = Math.round( (avgDraw * 22) + (avgPrestige * 5) + (prog.marketingSpend / 220) - (prog.ticketPrice - 60) * 8 );
  const cappedAttn = Math.max(400, Math.min(2200, attn));
  const revenue = Math.round(cappedAttn * prog.ticketPrice);
  const expenses = 48000 + Math.round(allocated * 850) + prog.marketingSpend;
  const net = revenue - expenses;

  const perfRisk = Math.max(0, Math.min(100, Math.round(avgLoad * 0.55 + rehearsalGap * 6 - avgPrestige*0.15) ));
  const audienceFit = Math.max(0, Math.min(100, Math.round(avgDraw * 0.85 + avgPrestige * 0.2 - (prog.ticketPrice-50)*0.4) ));
  const identityImpact = Math.max(0, Math.min(100, Math.round( filled.reduce((s,w)=>s + (w.era==='contemporary'?22:w.era==='classical'?8:14), 0) )));

  const sectionStress = SECTIONS.reduce((acc,sec)=>{
    const demand = filled.reduce((s,w)=>s + (w.demands?.[sec] ?? 0), 0) / filled.length;
    acc[sec] = Math.round(demand);
    return acc;
  }, {});

  const notes = [];
  if (rehearsalGap > 1) notes.push(`Rehearsal short by ~${rehearsalGap.toFixed(1)}h.`);
  if (perfRisk > 55) notes.push('Performance risk high — heavy programme.');
  if (audienceFit < 40) notes.push('Audience draw weak — consider a familiar piece.');
  if (identityImpact > 60) notes.push('Strong identity move — contemporary forward.');
  if (notes.length===0) notes.push('Balanced programme — within institution\u2019s reach.');

  return { isComplete:true, attn:cappedAttn, net, revenue, expenses, perfRisk, audienceFit, identityImpact, sectionStress, notes, rehearsalNeeded:totalRehearsalNeeded, rehearsalAllocated:allocated };
}

// Big slot --------------------------------------------------------------------
function Slot({ idx, work, prog, forecast, onDropWork, onClear, onSlotDrag }){
  const [dragOver, setDragOver] = useS(false);

  function handleDragOver(e){ e.preventDefault(); setDragOver(true); }
  function handleDragLeave(){ setDragOver(false); }
  function handleDrop(e){
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData('text/work-id') || e.dataTransfer.getData('text/plain');
    const fromSlot = e.dataTransfer.getData('text/from-slot');
    if (fromSlot !== ''){
      onSlotDrag(Number(fromSlot), idx);
    } else if (id) {
      onDropWork(idx, id);
    }
  }

  // when filled, the slot is itself draggable to another slot (swap)
  function handleSlotDragStart(e){
    if (!work) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/work-id', work.id);
    e.dataTransfer.setData('text/from-slot', String(idx));
  }

  const filled = !!work;
  const allocatedHours = prog.rehearsalAllocation[idx];
  const hoursNeeded = work ? Math.round(work.load / 8 * 10) / 10 : null;
  const risk = forecast.isComplete && work
    ? Math.max(0, Math.min(100, Math.round(work.load * 0.6 + (hoursNeeded - allocatedHours) * 6 - work.prestige * 0.18)))
    : null;
  const riskColor = risk == null ? 'var(--silver-dim)' : risk>55 ? 'var(--ember)' : risk>30 ? 'var(--bark)' : 'var(--pine)';

  return (
    <div
      draggable={filled}
      onDragStart={handleSlotDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display:'grid', gridTemplateColumns:'72px 1fr 220px 30px',
        gap:18, alignItems:'center',
        padding:'14px 18px',
        background: dragOver ? 'rgba(184,192,188,0.06)' : filled ? 'rgba(0,0,0,0.18)' : 'transparent',
        border:'1px solid var(--hairline)',
        borderLeft: dragOver ? '3px solid var(--silver)' : filled ? `3px solid ${ERA_HEX[work.era]}` : '1px dashed var(--hairline)',
        position:'relative',
        cursor: filled ? 'grab' : 'default',
        minHeight:110,
      }}
    >
      {/* big roman */}
      <div className="display" style={{
        fontSize:72, lineHeight:0.85, fontStyle:'italic', fontWeight:500,
        color: filled ? 'var(--silver)' : 'var(--silver-dim)', letterSpacing:'-0.02em',
        textAlign:'center'
      }}>{ROMAN[idx]}</div>

      {/* title / placeholder */}
      <div>
        {filled ? (
          <>
            <div className="display" style={{fontSize:24, color:'var(--birch)', fontWeight:500, lineHeight:1.1, letterSpacing:'-0.005em'}}>{work.title}</div>
            <div style={{display:'flex', gap:14, marginTop:6, alignItems:'baseline'}}>
              <span className="serif" style={{fontSize:15, color:'var(--birch-dim)', fontStyle:'italic'}}>{work.composer}</span>
              <span className="num" style={{fontSize:11, color:'var(--silver-dim)'}}>{work.duration}m</span>
              <span className="num" style={{fontSize:9.5, color:`var(--${ERA_TONE[work.era]})`, letterSpacing:'0.16em', textTransform:'uppercase'}}>{ERA_LABEL[work.era]}</span>
            </div>
            {/* section demands */}
            <div style={{display:'flex', gap:10, marginTop:8}}>
              {SECTIONS.map(sec=>{
                const d = work.demands?.[sec] ?? 0;
                return (
                  <div key={sec} style={{display:'flex', alignItems:'center', gap:5}}>
                    <span className="label" style={{fontSize:8}}>{SECTION_INITIAL[sec]}</span>
                    <div style={{width:34, height:3, background:'var(--ink-well)', position:'relative'}}>
                      <div style={{position:'absolute', left:0,top:0,bottom:0, width:`${d}%`, background:`var(--${demandTone(d)})`}}></div>
                    </div>
                    <span className="num" style={{fontSize:9, color:'var(--birch-dim)'}}>{d}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div>
            <div className="serif" style={{fontSize:22, color:'var(--birch-dim)', fontStyle:'italic'}}>— drop a work here —</div>
            <div className="num" style={{fontSize:10, color:'var(--silver-dim)', letterSpacing:'0.18em', marginTop:6}}>
              {idx===0 ? 'CURTAIN\u2011RAISER' : idx===1 ? 'CONCERTO OR ANCHOR' : 'SYMPHONIC ANCHOR'}
            </div>
          </div>
        )}
      </div>

      {/* hours + risk */}
      <div style={{textAlign:'right'}}>
        <div style={{display:'flex', justifyContent:'flex-end', gap:18, alignItems:'baseline'}}>
          <div>
            <div className="eyebrow" style={{fontSize:8}}>Rehearsal</div>
            <div className="display" style={{fontSize:24, color:'var(--birch)', fontWeight:500, lineHeight:1}}>
              {allocatedHours}<span style={{color:'var(--silver-dim)', fontSize:14}}>h</span>
              {hoursNeeded !== null && <span className="num" style={{fontSize:10, color: hoursNeeded>allocatedHours?'var(--ember)':'var(--silver-dim)', marginLeft:4}}>/{hoursNeeded}h</span>}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{fontSize:8}}>Risk</div>
            <div className="display" style={{fontSize:24, color:riskColor, fontWeight:500, lineHeight:1}}>
              {risk == null ? '—' : risk}
            </div>
          </div>
        </div>
      </div>

      {/* clear */}
      <div>
        {filled && (
          <button onClick={(e)=>{e.stopPropagation(); onClear(idx);}} style={{
            background:'transparent', border:'1px solid var(--hairline)',
            color:'var(--silver-dim)', width:22, height:22, cursor:'pointer',
            fontFamily:'var(--mono)', fontSize:10, padding:0
          }}>×</button>
        )}
      </div>
    </div>
  );
}

// Intermission divider --------------------------------------------------------
function IntermissionDivider({ on, onClick }){
  return (
    <div style={{display:'flex', alignItems:'center', gap:10, padding:'4px 0'}}>
      <span style={{flex:1, height:1, background:'var(--hairline)'}}></span>
      <button onClick={onClick} style={{
        background:'transparent', border:`1px solid ${on?'var(--bark)':'var(--hairline)'}`,
        color: on?'var(--bark)':'var(--silver-dim)',
        padding:'4px 12px', cursor:'pointer',
        fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase'
      }}>{on ? '◆ Intermission · 15 min' : '+ Intermission'}</button>
      <span style={{flex:1, height:1, background:'var(--hairline)'}}></span>
    </div>
  );
}

// Library tile ----------------------------------------------------------------
function LibraryTile({ work, used, onClick }){
  function handleDragStart(e){
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/work-id', work.id);
    e.dataTransfer.setData('text/from-slot', '');
    e.dataTransfer.setData('text/plain', work.id);
  }
  return (
    <div
      draggable={!used}
      onDragStart={handleDragStart}
      onClick={used ? undefined : onClick}
      style={{
        padding:'9px 12px',
        background: used ? 'rgba(0,0,0,0.3)' : 'transparent',
        borderLeft:`2px solid ${used?'var(--hairline)':ERA_HEX[work.era]}`,
        borderBottom:'1px solid var(--hairline-soft)',
        opacity: used ? 0.4 : 1,
        cursor: used ? 'not-allowed' : 'grab',
        display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'baseline'
      }}
      title={used ? 'Already in programme' : 'Drag to a slot, or click to drop into the first empty slot'}
    >
      <div style={{minWidth:0}}>
        <div className="num" style={{fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.14em', textTransform:'uppercase'}}>{work.composer}</div>
        <div className="serif" style={{fontSize:14, color: used?'var(--silver-dim)':'var(--birch)', fontStyle:'italic', lineHeight:1.15, marginTop:2, textDecoration: used?'line-through':'none'}}>{work.title}</div>
        <div style={{display:'flex', gap:10, marginTop:4, fontFamily:'var(--mono)', fontSize:9, color:'var(--silver-dim)'}}>
          <span>{work.duration}m</span>
          <span>P{work.prestige}</span>
          <span>D{work.draw}</span>
          <span style={{color: work.load>60?'var(--ember)':'var(--silver-dim)'}}>L{work.load}</span>
        </div>
      </div>
    </div>
  );
}

// Rehearsal allocator ---------------------------------------------------------
function RehearsalAllocator({ alloc, workCount, onChange }){
  const m1 = alloc[0];
  const m2 = m1 + alloc[1];

  function setM1(v){
    const newM1 = Math.max(1, Math.min(workCount===2 ? TOTAL_REHEARSAL-1 : m2-1, v));
    if (workCount===2){
      onChange([newM1, TOTAL_REHEARSAL-newM1, 0]);
    } else {
      onChange([newM1, m2-newM1, TOTAL_REHEARSAL-m2]);
    }
  }
  function setM2(v){
    const newM2 = Math.max(m1+1, Math.min(TOTAL_REHEARSAL-1, v));
    onChange([m1, newM2-m1, TOTAL_REHEARSAL-newM2]);
  }

  return (
    <div style={{padding:'14px 0'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
        <span className="eyebrow">Rehearsal · drag handles</span>
        <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>{TOTAL_REHEARSAL}h total · {workCount} pieces</span>
      </div>
      <div style={{position:'relative', height:24, background:'var(--ink-well)', border:'1px solid var(--hairline-soft)'}}>
        {Array.from({length:workCount}).map((_,i)=>{
          const start = i===0 ? 0 : i===1 ? m1 : m2;
          const end = workCount===2
            ? (i===0 ? m1 : TOTAL_REHEARSAL)
            : (i===0 ? m1 : i===1 ? m2 : TOTAL_REHEARSAL);
          const left = (start/TOTAL_REHEARSAL)*100;
          const width = ((end-start)/TOTAL_REHEARSAL)*100;
          return (
            <div key={i} style={{
              position:'absolute', left:`${left}%`, width:`${width}%`, top:0, bottom:0,
              background: i===0 ? 'rgba(184,192,188,0.18)' : i===1 ? 'rgba(138,107,79,0.22)' : 'rgba(92,138,111,0.20)',
              borderRight: i<workCount-1 ? '1px solid var(--silver)' : 'none',
              display:'grid', placeItems:'center',
              fontFamily:'var(--mono)', fontSize:11, color:'var(--birch)'
            }}>
              <span><span className="serif" style={{fontSize:13, fontStyle:'italic'}}>{ROMAN[i]}</span> · {alloc[i]}h</span>
            </div>
          );
        })}
        {/* draggable markers (range sliders overlaid) */}
        <input type="range" min={1} max={workCount===2?TOTAL_REHEARSAL-1:m2-1} value={m1}
          onChange={e=>setM1(Number(e.target.value))}
          style={{position:'absolute', left:0, top:0, width:'100%', height:'100%', opacity:0, cursor:'ew-resize'}}/>
        {workCount===3 && (
          <input type="range" min={m1+1} max={TOTAL_REHEARSAL-1} value={m2}
            onChange={e=>setM2(Number(e.target.value))}
            style={{position:'absolute', left:0, top:0, width:'100%', height:'100%', opacity:0, cursor:'ew-resize', pointerEvents:'auto'}}/>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function Programme(){
  const M = window.MOCK;
  const works = M.repertoire;

  const [prog, setProg] = useS({
    workIds: [null, null, null],
    workCount: 3,
    intermissionAfter: 1,
    rehearsalAllocation: [7, 7, 6],
    ticketPrice: 65,
    marketingSpend: 15000,
    studentTicketsEnabled: true,
    studentTicketPrice: 25,
  });

  const [eraFilter, setEraFilter] = useS('all');
  const [search, setSearch] = useS('');

  const forecast = useM(()=>deriveForecast(prog, works), [prog, works]);
  const usedIds = useM(()=>new Set(prog.workIds.filter(Boolean)), [prog]);

  function placeInSlot(idx, workId){
    setProg(p => {
      const next = [...p.workIds];
      // if work already in another slot, swap-clear from there
      const existing = next.indexOf(workId);
      if (existing !== -1) next[existing] = null;
      next[idx] = workId;
      return { ...p, workIds: next };
    });
  }
  function clearSlot(idx){
    setProg(p => {
      const next = [...p.workIds];
      next[idx] = null;
      return { ...p, workIds: next };
    });
  }
  function placeInFirstEmpty(workId){
    setProg(p => {
      const next = [...p.workIds];
      if (next.indexOf(workId) !== -1) return p;
      const empty = next.findIndex((v,i)=>i<p.workCount && v==null);
      if (empty === -1) return p;
      next[empty] = workId;
      return { ...p, workIds: next };
    });
  }
  function swapSlots(a, b){
    setProg(p => {
      const next = [...p.workIds];
      [next[a], next[b]] = [next[b], next[a]];
      return { ...p, workIds: next };
    });
  }
  function setWorkCount(n){
    if (n === prog.workCount) return;
    if (n === 2){
      setProg(p => ({...p, workCount:2, workIds:[p.workIds[0], p.workIds[1], null], intermissionAfter:0, rehearsalAllocation:[10,10,0]}));
    } else {
      setProg(p => ({...p, workCount:3, intermissionAfter:1, rehearsalAllocation:[7,7,6]}));
    }
  }

  // Filter works
  const filteredWorks = useM(()=>{
    let list = works;
    if (eraFilter !== 'all') list = list.filter(w=>w.era===eraFilter);
    if (search.trim()){
      const q = search.toLowerCase();
      list = list.filter(w => (w.composer+w.title).toLowerCase().includes(q));
    }
    return list;
  }, [works, eraFilter, search]);

  // Group by era for the wall
  const byEra = useM(()=>{
    const groups = {};
    filteredWorks.forEach(w => { (groups[w.era] = groups[w.era] || []).push(w); });
    return groups;
  }, [filteredWorks]);

  const totalMin = prog.workIds.slice(0,prog.workCount).reduce((s,id)=>s+(works.find(w=>w.id===id)?.duration ?? 0),0)
    + (prog.intermissionAfter!=null && prog.intermissionAfter < prog.workCount-1 ? 15 : 0);

  return (
    <div className="artboard-surface" style={{padding:0}}>
      <div style={{display:'grid', gridTemplateRows:'auto 1fr', height:'100%'}}>

        {/* ===== CANOPY ===== */}
        <div className="stratum canopy" style={{padding:'16px 40px 12px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
            <div style={{display:'flex', alignItems:'baseline', gap:18}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{width:24,height:24, border:'1px solid var(--silver-dim)', display:'grid', placeItems:'center', color:'var(--silver)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em'}}>OM</div>
                <span className="display" style={{fontSize:16, color:'var(--birch)', fontWeight:500, letterSpacing:'0.04em'}}>{M.institution.name}</span>
              </div>
              <span className="eyebrow">{M.institution.seasonLabel}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:16}}>
              <span className="eyebrow">Wk 6 of 14 · Oct 17</span>
              {['home','roster','programme','library','ledger'].map((t)=>(
                <span key={t} onClick={()=>window.__navigate && window.__navigate(t)} className="serif" style={{fontSize:13, color: t==='programme'?'var(--birch)':'var(--silver-dim)', fontStyle:t==='programme'?'italic':'normal', cursor:'pointer'}}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', alignItems:'end', gap:30}}>
            <div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>Programme · {M.nextConcert.venue}</span>
              <h1 className="display" style={{fontSize:46, fontWeight:500, letterSpacing:'-0.02em', lineHeight:0.95, margin:'4px 0 0', color:'var(--birch)'}}>
                <span style={{fontStyle:'italic', color:'var(--silver)', fontWeight:400}}>II.</span> Pohjola
              </h1>
              <p className="serif" style={{fontSize:14, color:'var(--birch-dim)', margin:'4px 0 0', lineHeight:1.4, fontStyle:'italic'}}>
                {totalMin > 0 ? `${totalMin} minutes total` : 'Compose the evening.'}
                {prog.intermissionAfter !== null && totalMin>0 ? ` · ${totalMin-15} music + 15 intermission` : ''}
              </p>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', alignItems:'baseline', gap:24}}>
              <div style={{textAlign:'right'}}>
                <div className="eyebrow">Works</div>
                <div style={{display:'flex', gap:0, marginTop:4, border:'1px solid var(--hairline)'}}>
                  {[2,3].map(n=>(
                    <button key={n} onClick={()=>setWorkCount(n)} style={{
                      background: prog.workCount===n?'var(--ink-3)':'transparent',
                      color: prog.workCount===n?'var(--birch)':'var(--silver-dim)',
                      border:'none', padding:'6px 14px',
                      fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.2em', cursor:'pointer'
                    }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="eyebrow">Curtain</div>
                <div className="display" style={{fontSize:48, color:'var(--birch)', fontWeight:500, lineHeight:0.9, letterSpacing:'-0.03em'}}>
                  {M.nextConcert.daysOut}<span style={{color:'var(--silver)', fontStyle:'italic', fontSize:24, marginLeft:4}}>d</span>
                </div>
                <div className="eyebrow" style={{marginTop:2}}>October 26</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FLOOR — 3 columns ===== */}
        <div style={{
          padding:'14px 40px 18px',
          display:'grid', gridTemplateColumns:'1.05fr 0.95fr 0.7fr', gap:24,
          minHeight:0, overflow:'hidden',
          background:'linear-gradient(180deg, #0a1612, #07110d)'
        }}>

          {/* LEFT — SLOTS + REHEARSAL + PRODUCTION + CTA */}
          <div style={{display:'flex', flexDirection:'column', minWidth:0}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow" style={{color:'var(--silver)'}}>The Programme · drop works into slots</span>
              <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>{prog.workIds.filter(Boolean).length}/{prog.workCount} filled</span>
            </div>
            <div className="rule-silver" style={{marginBottom:10, opacity:0.5}}></div>

            <div style={{display:'flex', flexDirection:'column', gap:0}}>
              {Array.from({length:prog.workCount}).map((_, i)=>(
                <React.Fragment key={i}>
                  {i > 0 && i < prog.workCount && (
                    <IntermissionDivider
                      on={prog.intermissionAfter === i-1}
                      onClick={()=>setProg(p=>({...p, intermissionAfter: p.intermissionAfter === i-1 ? null : i-1}))}
                    />
                  )}
                  <Slot
                    idx={i}
                    work={works.find(w=>w.id===prog.workIds[i])}
                    prog={prog}
                    forecast={forecast}
                    onDropWork={placeInSlot}
                    onClear={clearSlot}
                    onSlotDrag={swapSlots}
                  />
                </React.Fragment>
              ))}
            </div>

            <RehearsalAllocator
              alloc={prog.rehearsalAllocation}
              workCount={prog.workCount}
              onChange={a=>setProg(p=>({...p, rehearsalAllocation:a}))}
            />

            {/* Production controls */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:18, padding:'10px 0', borderTop:'1px solid var(--hairline)'}}>
              <div>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span className="label">Tickets</span>
                  <span className="num" style={{fontSize:11, color:'var(--birch)'}}>${prog.ticketPrice}</span>
                </div>
                <input type="range" min={20} max={120} step={5} value={prog.ticketPrice}
                  onChange={e=>setProg(p=>({...p, ticketPrice:Number(e.target.value)}))}
                  style={{width:'100%', accentColor:'var(--silver)', marginTop:6}}/>
              </div>
              <div>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span className="label">Marketing</span>
                  <span className="num" style={{fontSize:11, color:'var(--birch)'}}>${(prog.marketingSpend/1000).toFixed(0)}K</span>
                </div>
                <input type="range" min={5000} max={30000} step={1000} value={prog.marketingSpend}
                  onChange={e=>setProg(p=>({...p, marketingSpend:Number(e.target.value)}))}
                  style={{width:'100%', accentColor:'var(--silver)', marginTop:6}}/>
              </div>
              <div>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span className="label" style={{cursor:'pointer'}} onClick={()=>setProg(p=>({...p, studentTicketsEnabled:!p.studentTicketsEnabled}))}>
                    Student {prog.studentTicketsEnabled?'· On':'· Off'}
                  </span>
                  <span className="num" style={{fontSize:11, color: prog.studentTicketsEnabled?'var(--birch)':'var(--silver-dim)'}}>${prog.studentTicketPrice}</span>
                </div>
                <input type="range" min={10} max={50} step={5} value={prog.studentTicketPrice}
                  disabled={!prog.studentTicketsEnabled}
                  onChange={e=>setProg(p=>({...p, studentTicketPrice:Number(e.target.value)}))}
                  style={{width:'100%', accentColor:'var(--silver)', marginTop:6, opacity: prog.studentTicketsEnabled?1:0.4}}/>
              </div>
            </div>

            {/* CTA */}
            <button disabled={!forecast.isComplete} onClick={()=>forecast.isComplete && window.__navigate && window.__navigate('report')} style={{
              marginTop:10, width:'100%', padding:'16px 18px',
              background: forecast.isComplete ? 'linear-gradient(180deg, #1a2e25, #122019)' : 'transparent',
              border:'1px solid var(--silver-dim)',
              color: forecast.isComplete ? 'var(--birch)' : 'var(--silver-dim)',
              cursor: forecast.isComplete ? 'pointer' : 'not-allowed',
              display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'baseline', textAlign:'left'
            }}>
              <span className="serif" style={{fontSize:22, color: forecast.isComplete?'var(--silver)':'var(--silver-dim)', fontStyle:'italic'}}>▸</span>
              <span className="display" style={{fontSize:18, fontWeight:500, letterSpacing:'0.01em'}}>
                {forecast.isComplete ? `Run Concert II · ${totalMin}m` : `Fill ${prog.workCount - prog.workIds.filter(Boolean).length} more slot${prog.workCount - prog.workIds.filter(Boolean).length===1?'':'s'} to continue`}
              </span>
              <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)', letterSpacing:'0.18em'}}>OCT 26 · T−{M.nextConcert.daysOut}d</span>
            </button>
          </div>

          {/* CENTER — REPERTOIRE WALL */}
          <div style={{display:'flex', flexDirection:'column', minWidth:0, minHeight:0}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow" style={{color:'var(--silver)'}}>The Library · {filteredWorks.length} works</span>
              <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>drag or click</span>
            </div>
            <div className="rule-silver" style={{marginBottom:10, opacity:0.5}}></div>

            <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:10}}>
              <input
                type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="search composer / title"
                style={{
                  flex:1, background:'var(--ink-well)', border:'1px solid var(--hairline)',
                  color:'var(--birch)', padding:'6px 10px',
                  fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.02em',
                }}
              />
              {['all','classical','romantic','late-romantic','contemporary'].map(e=>{
                const count = e==='all' ? works.length : works.filter(w=>w.era===e).length;
                const tone = e==='all' ? 'silver' : ERA_TONE[e];
                const active = eraFilter===e;
                return (
                  <button key={e} onClick={()=>setEraFilter(e)} style={{
                    background: active ? 'var(--ink-3)' : 'transparent',
                    border:`1px solid ${active?`var(--${tone})`:'var(--hairline)'}`,
                    color: active?`var(--${tone})`:'var(--silver-dim)',
                    padding:'5px 8px', cursor:'pointer',
                    fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase'
                  }}>{e==='all'?'all':e==='late-romantic'?'L·Rom':e.slice(0,3)} <span style={{opacity:0.6}}>{count}</span></button>
                );
              })}
            </div>

            {/* Wall: era columns */}
            <div style={{flex:1, minHeight:0, overflow:'auto', border:'1px solid var(--hairline)', background:'rgba(0,0,0,0.18)'}}>
              {['classical','romantic','late-romantic','contemporary'].map(era=>{
                const items = byEra[era];
                if (!items || items.length===0) return null;
                return (
                  <div key={era}>
                    <div style={{
                      padding:'8px 12px', display:'flex', justifyContent:'space-between',
                      background:'rgba(255,255,255,0.02)',
                      borderBottom:'1px solid var(--hairline)',
                      borderTop:'1px solid var(--hairline-soft)',
                      position:'sticky', top:0, zIndex:1
                    }}>
                      <span className="eyebrow" style={{color:`var(--${ERA_TONE[era]})`}}>{ERA_LABEL[era]}</span>
                      <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>{items.length}</span>
                    </div>
                    {items.map(w => (
                      <LibraryTile key={w.id} work={w} used={usedIds.has(w.id)} onClick={()=>placeInFirstEmpty(w.id)} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — LIVE FORECAST */}
          <div style={{display:'flex', flexDirection:'column', minWidth:0, minHeight:0}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow" style={{color:'var(--silver)'}}>Live Forecast</span>
              <span className="num" style={{fontSize:9, color: forecast.isComplete?'var(--pine)':'var(--silver-dim)', letterSpacing:'0.18em'}}>
                {forecast.isComplete ? '● LIVE' : '○ AWAITING'}
              </span>
            </div>
            <div className="rule-silver" style={{marginBottom:10, opacity:0.5}}></div>

            {/* HERO numbers */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, paddingBottom:14, borderBottom:'1px solid var(--hairline)'}}>
              <div>
                <div className="eyebrow">Attendance</div>
                <div className="display" style={{fontSize:34, color: forecast.isComplete?'var(--birch)':'var(--silver-dim)', fontWeight:500, lineHeight:0.9, letterSpacing:'-0.02em'}}>
                  {forecast.isComplete ? forecast.attn.toLocaleString() : '—'}
                </div>
                <div className="num" style={{fontSize:9, color:'var(--silver-dim)', marginTop:2}}>seats sold</div>
              </div>
              <div>
                <div className="eyebrow">Net</div>
                <div className="display" style={{fontSize:34, color: !forecast.isComplete?'var(--silver-dim)':forecast.net>=0?'var(--pine)':'var(--ember)', fontWeight:500, lineHeight:0.9, letterSpacing:'-0.02em'}}>
                  {forecast.isComplete ? (forecast.net>=0?'+':'−') + '$' + Math.abs(Math.round(forecast.net/1000)) + 'K' : '—'}
                </div>
                <div className="num" style={{fontSize:9, color:'var(--silver-dim)', marginTop:2}}>after expenses</div>
              </div>
            </div>

            {forecast.isComplete && (
              <>
                <div style={{padding:'12px 0', borderBottom:'1px solid var(--hairline)'}}>
                  <div className="eyebrow" style={{marginBottom:8}}>Financials</div>
                  <div style={{display:'grid', gap:4}}>
                    {[
                      ['Revenue', '$'+Math.round(forecast.revenue/1000)+'K'],
                      ['Expenses', '$'+Math.round(forecast.expenses/1000)+'K'],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:'flex', justifyContent:'space-between'}}>
                        <span className="serif" style={{fontSize:13, color:'var(--birch-dim)'}}>{k}</span>
                        <span className="num" style={{fontSize:12, color:'var(--birch)'}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{padding:'12px 0', borderBottom:'1px solid var(--hairline)'}}>
                  <div className="eyebrow" style={{marginBottom:8}}>Risk Profile</div>
                  {[
                    ['Performance', forecast.perfRisk, true],
                    ['Audience fit', forecast.audienceFit, false],
                    ['Identity impact', forecast.identityImpact, false],
                  ].map(([k,v,isRisk])=>{
                    const color = isRisk
                      ? v>55?'var(--ember)':v>30?'var(--bark)':'var(--pine)'
                      : v>=60?'var(--pine)':v>=40?'var(--silver)':'var(--ember)';
                    return (
                      <div key={k} style={{display:'grid', gridTemplateColumns:'1fr 36px 60px', alignItems:'center', gap:8, padding:'4px 0'}}>
                        <span className="serif" style={{fontSize:13, color:'var(--birch-dim)'}}>{k}</span>
                        <span className="num" style={{fontSize:13, color, textAlign:'right'}}>{v}</span>
                        <div style={{height:3, background:'var(--ink-well)', position:'relative'}}>
                          <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${v}%`, background:color}}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{padding:'12px 0', borderBottom:'1px solid var(--hairline)'}}>
                  <div className="eyebrow" style={{marginBottom:8}}>Section Stress</div>
                  {SECTIONS.map(sec=>{
                    const v = forecast.sectionStress[sec];
                    const c = v>70?'var(--ember)':v>50?'var(--bark)':'var(--silver)';
                    return (
                      <div key={sec} style={{display:'grid', gridTemplateColumns:'1fr 32px 60px', alignItems:'center', gap:8, padding:'3px 0'}}>
                        <span className="num" style={{fontSize:10, color:'var(--birch-dim)', letterSpacing:'0.14em', textTransform:'uppercase'}}>{sec}</span>
                        <span className="num" style={{fontSize:11, color:c, textAlign:'right'}}>{v}</span>
                        <div style={{height:3, background:'var(--ink-well)', position:'relative'}}>
                          <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${v}%`, background:c}}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{padding:'12px 0', flex:1, minHeight:0, overflow:'auto'}}>
              <div className="eyebrow" style={{marginBottom:8}}>Notes</div>
              {forecast.notes.map((n,i)=>(
                <div key={i} style={{display:'flex', gap:8, alignItems:'flex-start', padding:'4px 0'}}>
                  <span className="dot bark" style={{marginTop:6}}></span>
                  <span className="serif" style={{fontSize:13, color:'var(--birch-dim)', fontStyle:'italic', lineHeight:1.35}}>{n}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

window.Programme = Programme;
