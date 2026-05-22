// Direction B — Cartographic / Map Insets
// The season is a terrain; concert slots are landmarks on it.
// Modules sit as bordered insets connected to map regions by leader lines.

function CornerMarks(){
  return (<>
    <span className="corner tl"></span>
    <span className="corner tr"></span>
    <span className="corner bl"></span>
    <span className="corner br"></span>
  </>);
}

function HomeB(){
  const M = window.MOCK;

  // landmark coordinates (% of canvas) for each concert slot, laid as a path
  const landmarks = [
    { idx:1, x:18, y:62, label:"I", state:"resolved" },
    { idx:2, x:42, y:50, label:"II", state:"active" },
    { idx:3, x:64, y:60, label:"III", state:"locked" },
    { idx:4, x:84, y:42, label:"IV", state:"locked" },
  ];

  return (
    <div className="artboard-surface cart-paper" style={{fontFamily:'var(--sans)'}}>
      <div className="cart-graticule"></div>
      <div className="cart-contours"></div>

      {/* ====== HEADER STRIP (engraved into the map) ====== */}
      <div style={{position:'absolute', top:18, left:24, right:24, display:'flex', justifyContent:'space-between', alignItems:'baseline', zIndex:5}}>
        <div style={{display:'flex', alignItems:'baseline', gap:18}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:22,height:22, border:'1px solid var(--silver-dim)', display:'grid', placeItems:'center', color:'var(--silver)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em'}}>OM</div>
            <span className="display" style={{fontSize:18, color:'var(--birch)', fontWeight:500, letterSpacing:'0.04em'}}>{M.institution.name}</span>
          </div>
          <span className="eyebrow">{M.institution.city} · {M.institution.seasonLabel}</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:14}}>
          <span className="label">Wk 6 · Oct 17</span>
          <span className="pill silver">You are at II</span>
        </div>
      </div>

      {/* compass + scale */}
      <div style={{position:'absolute', top:60, left:24, zIndex:5}}>
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle cx="39" cy="39" r="34" fill="none" stroke="var(--silver-dim)" strokeWidth="0.6"/>
          <circle cx="39" cy="39" r="26" fill="none" stroke="var(--silver-dim)" strokeWidth="0.4" strokeDasharray="1 3"/>
          <line x1="39" y1="5" x2="39" y2="73" stroke="var(--silver-dim)" strokeWidth="0.4"/>
          <line x1="5" y1="39" x2="73" y2="39" stroke="var(--silver-dim)" strokeWidth="0.4"/>
          <polygon points="39,8 35,38 39,28 43,38" fill="var(--silver)"/>
          <text x="39" y="3" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="6" fill="var(--silver)">N</text>
          <text x="39" y="78" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="6" fill="var(--silver-dim)">S</text>
          <text x="2" y="41" fontFamily="JetBrains Mono" fontSize="6" fill="var(--silver-dim)">W</text>
          <text x="73" y="41" fontFamily="JetBrains Mono" fontSize="6" fill="var(--silver-dim)">E</text>
        </svg>
        <div style={{marginTop:6, fontFamily:'var(--mono)', fontSize:8.5, color:'var(--silver-dim)', letterSpacing:'0.12em'}}>
          <div style={{display:'flex', alignItems:'center', gap:4}}>
            <div style={{height:1, width:60, background:'var(--silver-dim)'}}></div>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', width:60, marginTop:1}}>
            <span>0</span><span>WK 14</span>
          </div>
          <div style={{marginTop:4}}>SEASON I</div>
        </div>
      </div>

      {/* ====== MAP LAYER — landmarks + leader lines via SVG overlay ====== */}
      <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', zIndex:2}} viewBox="0 0 1440 920" preserveAspectRatio="none">
        {/* contour highlight — the season "path" through the terrain */}
        <path
          d={`M ${1440*0.05} ${920*0.68}
              Q ${1440*0.15} ${920*0.55}, ${1440*landmarks[0].x/100} ${920*landmarks[0].y/100}
              S ${1440*landmarks[1].x/100} ${920*landmarks[1].y/100}, ${1440*landmarks[2].x/100} ${920*landmarks[2].y/100}
              S ${1440*landmarks[3].x/100} ${920*landmarks[3].y/100}, ${1440*0.95} ${920*0.35}`}
          fill="none" stroke="var(--silver-dim)" strokeWidth="1" strokeDasharray="2 4" opacity="0.55"
        />

        {/* leader lines from insets to map regions */}
        {/* vitals (top-left) → over central region */}
        <path className="cart-leader" d={`M 340 240 L 480 320 L ${1440*landmarks[1].x/100 - 30} ${920*landmarks[1].y/100 - 20}`} />
        <circle className="cart-leader-dot" cx={1440*landmarks[1].x/100 - 30} cy={920*landmarks[1].y/100 - 20} r="2.5"/>
        {/* roster (top-right) → over right region */}
        <path className="cart-leader" d={`M 1100 240 L 1020 300 L ${1440*landmarks[2].x/100 - 20} ${920*landmarks[2].y/100 - 30}`}/>
        <circle className="cart-leader-dot" cx={1440*landmarks[2].x/100 - 20} cy={920*landmarks[2].y/100 - 30} r="2.5"/>
        {/* finance (bottom-left) */}
        <path className="cart-leader" d={`M 280 680 L 360 600 L ${1440*landmarks[0].x/100 + 20} ${920*landmarks[0].y/100 + 30}`}/>
        <circle className="cart-leader-dot" cx={1440*landmarks[0].x/100 + 20} cy={920*landmarks[0].y/100 + 30} r="2.5"/>
        {/* inbox (bottom-right) */}
        <path className="cart-leader" d={`M 1120 720 L 1040 680 L ${1440*landmarks[3].x/100 - 10} ${920*landmarks[3].y/100 + 30}`}/>
        <circle className="cart-leader-dot" cx={1440*landmarks[3].x/100 - 10} cy={920*landmarks[3].y/100 + 30} r="2.5"/>
      </svg>

      {/* ====== LANDMARKS — concert slots ====== */}
      {landmarks.map((lm, i) => {
        const slot = M.season.slots[i];
        const isActive = slot.status === 'active';
        const isDone = slot.status === 'resolved';
        return (
          <div key={lm.idx} style={{
            position:'absolute',
            left:`${lm.x}%`, top:`${lm.y}%`,
            transform:'translate(-50%, -50%)',
            zIndex:3, textAlign:'center'
          }}>
            <div style={{
              width: isActive?44:32, height: isActive?44:32,
              border:`1px solid ${isActive?'var(--silver)':isDone?'var(--pine)':'var(--silver-dim)'}`,
              background: isActive?'var(--ink-2)':'var(--ink-0)',
              display:'grid', placeItems:'center',
              boxShadow: isActive?'0 0 0 5px rgba(184,192,188,0.10), 0 0 25px rgba(184,192,188,0.18)':'none',
              transform:'rotate(45deg)',
              margin:'0 auto'
            }}>
              <span className="serif" style={{
                transform:'rotate(-45deg)', fontStyle:'italic',
                fontSize: isActive?16:13,
                color: isActive?'var(--birch)':isDone?'var(--pine)':'var(--silver-dim)',
                fontWeight:500
              }}>{lm.label}</span>
            </div>
            <div style={{marginTop:10, fontFamily:'var(--mono)', fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.18em'}}>{slot.date.toUpperCase()}</div>
            <div className="serif" style={{fontSize: isActive?14:12, color: isActive?'var(--birch)':'var(--birch-dim)', marginTop:2, whiteSpace:'nowrap'}}>{slot.name.split('·')[1]?.trim() ?? slot.name}</div>
            {isDone && <div className="num" style={{fontSize:9, color:'var(--pine)', marginTop:2}}>Q {slot.quality} · {slot.attendance.toLocaleString()}</div>}
            {isActive && <div className="num" style={{fontSize:9, color:'var(--bark)', marginTop:2}}>PROGRAMMING</div>}
          </div>
        );
      })}

      {/* ====== INSET — VITALS (top-left) ====== */}
      <div className="cart-inset" style={{position:'absolute', left:130, top:108, width:320, zIndex:6}}>
        <CornerMarks />
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
          <span className="eyebrow" style={{color:'var(--silver)'}}>◇ Inset 01 · Vitals</span>
          <span className="num" style={{fontSize:8.5, color:'var(--bark)'}}>SCALE 1:1</span>
        </div>
        <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom:12}}>
          <div>
            <div className="label" style={{fontSize:8.5}}>Cash</div>
            <div className="display" style={{fontSize:28, color:'var(--birch)', fontWeight:500, lineHeight:1}}>$412.8K</div>
          </div>
          <div>
            <div className="num" style={{fontSize:10, color:'var(--ember)'}}>−$18.4K wk</div>
            <div className="num" style={{fontSize:9.5, color:'var(--birch-dim)'}}>14 wk runway</div>
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 18px', marginTop:8}}>
          {M.institution.vitals.map(v=>(
            <div key={v.key}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                <span className="label" style={{fontSize:8.5}}>{v.label}</span>
                <span className="num" style={{fontSize:11, color:'var(--birch)'}}>{v.value}</span>
              </div>
              <div className="bar" style={{marginTop:4}}><i className={v.tone} style={{width:`${v.value}%`}}></i></div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12, paddingTop:10, borderTop:'1px solid var(--hairline)'}}>
          <div className="label" style={{fontSize:8.5, marginBottom:6}}>Identity orientation</div>
          <div style={{display:'flex', alignItems:'center', height:14, gap:2}}>
            <div style={{flex:M.institution.identity.adventurous, height:14, background:'var(--silver)', position:'relative'}}>
              <span className="num" style={{position:'absolute', left:4, top:2, fontSize:9, color:'var(--ink-0)'}}>ADV {M.institution.identity.adventurous}</span>
            </div>
            <div style={{flex:M.institution.identity.community, height:14, background:'var(--bark)', position:'relative'}}>
              <span className="num" style={{position:'absolute', left:4, top:2, fontSize:9, color:'var(--ink-0)'}}>COM {M.institution.identity.community}</span>
            </div>
            <div style={{flex:M.institution.identity.scholarly, height:14, background:'var(--pine)', position:'relative'}}>
              <span className="num" style={{position:'absolute', left:4, top:2, fontSize:9, color:'var(--ink-0)'}}>SCH {M.institution.identity.scholarly}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====== INSET — ROSTER (top-right) ====== */}
      <div className="cart-inset" style={{position:'absolute', right:130, top:108, width:340, zIndex:6}}>
        <CornerMarks />
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
          <span className="eyebrow" style={{color:'var(--silver)'}}>◇ Inset 02 · Roster</span>
          <span className="num" style={{fontSize:8.5, color:'var(--bark)'}}>STR {M.roster.strength} / 100</span>
        </div>
        {M.roster.sections.map(s=>{
          const stressTone = s.stress>50 ? 'ember' : s.stress>30 ? 'bark' : 'pine';
          return (
            <div key={s.key} style={{padding:'7px 0', borderBottom:'1px solid var(--hairline-soft)'}}>
              <div style={{display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:10, alignItems:'center'}}>
                <span className="serif" style={{fontSize:14, color:'var(--birch)', minWidth:80}}>{s.label}</span>
                <div className="bar" style={{height:4}}><i className="silver" style={{width:`${s.strength}%`}}></i></div>
                <span className="num" style={{fontSize:11, color:'var(--birch)', minWidth:24, textAlign:'right'}}>{s.strength}</span>
                <span className="num" style={{fontSize:9, color:`var(--${stressTone})`, minWidth:34, textAlign:'right'}}>STR {s.stress}</span>
              </div>
              <div style={{fontSize:10.5, color:'var(--birch-dim)', marginTop:3, marginLeft:90, fontStyle:'italic'}}>{s.note}</div>
            </div>
          );
        })}
        <div style={{marginTop:8, fontSize:10, color:'var(--silver)', display:'flex', justifyContent:'space-between'}}>
          <span>↗ Open roster ledger</span>
          <span className="num" style={{color:'var(--silver-dim)'}}>36 principals</span>
        </div>
      </div>

      {/* ====== INSET — FINANCE (bottom-left) ====== */}
      <div className="cart-inset" style={{position:'absolute', left:130, bottom:60, width:300, zIndex:6}}>
        <CornerMarks />
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
          <span className="eyebrow" style={{color:'var(--silver)'}}>◇ Inset 03 · Finance</span>
          <span className="num" style={{fontSize:8.5, color:'var(--bark)'}}>YTD</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10}}>
          <div>
            <div className="label" style={{fontSize:8}}>In</div>
            <div className="display" style={{fontSize:17, color:'var(--birch)', fontWeight:500}}>$184K</div>
          </div>
          <div>
            <div className="label" style={{fontSize:8}}>Out</div>
            <div className="display" style={{fontSize:17, color:'var(--birch)', fontWeight:500}}>$163K</div>
          </div>
          <div>
            <div className="label" style={{fontSize:8}}>Net</div>
            <div className="display" style={{fontSize:17, color:'var(--pine)', fontWeight:500}}>+$21K</div>
          </div>
        </div>
        {/* sparkline */}
        <svg width="100%" height="38" viewBox="0 0 280 38" preserveAspectRatio="none">
          <line x1="0" y1="30" x2="280" y2="30" stroke="var(--hairline)" strokeWidth="0.5"/>
          <polyline
            points={M.finance.sparkline.map((v,i)=>`${(i/(M.finance.sparkline.length-1))*280},${36-v*1.2}`).join(' ')}
            fill="none" stroke="var(--silver)" strokeWidth="1"
          />
          {M.finance.sparkline.map((v,i)=>(
            <circle key={i} cx={(i/(M.finance.sparkline.length-1))*280} cy={36-v*1.2} r="1.3" fill="var(--silver)"/>
          ))}
        </svg>
        <div className="label" style={{fontSize:8, marginTop:4, display:'flex', justifyContent:'space-between'}}>
          <span>WK 1</span><span>WK 14</span>
        </div>
        <div style={{marginTop:8, paddingTop:8, borderTop:'1px solid var(--hairline-soft)', display:'flex', gap:6, alignItems:'flex-start'}}>
          <span className="dot ember" style={{marginTop:4}}></span>
          <span style={{fontSize:10.5, color:'var(--ember)', lineHeight:1.35}}>Donor confidence −4 — first warning.</span>
        </div>
      </div>

      {/* ====== INSET — INBOX (bottom-right) ====== */}
      <div className="cart-inset" style={{position:'absolute', right:130, bottom:60, width:320, zIndex:6}}>
        <CornerMarks />
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
          <span className="eyebrow" style={{color:'var(--silver)'}}>◇ Inset 04 · Inbox</span>
          <span className="num" style={{fontSize:8.5, color:'var(--bark)'}}>4 NEW</span>
        </div>
        {M.inbox.map((m,i)=>(
          <div key={i} style={{display:'grid', gridTemplateColumns:'42px 1fr auto', gap:8, padding:'7px 0', borderBottom:i<M.inbox.length-1?'1px solid var(--hairline-soft)':'none', alignItems:'baseline'}}>
            <span className="num" style={{fontSize:8, color:'var(--bark)', letterSpacing:'0.16em', textTransform:'uppercase'}}>{m.kind}</span>
            <span style={{fontSize:11.5, color:'var(--birch)', lineHeight:1.35}}>{m.text}</span>
            <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>{m.time}</span>
          </div>
        ))}
      </div>

      {/* ====== CENTER PIN — Next concert "you are here" detail ====== */}
      <div style={{
        position:'absolute',
        left:`${landmarks[1].x}%`, top:`calc(${landmarks[1].y}% + 80px)`,
        transform:'translateX(-50%)',
        zIndex:7,
        width:380,
      }}>
        <div className="cart-inset" style={{padding:'16px 18px', borderColor:'var(--silver)'}}>
          <CornerMarks />
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
            <span className="eyebrow" style={{color:'var(--bark)'}}>{M.nextConcert.date} · T−{M.nextConcert.daysOut}d</span>
            <span className="pill silver">You are here</span>
          </div>
          <div className="display" style={{fontSize:30, color:'var(--birch)', fontWeight:500, letterSpacing:'-0.005em', marginTop:4, lineHeight:1.1}}>
            {M.nextConcert.name}
          </div>
          <div style={{fontSize:11.5, color:'var(--birch-dim)', marginTop:4, fontStyle:'italic'}}>{M.nextConcert.venue}</div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:12}}>
            {M.nextConcert.workSlots.map(w=>(
              <div key={w.roman} style={{padding:'10px 8px', background:'var(--ink-well)', border:'1px dashed var(--hairline)', textAlign:'center'}}>
                <div className="serif" style={{fontSize:18, color:'var(--silver)', fontStyle:'italic', lineHeight:1}}>{w.roman}</div>
                <div className="num" style={{fontSize:8.5, color:'var(--bark)', marginTop:6, letterSpacing:'0.16em'}}>EMPTY</div>
              </div>
            ))}
          </div>

          <button style={{
            marginTop:14, width:'100%', padding:'12px 14px',
            background:'transparent', border:'1px solid var(--silver)',
            color:'var(--birch)', fontFamily:'var(--display)', fontSize:15, letterSpacing:'0.02em',
            cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'
          }}>
            <span>Open Program Builder</span>
            <span className="num" style={{fontSize:9, color:'var(--silver)', letterSpacing:'0.22em'}}>▸ ENTER</span>
          </button>
        </div>
      </div>

      {/* legend / marginalia */}
      <div style={{position:'absolute', right:24, bottom:18, fontFamily:'var(--mono)', fontSize:8.5, color:'var(--silver-dim)', letterSpacing:'0.16em', textAlign:'right', zIndex:5}}>
        ORCHESTRA MANAGER · KARTTA / SEASON I<br/>
        TAMPERE · SHEET 1 OF 4
      </div>
    </div>
  );
}

window.HomeB = HomeB;
