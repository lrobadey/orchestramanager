// Library screen
// Editorial repertoire atlas. Era shelves of work tiles + a featured work
// detail with a big section-demand radar as the central graphic.

const { useState: useSL, useMemo: useML } = React;

const ERA_LABEL_L = {
  classical:'Classical',
  romantic:'Romantic',
  'late-romantic':'Late Romantic',
  contemporary:'Contemporary',
};
const ERA_TONE_L = {
  classical:'silver',
  romantic:'bark',
  'late-romantic':'ember',
  contemporary:'pine',
};
const ERA_HEX_L = {
  classical:'#b8c0bc',
  romantic:'#8a6b4f',
  'late-romantic':'#c97a4a',
  contemporary:'#5c8a6f',
};

// Section demand radar --------------------------------------------------------
// 4 axes: top=Winds, right=Brass, bottom=Strings, left=Percussion
// (echoes orchestra layout: strings front, winds middle/back, brass back, perc far back)
function DemandRadar({ work }){
  const size = 280;
  const cx = size/2, cy = size/2;
  const R = 110;
  const rings = [25, 50, 75, 100];
  // axis order around the polygon (degrees, 0=right, 90=up, ...)
  const axes = [
    { key:'winds',      label:'Winds',      angle: -90 },  // top
    { key:'brass',      label:'Brass',      angle:   0 },  // right
    { key:'strings',    label:'Strings',    angle:  90 },  // bottom
    { key:'percussion', label:'Percussion', angle: 180 },  // left
  ];

  const pt = (val, angleDeg) => {
    const a = angleDeg * Math.PI/180;
    const r = (val/100) * R;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const poly = axes.map(ax => pt(work.demands?.[ax.key] ?? 0, ax.angle)).map(p=>p.join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height={size} style={{display:'block'}}>
      {/* rings */}
      {rings.map(p=>(
        <polygon key={p}
          points={axes.map(ax => pt(p, ax.angle).join(',')).join(' ')}
          fill="none" stroke="var(--hairline)" strokeWidth="0.6" strokeDasharray={p===100?'none':'2 4'}
        />
      ))}
      {/* axes */}
      {axes.map(ax => {
        const [x,y] = pt(100, ax.angle);
        return (
          <line key={ax.key} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--hairline)" strokeWidth="0.5"/>
        );
      })}
      {/* the demand polygon */}
      <polygon points={poly} fill="rgba(184,192,188,0.18)" stroke="var(--silver)" strokeWidth="1.4"/>
      {/* vertices */}
      {axes.map(ax => {
        const [x,y] = pt(work.demands?.[ax.key] ?? 0, ax.angle);
        const hex = ERA_HEX_L[ ax.key==='strings'?'classical': ax.key==='winds'?'romantic': ax.key==='brass'?'late-romantic':'contemporary' ];
        return (
          <g key={ax.key}>
            <circle cx={x} cy={y} r={4} fill={hex} stroke="var(--ink-1)" strokeWidth="1.5"/>
          </g>
        );
      })}
      {/* axis labels (outside polygon) */}
      {axes.map(ax => {
        const [x,y] = pt(125, ax.angle);
        const v = work.demands?.[ax.key] ?? 0;
        return (
          <g key={ax.key+'-lab'} textAnchor="middle">
            <text x={x} y={y - 6} fontFamily="JetBrains Mono" fontSize="9" letterSpacing="1.6" fill="var(--silver-dim)">{ax.label.toUpperCase()}</text>
            <text x={x} y={y + 12} fontFamily="EB Garamond" fontStyle="italic" fontWeight="500" fontSize="18" fill="var(--birch)">{v}</text>
          </g>
        );
      })}
      {/* center pip */}
      <circle cx={cx} cy={cy} r={2.5} fill="var(--silver-dim)"/>
    </svg>
  );
}

// Era counts mini chart -------------------------------------------------------
function EraBars({ works, eraFilter, onSetEra }){
  const maxCount = Math.max(...Object.keys(ERA_LABEL_L).map(e => works.filter(w=>w.era===e).length));
  return (
    <div style={{display:'grid', gap:8}}>
      {Object.keys(ERA_LABEL_L).map(e => {
        const items = works.filter(w=>w.era===e);
        const tone = ERA_TONE_L[e];
        const active = eraFilter===e || eraFilter==='all';
        const selected = eraFilter===e;
        return (
          <button key={e} onClick={()=>onSetEra(selected?'all':e)} style={{
            background:'transparent', border:'none', padding:0, cursor:'pointer', textAlign:'left',
            display:'grid', gridTemplateColumns:'1fr auto', gap:6, alignItems:'baseline',
            opacity: active?1:0.4
          }}>
            <div style={{minWidth:0}}>
              <div className="serif" style={{fontSize:14, color: selected?'var(--birch)':'var(--birch-dim)', fontStyle: selected?'italic':'normal'}}>{ERA_LABEL_L[e]}</div>
              <div style={{height:3, background:'var(--ink-well)', position:'relative', marginTop:4}}>
                <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${(items.length/maxCount)*100}%`, background:`var(--${tone})`}}></div>
              </div>
            </div>
            <span className="display" style={{fontSize:22, color:'var(--birch)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{items.length}</span>
          </button>
        );
      })}
    </div>
  );
}

// Ownership pill -------------------------------------------------------------
function OwnershipPill({ ownership, size='sm' }){
  const map = {
    owned:   { dot:'pine',  label:'OWNED',    color:'var(--pine)'  },
    rented:  { dot:'ember', label:'RENTED',   color:'var(--ember)' },
    unowned: { dot:null,    label:'CATALOG',  color:'var(--silver-dim)' },
  };
  const m = map[ownership] || map.unowned;
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:5}}>
      <span style={{width:6,height:6,borderRadius:'50%', background: m.dot ? `var(--${m.dot})` : 'transparent', border: m.dot ? 'none' : `1px solid ${m.color}`}}></span>
      <span className="num" style={{fontSize: size==='lg' ? 10 : 8.5, color:m.color, letterSpacing:'0.18em'}}>{m.label}</span>
    </span>
  );
}

// Tile in the wall ------------------------------------------------------------
function WallTile({ work, selected, onSelect }){
  const tone = ERA_TONE_L[work.era];
  const isCatalog = work.ownership === 'unowned';
  return (
    <button onClick={onSelect} style={{
      flex:'0 0 200px',
      padding:'12px 14px',
      background: selected ? 'rgba(184,192,188,0.06)' : 'transparent',
      border:'1px solid',
      borderColor: selected ? 'var(--silver)' : 'var(--hairline)',
      borderLeft: `3px solid ${ERA_HEX_L[work.era]}`,
      borderStyle: isCatalog ? 'dashed' : 'solid',
      color:'var(--birch)',
      cursor:'pointer',
      textAlign:'left',
      fontFamily:'inherit',
      display:'grid', gridTemplateRows:'auto auto 1fr auto', gap:6, minHeight:128,
      opacity: isCatalog ? 0.86 : 1
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <span className="num" style={{fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.16em', textTransform:'uppercase'}}>{work.composer}</span>
        <OwnershipPill ownership={work.ownership} />
      </div>
      <div className="serif" style={{fontSize:15, color:selected?'var(--birch)':'var(--birch-dim)', fontStyle:'italic', lineHeight:1.2}}>{work.title}</div>
      <span></span>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <div className="display" style={{fontSize:22, color:'var(--birch)', fontWeight:500, lineHeight:0.95, letterSpacing:'-0.02em'}}>{work.duration}<span style={{fontSize:11, color:'var(--silver-dim)'}}>m</span></div>
        <div style={{display:'flex', gap:6, fontFamily:'var(--mono)', fontSize:9, color:'var(--silver-dim)'}}>
          <span>P{work.prestige}</span>
          <span>D{work.draw}</span>
          <span style={{color: work.load>60?'var(--ember)':'var(--silver-dim)'}}>L{work.load}</span>
        </div>
      </div>
    </button>
  );
}

// Ownership / acquisition block (right pane footer) --------------------------
function OwnershipBlock({ work, institution }){
  const owned = work.ownership === 'owned';
  const rented = work.ownership === 'rented';

  if (owned){
    return (
      <div style={{marginTop:14, paddingTop:12, borderTop:'1px solid var(--hairline)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
          <span className="eyebrow" style={{color:'var(--pine)'}}>● In our library</span>
          <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>since {work.acquired || 'Season 0'}</span>
        </div>
        <p className="serif" style={{fontSize:12.5, color:'var(--birch-dim)', fontStyle:'italic', lineHeight:1.4, margin:'0 0 12px'}}>
          Score and parts on the shelf at {institution}. No licensing fees — program freely.
        </p>
        <button style={{
          width:'100%', padding:'12px 14px',
          background:'transparent', border:'1px solid var(--silver-dim)',
          color:'var(--birch)', cursor:'pointer',
          display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12, alignItems:'baseline', textAlign:'left'
        }}>
          <span className="serif" style={{fontSize:18, color:'var(--silver)', fontStyle:'italic'}}>+</span>
          <span className="display" style={{fontSize:15, color:'var(--birch)', fontWeight:500, letterSpacing:'0.01em'}}>Add to Concert II Programme</span>
          <span className="num" style={{fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.16em'}}>OCT 26</span>
        </button>
      </div>
    );
  }

  if (rented){
    return (
      <div style={{marginTop:14, paddingTop:12, borderTop:'1px solid var(--hairline)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
          <span className="eyebrow" style={{color:'var(--ember)'}}>◇ Rented for {work.rentedFor || 'an upcoming concert'}</span>
          <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>${work.rentalCost.toLocaleString()} · returns after run</span>
        </div>
        <p className="serif" style={{fontSize:12.5, color:'var(--birch-dim)', fontStyle:'italic', lineHeight:1.4, margin:'0 0 12px'}}>
          Parts are on rental from the publisher. Add to additional concerts at ${((work.rentalCost*0.6)|0).toLocaleString()} each, or purchase outright to keep the score.
        </p>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <button style={{
            padding:'12px 12px', background:'transparent', border:'1px solid var(--hairline)',
            color:'var(--birch-dim)', cursor:'pointer', textAlign:'left'
          }}>
            <div className="num" style={{fontSize:8.5, color:'var(--bark)', letterSpacing:'0.18em'}}>EXTEND RENTAL</div>
            <div className="display" style={{fontSize:18, color:'var(--birch)', fontWeight:500, marginTop:4}}>${((work.rentalCost*0.6)|0).toLocaleString()}<span style={{fontSize:10, color:'var(--silver-dim)'}}>/run</span></div>
          </button>
          <button style={{
            padding:'12px 12px', background:'linear-gradient(180deg, #1a2e25, #122019)',
            border:'1px solid var(--silver-dim)',
            color:'var(--birch)', cursor:'pointer', textAlign:'left'
          }}>
            <div className="num" style={{fontSize:8.5, color:'var(--silver)', letterSpacing:'0.18em'}}>PURCHASE</div>
            <div className="display" style={{fontSize:18, color:'var(--birch)', fontWeight:500, marginTop:4}}>${work.purchaseCost.toLocaleString()}<span style={{fontSize:10, color:'var(--silver-dim)'}}> · own</span></div>
          </button>
        </div>
      </div>
    );
  }

  // unowned — in catalog
  const breakeven = work.rentalCost > 0 ? Math.ceil(work.purchaseCost / work.rentalCost) : '—';
  return (
    <div style={{marginTop:14, paddingTop:12, borderTop:'1px solid var(--hairline)'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
        <span className="eyebrow" style={{color:'var(--silver-dim)'}}>○ Available in catalog</span>
        <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>break-even · {breakeven} performances</span>
      </div>
      <p className="serif" style={{fontSize:12.5, color:'var(--birch-dim)', fontStyle:'italic', lineHeight:1.4, margin:'0 0 12px'}}>
        Score not yet in our library. Rent for one performance, or purchase to own outright.
      </p>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
        <button style={{
          padding:'14px 12px', background:'linear-gradient(180deg, rgba(138,107,79,0.18), rgba(138,107,79,0.06))',
          border:'1px solid var(--bark)', color:'var(--birch)', cursor:'pointer', textAlign:'left'
        }}>
          <div className="num" style={{fontSize:8.5, color:'var(--bark)', letterSpacing:'0.18em'}}>RENT · ONE RUN</div>
          <div className="display" style={{fontSize:24, color:'var(--birch)', fontWeight:500, lineHeight:0.95, marginTop:4, letterSpacing:'-0.02em'}}>${work.rentalCost.toLocaleString()}</div>
          <div className="num" style={{fontSize:8.5, color:'var(--silver-dim)', marginTop:4}}>parts returned after</div>
        </button>
        <button style={{
          padding:'14px 12px', background:'linear-gradient(180deg, rgba(184,192,188,0.12), rgba(184,192,188,0.02))',
          border:'1px solid var(--silver)', color:'var(--birch)', cursor:'pointer', textAlign:'left'
        }}>
          <div className="num" style={{fontSize:8.5, color:'var(--silver)', letterSpacing:'0.18em'}}>PURCHASE · OWN</div>
          <div className="display" style={{fontSize:24, color:'var(--birch)', fontWeight:500, lineHeight:0.95, marginTop:4, letterSpacing:'-0.02em'}}>${work.purchaseCost.toLocaleString()}</div>
          <div className="num" style={{fontSize:8.5, color:'var(--silver-dim)', marginTop:4}}>permanent score</div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function Library(){
  const M = window.MOCK;
  const works = M.repertoire;
  const composers = useML(()=>Array.from(new Set(works.map(w=>w.composer))).sort(), [works]);

  const ownedCount   = useML(()=>works.filter(w=>w.ownership==='owned').length,   [works]);
  const rentedCount  = useML(()=>works.filter(w=>w.ownership==='rented').length,  [works]);
  const catalogCount = useML(()=>works.filter(w=>w.ownership!=='owned').length,   [works]);

  const [selectedId, setSelectedId] = useSL('sib2');
  const [eraFilter, setEraFilter] = useSL('all');
  const [composerFilter, setComposerFilter] = useSL(null);
  const [search, setSearch] = useSL('');
  const [viewMode, setViewMode] = useSL('owned'); // 'all' | 'owned' | 'catalog'

  const selected = works.find(w=>w.id===selectedId) ?? works[0];

  const filtered = useML(()=>{
    let list = works;
    if (viewMode === 'owned')   list = list.filter(w => w.ownership === 'owned' || w.ownership === 'rented');
    if (viewMode === 'catalog') list = list.filter(w => w.ownership !== 'owned');
    if (eraFilter !== 'all') list = list.filter(w=>w.era===eraFilter);
    if (composerFilter) list = list.filter(w=>w.composer===composerFilter);
    if (search.trim()){
      const q = search.toLowerCase();
      list = list.filter(w => (w.composer+' '+w.title).toLowerCase().includes(q));
    }
    return list;
  }, [works, viewMode, eraFilter, composerFilter, search]);

  const byEra = useML(()=>{
    const groups = {};
    filtered.forEach(w => { (groups[w.era] = groups[w.era] || []).push(w); });
    return groups;
  }, [filtered]);

  return (
    <div className="artboard-surface" style={{padding:0}}>
      <div style={{display:'grid', gridTemplateRows:'auto 1fr', height:'100%'}}>

        {/* ===== CANOPY ===== */}
        <div className="stratum canopy" style={{padding:'16px 36px 14px'}}>
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
                <span key={t} onClick={()=>window.__navigate && window.__navigate(t)} className="serif" style={{fontSize:13, color: t==='library'?'var(--birch)':'var(--silver-dim)', fontStyle:t==='library'?'italic':'normal', cursor:'pointer'}}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1.4fr auto', gap:30, alignItems:'end'}}>
            <div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>The Library</span>
              <h1 className="display" style={{fontSize:46, fontWeight:500, letterSpacing:'-0.02em', lineHeight:0.95, margin:'4px 0 0', color:'var(--birch)'}}>
                <span style={{fontStyle:'italic', color:'var(--silver)', fontWeight:400}}>{works.length}</span> works in the shelf<span style={{color:'var(--bark)'}}>.</span>
              </h1>
              <p className="serif" style={{fontSize:14, color:'var(--birch-dim)', margin:'4px 0 0', lineHeight:1.4, fontStyle:'italic'}}>
                {composers.length} composers, four eras. Browse the shelves; the right pane is the score under your hand.
              </p>
            </div>
            <div style={{display:'flex', gap:24, alignItems:'baseline'}}>
              {[
                { k:'OWNED',      v: ownedCount,   tone:'pine' },
                { k:'CATALOG',    v: catalogCount, tone:'silver' },
                { k:'COMPOSERS',  v: composers.length, tone:'silver' },
              ].map(s=>(
                <div key={s.k} style={{textAlign:'right'}}>
                  <div className="eyebrow" style={{color: s.tone==='pine'?'var(--pine)':'var(--silver-dim)'}}>{s.k}</div>
                  <div className="display" style={{fontSize:42, color: s.tone==='pine'?'var(--pine)':'var(--birch)', fontWeight:500, lineHeight:0.85, letterSpacing:'-0.03em'}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== FLOOR — left rail | wall | detail ===== */}
        <div style={{
          padding:'14px 36px 18px',
          display:'grid', gridTemplateColumns:'220px 1fr 460px', gap:24,
          minHeight:0, overflow:'hidden',
          background:'linear-gradient(180deg, #0a1612, #07110d)'
        }}>

          {/* LEFT — facets */}
          <div style={{display:'flex', flexDirection:'column', gap:18, minHeight:0}}>
            <div>
              <div className="eyebrow" style={{marginBottom:8}}>Search</div>
              <input
                type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="composer or title"
                style={{
                  width:'100%',
                  background:'var(--ink-well)', border:'1px solid var(--hairline)',
                  color:'var(--birch)', padding:'8px 10px',
                  fontFamily:'var(--mono)', fontSize:11
                }}
              />
            </div>

            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow">By Era</span>
                {eraFilter !== 'all' && <span className="num" style={{fontSize:9, color:'var(--bark)', cursor:'pointer'}} onClick={()=>setEraFilter('all')}>clear ×</span>}
              </div>
              <EraBars works={works} eraFilter={eraFilter} onSetEra={setEraFilter} />
            </div>

            <div style={{minHeight:0, display:'flex', flexDirection:'column'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow">By Composer</span>
                {composerFilter && <span className="num" style={{fontSize:9, color:'var(--bark)', cursor:'pointer'}} onClick={()=>setComposerFilter(null)}>clear ×</span>}
              </div>
              <div style={{flex:1, minHeight:0, overflow:'auto', borderTop:'1px solid var(--hairline-soft)'}}>
                {composers.map(c=>{
                  const count = works.filter(w=>w.composer===c).length;
                  const active = composerFilter===c;
                  return (
                    <button key={c} onClick={()=>setComposerFilter(active?null:c)} style={{
                      width:'100%', padding:'7px 0', background:'transparent', border:'none',
                      borderBottom:'1px solid var(--hairline-soft)',
                      display:'grid', gridTemplateColumns:'1fr auto', gap:6, alignItems:'baseline',
                      color:'inherit', cursor:'pointer', textAlign:'left'
                    }}>
                      <span className="serif" style={{fontSize:13, color: active?'var(--birch)':'var(--birch-dim)', fontStyle: active?'italic':'normal'}}>{c}</span>
                      <span className="num" style={{fontSize:10, color:'var(--silver-dim)'}}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER — wall of works (era shelves) */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0, minWidth:0}}>
            {/* segmented control for view mode */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'stretch', marginBottom:10}}>
              <div style={{display:'flex', border:'1px solid var(--hairline)'}}>
                {[
                  { k:'owned',   label:'Our Library', count: ownedCount + rentedCount, tone:'pine' },
                  { k:'catalog', label:'Catalog',     count: catalogCount,             tone:'silver' },
                  { k:'all',     label:'All',         count: works.length,             tone:'silver' },
                ].map(t=>{
                  const active = viewMode === t.k;
                  return (
                    <button key={t.k} onClick={()=>setViewMode(t.k)} style={{
                      background: active ? 'var(--ink-3)' : 'transparent',
                      color: active ? 'var(--birch)' : 'var(--silver-dim)',
                      border:'none',
                      borderRight: t.k!=='all' ? '1px solid var(--hairline)' : 'none',
                      padding:'7px 16px', cursor:'pointer',
                      display:'flex', alignItems:'baseline', gap:8,
                      fontFamily:'inherit'
                    }}>
                      <span className="serif" style={{fontSize:14, fontStyle: active?'italic':'normal'}}>{t.label}</span>
                      <span className="num" style={{fontSize:9.5, color: active?`var(--${t.tone})`:'var(--silver-dim)'}}>{t.count}</span>
                    </button>
                  );
                })}
              </div>
              <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)', alignSelf:'flex-end'}}>{filtered.length} shown</span>
            </div>
            <div className="rule-silver" style={{marginBottom:6, opacity:0.5}}></div>

            <div style={{flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:14, paddingRight:6, paddingTop:8}}>
              {['classical','romantic','late-romantic','contemporary'].map(era=>{
                const items = byEra[era];
                if (!items || items.length===0) return null;
                const tone = ERA_TONE_L[era];
                return (
                  <div key={era}>
                    <div style={{display:'flex', alignItems:'baseline', gap:12, marginBottom:8}}>
                      <span className="display" style={{fontSize:22, color:`var(--${tone})`, fontStyle:'italic', fontWeight:500, letterSpacing:'0.005em'}}>{ERA_LABEL_L[era]}</span>
                      <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>{items.length} works</span>
                      <span style={{flex:1, height:1, background:`var(--${tone})`, opacity:0.3}}></span>
                    </div>
                    <div style={{display:'flex', gap:10, overflowX:'auto', paddingBottom:6}}>
                      {items.map(w => (
                        <WallTile key={w.id} work={w} selected={selectedId===w.id} onSelect={()=>setSelectedId(w.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {filtered.length===0 && (
                <div className="serif" style={{padding:20, color:'var(--birch-dim)', fontStyle:'italic'}}>No works match these filters.</div>
              )}
            </div>
          </div>

          {/* RIGHT — featured work detail */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0, background:'rgba(0,0,0,0.18)', border:'1px solid var(--hairline)', borderLeft:`3px solid ${ERA_HEX_L[selected.era]}`, padding:'20px 22px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
              <span className="eyebrow" style={{color:'var(--silver)'}}>The Score · under your hand</span>
              <OwnershipPill ownership={selected.ownership} size="lg" />
            </div>

            <div className="num" style={{fontSize:10, color:'var(--silver-dim)', letterSpacing:'0.18em', textTransform:'uppercase'}}>{selected.composer}</div>
            <h2 className="display" style={{fontSize:30, color:'var(--birch)', fontWeight:500, fontStyle:'italic', letterSpacing:'-0.005em', lineHeight:1.05, margin:'4px 0 6px'}}>{selected.title}</h2>
            <div style={{display:'flex', gap:14, alignItems:'baseline', marginBottom:14}}>
              <span className="display" style={{fontSize:42, color:'var(--birch)', fontWeight:500, lineHeight:0.85, letterSpacing:'-0.03em'}}>{selected.duration}<span style={{fontSize:16, color:'var(--silver-dim)'}}>min</span></span>
              <span style={{flex:1}}></span>
              <span className="num" style={{fontSize:9, color:`var(--${ERA_TONE_L[selected.era]})`, letterSpacing:'0.18em', textTransform:'uppercase'}}>{ERA_LABEL_L[selected.era]}</span>
            </div>

            {/* The big graphic: demand radar */}
            <div style={{flex:'0 0 auto', margin:'0 -10px 6px'}}>
              <DemandRadar work={selected} />
            </div>
            <div className="serif" style={{fontSize:12, color:'var(--birch-dim)', fontStyle:'italic', textAlign:'center', marginBottom:12}}>
              Section demand profile.
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, paddingTop:10, borderTop:'1px solid var(--hairline)'}}>
              {[
                { k:'Prestige', v:selected.prestige, hint:'critical weight' },
                { k:'Draw',     v:selected.draw,     hint:'audience pull' },
                { k:'Load',     v:selected.load,     hint:'rehearsal cost', tone: selected.load>60?'ember':'silver' },
              ].map(s=>(
                <div key={s.k}>
                  <div className="eyebrow" style={{fontSize:8}}>{s.k}</div>
                  <div className="display" style={{fontSize:28, color: s.tone==='ember'?'var(--ember)':'var(--birch)', fontWeight:500, lineHeight:0.95, letterSpacing:'-0.02em'}}>{s.v}</div>
                  <div className="num" style={{fontSize:8.5, color:'var(--silver-dim)', letterSpacing:'0.1em', marginTop:2}}>{s.hint}</div>
                </div>
              ))}
            </div>

            {/* Ownership / Acquisition block */}
            <OwnershipBlock work={selected} institution={M.institution.name} />
          </div>

        </div>
      </div>
    </div>
  );
}

window.Library = Library;
