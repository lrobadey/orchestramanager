// Roster screen
// Big graphic: an orchestra-on-stage schematic (semicircular seating plan,
// each section drawn as a concentric arc of chairs). Big numbers per section
// in monolith cards down both sides. Click a section to drill into its
// principal ledger at the bottom.

const { useState, useMemo } = React;

// Layout the semicircle of chairs ----------------------------------------------
// SVG viewBox 600 x 460, conductor at (300, 410).
const STAGE_VB = { w: 600, h: 460, cx: 300, cy: 410 };

// One arc per section.
const ARCS = [
  { section:'strings',    radius:100, from:185, to:355, chairs:14 },
  { section:'strings',    radius:148, from:185, to:355, chairs:16 },
  { section:'winds',      radius:198, from:205, to:335, chairs:12 },
  { section:'brass',      radius:248, from:215, to:325, chairs:10 },
  { section:'percussion', radius:298, from:240, to:300, chairs:5  },
];

function chairPositions(){
  const out = [];
  ARCS.forEach((arc, arcIdx)=>{
    const N = arc.chairs;
    for (let i=0;i<N;i++){
      const t = N === 1 ? 0.5 : i / (N - 1);
      const angleDeg = arc.from + (arc.to - arc.from) * t;
      const a = (angleDeg) * Math.PI / 180;
      const x = STAGE_VB.cx + arc.radius * Math.cos(a);
      const y = STAGE_VB.cy + arc.radius * Math.sin(a);
      out.push({ section: arc.section, x, y, arcIdx });
    }
  });
  return out;
}

const SECTION_TONE = {
  strings:    { tone:'silver', hex:'#b8c0bc', dim:'#7d8a85' },
  winds:      { tone:'bark',   hex:'#8a6b4f', dim:'#5d4836' },
  brass:      { tone:'ember',  hex:'#c97a4a', dim:'#7a4a2a' },
  percussion: { tone:'pine',   hex:'#5c8a6f', dim:'#3a5a48' },
};

function strengthTone(v){
  if (v>=70) return 'pine';
  if (v>=55) return 'silver';
  if (v>=40) return 'bark';
  return 'ember';
}

// Section monolith card --------------------------------------------------------
function SectionCard({ section, active, onClick }){
  const tone = SECTION_TONE[section.key];
  const sTone = strengthTone(section.strength);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? 'linear-gradient(180deg, rgba(184,192,188,0.04), transparent)' : 'transparent',
        border:'none',
        borderLeft: `2px solid ${active ? 'var(--silver)' : 'var(--hairline)'}`,
        padding:'14px 18px',
        textAlign:'left',
        color:'var(--birch)',
        cursor:'pointer',
        display:'block',
        width:'100%',
        position:'relative',
        fontFamily:'inherit',
      }}
    >
      {/* head row: section name + chairs */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
        <span className="display" style={{
          fontSize:24, fontWeight:500, fontStyle:'italic',
          color: active ? 'var(--birch)' : 'var(--birch-dim)',
          letterSpacing:'0.005em', lineHeight:1
        }}>{section.label}</span>
        <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)', letterSpacing:'0.14em'}}>{section.chairs} chairs · {section.principalCount} principals</span>
      </div>

      {/* big strength number */}
      <div style={{display:'grid', gridTemplateColumns:'auto 1fr', gap:14, alignItems:'baseline', marginBottom:10}}>
        <div className="display" style={{
          fontSize:78, fontWeight:500, lineHeight:0.85, letterSpacing:'-0.03em',
          color: active ? 'var(--birch)' : 'var(--birch-dim)',
        }}>{section.strength}</div>
        <div>
          <div className="eyebrow" style={{fontSize:8.5, marginBottom:4}}>Composite</div>
          <div style={{height:2, background:'var(--ink-well)', position:'relative'}}>
            <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${section.strength}%`, background:`var(--${sTone})`}}></div>
          </div>
          <div className="serif" style={{fontSize:11.5, color:'var(--birch-dim)', fontStyle:'italic', marginTop:6, lineHeight:1.3}}>{section.note}</div>
        </div>
      </div>

      {/* demand / stress dual gauges */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
        <div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
            <span className="label" style={{fontSize:8.5}}>Demand</span>
            <span className="num" style={{fontSize:11, color:'var(--birch)'}}>{section.demand}</span>
          </div>
          <div style={{height:3, background:'var(--ink-well)', position:'relative'}}>
            <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${section.demand}%`, background:'var(--silver)'}}></div>
          </div>
        </div>
        <div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
            <span className="label" style={{fontSize:8.5}}>Stress</span>
            <span className="num" style={{fontSize:11, color: section.stress>50?'var(--ember)':section.stress>30?'var(--bark)':'var(--pine)'}}>{section.stress}</span>
          </div>
          <div style={{height:3, background:'var(--ink-well)', position:'relative'}}>
            <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${section.stress}%`, background: section.stress>50?'var(--ember)':section.stress>30?'var(--bark)':'var(--pine)'}}></div>
          </div>
        </div>
      </div>

      {active && (
        <div style={{position:'absolute', top:14, right:18}}>
          <span className="num" style={{fontSize:8, color:'var(--silver)', letterSpacing:'0.22em'}}>● ACTIVE</span>
        </div>
      )}
    </button>
  );
}

// Principal nameplate ----------------------------------------------------------
function Nameplate({ p }){
  const oTone = strengthTone(p.overall);
  return (
    <div style={{
      borderLeft:'1px solid var(--hairline)',
      padding:'10px 18px 4px',
      display:'grid', gridTemplateRows:'auto auto auto auto',
      gap:4,
      minWidth:0,
    }}>
      <div>
        <div className="serif" style={{fontSize:17, color:'var(--birch)', lineHeight:1.1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</div>
        <div className="num" style={{fontSize:8.5, color:'var(--silver-dim)', letterSpacing:'0.18em', textTransform:'uppercase', marginTop:2}}>{p.position}</div>
      </div>

      <div style={{display:'flex', alignItems:'baseline', gap:8, marginTop:6}}>
        <span className="display" style={{fontSize:52, fontWeight:500, lineHeight:0.85, color: oTone==='pine'?'var(--pine)':oTone==='silver'?'var(--birch)':oTone==='bark'?'var(--bark)':'var(--ember)', letterSpacing:'-0.02em'}}>{p.overall}</span>
        <span className="eyebrow" style={{fontSize:8}}>overall</span>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:4}}>
        <div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:2}}>
            <span className="label" style={{fontSize:8}}>Form</span>
            <span className="num" style={{fontSize:10, color: p.form<60?'var(--ember)':'var(--birch)'}}>{p.form}</span>
          </div>
          <div style={{height:2, background:'var(--ink-well)', position:'relative'}}>
            <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${p.form}%`, background: p.form<60?'var(--ember)':'var(--silver)'}}></div>
          </div>
        </div>
        <div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:2}}>
            <span className="label" style={{fontSize:8}}>Morale</span>
            <span className="num" style={{fontSize:10, color: p.morale<60?'var(--ember)':'var(--birch)'}}>{p.morale}</span>
          </div>
          <div style={{height:2, background:'var(--ink-well)', position:'relative'}}>
            <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${p.morale}%`, background: p.morale<60?'var(--ember)':'var(--silver)'}}></div>
          </div>
        </div>
      </div>

      <div style={{display:'flex', gap:10, marginTop:6, fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.06em'}}>
        <span style={{color:'var(--pine)'}}>↑ {p.best}</span>
        <span style={{color:'var(--bark)'}}>watch · {p.watch}</span>
      </div>
    </div>
  );
}

// Main Roster screen -----------------------------------------------------------
function Roster(){
  const M = window.MOCK;
  const [active, setActive] = useState('strings');

  const chairs = useMemo(()=>chairPositions(), []);
  const activeSection = M.roster.sections.find(s=>s.key===active);
  const activePrincipals = M.roster.principals.filter(p=>p.section===active);

  return (
    <div className="artboard-surface" style={{padding:0}}>
      <div className="strata" style={{gridTemplateRows:'auto 1fr auto'}}>

        {/* ===== CANOPY — editorial header ===== */}
        <div className="stratum canopy" style={{padding:'18px 56px 14px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
            <div style={{display:'flex', alignItems:'baseline', gap:18}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{width:24,height:24, border:'1px solid var(--silver-dim)', display:'grid', placeItems:'center', color:'var(--silver)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em'}}>OM</div>
                <span className="display" style={{fontSize:16, color:'var(--birch)', fontWeight:500, letterSpacing:'0.04em'}}>{M.institution.name}</span>
              </div>
              <span className="eyebrow">{M.institution.city}</span>
              <span className="eyebrow" style={{color:'var(--bark)'}}>{M.institution.seasonLabel}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:16}}>
              <span className="eyebrow">Wk 6 of 14 · Oct 17</span>
              {['home','roster','programme','library','ledger'].map((t,i)=>(
                <span key={t} onClick={()=>window.__navigate && window.__navigate(t)} className="serif" style={{fontSize:13, color: t==='roster'?'var(--birch)':'var(--silver-dim)', fontStyle:t==='roster'?'italic':'normal', cursor:'pointer'}}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', alignItems:'end', gap:30}}>
            <div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>The Orchestra · 15 principals · 78 chairs</span>
              <h1 className="display" style={{
                fontSize:60, fontWeight:500, letterSpacing:'-0.02em', lineHeight:0.95,
                margin:'6px 0 0', color:'var(--birch)',
              }}>
                <span style={{fontStyle:'italic', color:'var(--silver)', fontWeight:400}}>A</span> capable, working ensemble<span style={{color:'var(--bark)'}}>.</span>
              </h1>
              <p className="serif" style={{fontSize:15, color:'var(--birch-dim)', margin:'8px 0 0', lineHeight:1.4, maxWidth:760, fontStyle:'italic'}}>
                Strings carry the institution; brass is under strain after Concert I. Two sections green, two on watch.
              </p>
            </div>

            <div style={{textAlign:'right'}}>
              <div className="eyebrow" style={{color:'var(--bark)', marginBottom:4}}>Composite Strength</div>
              <div className="display" style={{fontSize:108, color:'var(--birch)', fontWeight:500, lineHeight:0.85, letterSpacing:'-0.045em'}}>
                {M.roster.strength}<span style={{color:'var(--silver-dim)', fontStyle:'italic', fontSize:36, marginLeft:6, fontWeight:400}}>/100</span>
              </div>
              <div style={{height:3, background:'var(--ink-well)', marginTop:8, position:'relative'}}>
                <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${M.roster.strength}%`, background:'var(--silver)'}}></div>
                <div style={{position:'absolute', left:'65%', top:-4, height:11, width:1, background:'var(--bark)'}}></div>
              </div>
              <div className="num" style={{fontSize:8.5, color:'var(--silver-dim)', marginTop:4, display:'flex', justifyContent:'space-between'}}>
                <span>FRAGILE 0</span><span style={{color:'var(--bark)'}}>STABLE 65</span><span>COMMANDING 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FLOOR — stage plan center + section cards on both sides ===== */}
        <div className="stratum floor" style={{padding:'14px 56px 14px', display:'grid', gridTemplateColumns:'1fr 600px 1fr', gap:32, minHeight:0, alignItems:'start'}}>

          {/* LEFT SECTIONS — Strings, Winds */}
          <div style={{display:'grid', gridTemplateRows:'1fr 1fr', gap:14}}>
            <SectionCard section={M.roster.sections[0]} active={active==='strings'} onClick={()=>setActive('strings')} />
            <SectionCard section={M.roster.sections[1]} active={active==='winds'}   onClick={()=>setActive('winds')} />
          </div>

          {/* CENTER STAGE PLAN */}
          <div style={{position:'relative', height:480}}>
            <div style={{position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', textAlign:'center'}}>
              <div className="eyebrow" style={{color:'var(--silver)'}}>The Stage · Tampere Hall</div>
              <div className="serif" style={{fontSize:13, color:'var(--birch-dim)', fontStyle:'italic', marginTop:4}}>Audience perspective</div>
            </div>

            <svg viewBox={`0 0 ${STAGE_VB.w} ${STAGE_VB.h}`} style={{width:'100%', height:'100%'}} preserveAspectRatio="xMidYMid meet">
              {/* concentric arc guidelines */}
              {ARCS.map((arc, i)=>{
                const fromA = arc.from * Math.PI/180;
                const toA = arc.to * Math.PI/180;
                const x1 = STAGE_VB.cx + arc.radius * Math.cos(fromA);
                const y1 = STAGE_VB.cy + arc.radius * Math.sin(fromA);
                const x2 = STAGE_VB.cx + arc.radius * Math.cos(toA);
                const y2 = STAGE_VB.cy + arc.radius * Math.sin(toA);
                const sectionActive = arc.section === active;
                return (
                  <path key={i}
                    d={`M ${x1} ${y1} A ${arc.radius} ${arc.radius} 0 0 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={sectionActive ? 'var(--silver)' : 'var(--hairline)'}
                    strokeWidth={sectionActive?1.2:0.6}
                    strokeDasharray={sectionActive?'none':'2 4'}
                    opacity={sectionActive?0.85:0.5}
                  />
                );
              })}

              {/* chairs */}
              {chairs.map((c, i)=>{
                const tone = SECTION_TONE[c.section];
                const sectionActive = c.section === active;
                return (
                  <g key={i}>
                    <circle cx={c.x} cy={c.y} r={sectionActive ? 6 : 4.5}
                      fill={sectionActive ? tone.hex : 'var(--ink-1)'}
                      stroke={sectionActive ? tone.hex : tone.dim}
                      strokeWidth={sectionActive ? 1.2 : 0.9}
                      opacity={sectionActive ? 1 : 0.55}
                    />
                  </g>
                );
              })}

              {/* conductor podium */}
              <circle cx={STAGE_VB.cx} cy={STAGE_VB.cy} r={14} fill="none" stroke="var(--bark)" strokeWidth="1" strokeDasharray="2 3"/>
              <circle cx={STAGE_VB.cx} cy={STAGE_VB.cy} r={4} fill="var(--bark)"/>
              <text x={STAGE_VB.cx} y={STAGE_VB.cy + 32} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill="var(--silver-dim)" letterSpacing="2">CONDUCTOR</text>

              {/* section labels (leader text) */}
              {[
                { section:'strings',    angle:268, radius:170, anchor:'middle' },
                { section:'winds',      angle:268, radius:218, anchor:'middle' },
                { section:'brass',      angle:268, radius:268, anchor:'middle' },
                { section:'percussion', angle:268, radius:318, anchor:'middle' },
              ].map((l, i)=>{
                const a = l.angle * Math.PI/180;
                const x = STAGE_VB.cx + l.radius * Math.cos(a);
                const y = STAGE_VB.cy + l.radius * Math.sin(a);
                const sect = M.roster.sections.find(s=>s.key===l.section);
                const sectionActive = l.section === active;
                return (
                  <g key={i}>
                    <text x={x} y={y} textAnchor={l.anchor}
                      fontFamily="EB Garamond" fontStyle="italic"
                      fontSize={sectionActive?14:11.5}
                      fill={sectionActive?'var(--birch)':'var(--birch-dim)'}
                    >
                      {sect.label} · <tspan fontFamily="JetBrains Mono" fontStyle="normal" fontSize={sectionActive?13:11}>{sect.strength}</tspan>
                    </text>
                  </g>
                );
              })}

              {/* stage front line (audience edge) */}
              <line x1={40} y1={STAGE_VB.cy + 36} x2={STAGE_VB.w - 40} y2={STAGE_VB.cy + 36} stroke="var(--hairline)" strokeWidth="0.7" strokeDasharray="3 4"/>
              <text x={STAGE_VB.w - 40} y={STAGE_VB.cy + 50} textAnchor="end" fontFamily="JetBrains Mono" fontSize="7.5" fill="var(--silver-dim)" letterSpacing="2">AUDIENCE ▾</text>
            </svg>
          </div>

          {/* RIGHT SECTIONS — Brass, Percussion */}
          <div style={{display:'grid', gridTemplateRows:'1fr 1fr', gap:14}}>
            <SectionCard section={M.roster.sections[2]} active={active==='brass'}      onClick={()=>setActive('brass')} />
            <SectionCard section={M.roster.sections[3]} active={active==='percussion'} onClick={()=>setActive('percussion')} />
          </div>
        </div>

        {/* ===== DUFF — principal ledger for active section ===== */}
        <div className="stratum duff" style={{padding:'16px 56px 18px', borderBottom:'none', minHeight:0}}>
          <div className="rule-brown" style={{marginBottom:12}}></div>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
            <div style={{display:'flex', alignItems:'baseline', gap:18}}>
              <span className="eyebrow" style={{color:'var(--silver)'}}>Principal Ledger</span>
              <span className="display" style={{fontSize:22, fontStyle:'italic', color:'var(--birch)', fontWeight:500, letterSpacing:'0.005em'}}>{activeSection.label}</span>
              <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)', letterSpacing:'0.16em'}}>
                {activePrincipals.length} principals · {activeSection.chairs} chairs
              </span>
            </div>
            <div style={{display:'flex', gap:14, alignItems:'baseline'}}>
              <span className="eyebrow">Sort:</span>
              {['overall','form','morale'].map((t,i)=>(
                <span key={t} className="serif" style={{fontSize:13, color: i===0?'var(--birch)':'var(--silver-dim)', fontStyle:i===0?'italic':'normal', cursor:'pointer'}}>{t}</span>
              ))}
              <span style={{height:14, width:1, background:'var(--hairline)', margin:'0 6px'}}></span>
              <span className="num" style={{fontSize:9.5, color:'var(--bark)', letterSpacing:'0.18em', cursor:'pointer'}}>OPEN BENCH ▸</span>
            </div>
          </div>

          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${Math.max(activePrincipals.length, 1)}, minmax(0, 1fr))`,
            background:'rgba(0,0,0,0.18)',
            border:'1px solid var(--hairline)',
            borderRight:'none',
          }}>
            {activePrincipals.map(p=>(
              <Nameplate key={p.name} p={p} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

window.Roster = Roster;
