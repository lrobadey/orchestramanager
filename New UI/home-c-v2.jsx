// Direction C v2 — Stratum with Cartographic Season Trail
// Same canopy/understory/floor as C, but the bottom stratum becomes a
// terrain band: a curving trail through topographic contours, four diamond
// landmarks for the four concerts, and floating annotations connected by
// leader lines. The season feels traversed rather than tabulated.

function HomeCv2(){
  const M = window.MOCK;

  // landmark positions inside the trail svg (viewBox 1440 x 220)
  const TRAIL_W = 1440;
  const TRAIL_H = 220;
  const landmarks = [
    { idx:1, x:240,  y:125, slot:M.season.slots[0] },
    { idx:2, x:540,  y:74,  slot:M.season.slots[1] },
    { idx:3, x:880,  y:104, slot:M.season.slots[2] },
    { idx:4, x:1200, y:55,  slot:M.season.slots[3] },
  ];

  // annotations attach to landmarks via leader lines
  const annotations = [
    { lm:0, side:'top',    x:120,  y:14,  kind:'critic', text:'Helsingin Sanomat: “cautious.”' },
    { lm:1, side:'top',    x:440,  y:10,  kind:'donor',  text:'Lindgren Foundation expects Sibelius.' },
    { lm:2, side:'top',    x:780,  y:10,  kind:'musician', text:'Principal Horn requests time off after II.' },
    { lm:3, side:'top',    x:1150, y:14,  kind:'arc',    text:'Identity arc · adventurous trajectory.' },
  ];

  return (
    <div className="artboard-surface" style={{padding:0}}>
      <div className="strata" style={{gridTemplateRows:'auto auto 1fr auto'}}>

        {/* ===== CANOPY — editorial header (unchanged from C) ===== */}
        <div className="stratum canopy" style={{padding:'22px 56px 18px'}}>
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
                <span key={t} onClick={()=>window.__navigate && window.__navigate(t)} className="serif" style={{fontSize:13, color: i===0?'var(--birch)':'var(--silver-dim)', fontStyle:i===0?'italic':'normal', cursor:'pointer'}}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', alignItems:'end', gap:30}}>
            <div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>The hour · prologue to II</span>
              <h1 className="display" style={{
                fontSize:64, fontWeight:500, letterSpacing:'-0.02em', lineHeight:0.95,
                margin:'8px 0 0', color:'var(--birch)',
              }}>
                <span style={{fontStyle:'italic', color:'var(--silver)', fontWeight:400}}>II.</span> Pohjola is taking shape<span style={{color:'var(--bark)'}}>.</span>
              </h1>
              <p className="serif" style={{fontSize:16, color:'var(--birch-dim)', margin:'8px 0 0', lineHeight:1.4, maxWidth:760, fontStyle:'italic'}}>
                Forty‑one days to curtain. The Lindgren donors are watching for Sibelius. Principal Horn is tired.
              </p>
            </div>

            <div style={{textAlign:'right'}}>
              <div className="display" style={{fontSize:80, color:'var(--birch)', fontWeight:500, lineHeight:1, letterSpacing:'-0.04em'}}>
                {M.nextConcert.daysOut}<span style={{color:'var(--silver)', fontStyle:'italic', fontSize:42, marginLeft:6}}>d</span>
              </div>
              <div className="eyebrow" style={{marginTop:4}}>until curtain · October 26</div>
            </div>
          </div>
        </div>

        {/* ===== UNDERSTORY — vitals + identity (unchanged) ===== */}
        <div className="stratum understory" style={{padding:'14px 56px 16px'}}>
          <div className="rule-brown" style={{marginBottom:12}}></div>

          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:40, alignItems:'start'}}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                <span className="eyebrow">Institutional state of play</span>
                <span className="eyebrow" style={{color:'var(--bark)'}}>read left to right</span>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr 1fr 1fr', gap:0}}>
                {[
                  { label:'Cash', big:'$412.8K', sub:'−$18.4K wk', subTone:'ember' },
                  ...M.institution.vitals.map(v=>({
                    label:v.label, big:String(v.value), sub:(v.delta>=0?'+':'')+v.delta, subTone: v.delta>=0?'pine':'ember', pct:v.value, tone:v.tone
                  }))
                ].map((v,i)=>(
                  <div key={i} style={{padding:'0 16px', borderLeft:i>0?'1px solid var(--hairline-soft)':'none'}}>
                    <div className="eyebrow" style={{fontSize:8.5}}>{v.label}</div>
                    <div className="display" style={{fontSize: i===0?26:24, color:'var(--birch)', fontWeight:500, lineHeight:1.1, letterSpacing:'-0.01em', marginTop:4}}>{v.big}</div>
                    <div className="num" style={{fontSize:9.5, color:`var(--${v.subTone})`, marginTop:2}}>{v.sub}</div>
                    {v.pct != null && (
                      <div style={{height:1, background:'var(--hairline)', marginTop:6, position:'relative'}}>
                        <div style={{position:'absolute', left:0, top:-1, height:3, width:`${v.pct}%`, background:`var(--${v.tone})`}}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{borderLeft:'1px solid var(--hairline)', paddingLeft:30}}>
              <div className="eyebrow" style={{marginBottom:6}}>Identity emerging</div>
              <div className="serif" style={{fontSize:15, color:'var(--birch)', fontStyle:'italic', lineHeight:1.35, marginBottom:10}}>
                Leaning <span style={{color:'var(--silver)'}}>adventurous</span> — Lindgren donors expect Sibelius next.
              </div>
              <div style={{display:'grid', gap:5}}>
                {[
                  { k:'Adventurous', v:M.institution.identity.adventurous, tone:'silver' },
                  { k:'Community',    v:M.institution.identity.community,    tone:'bark' },
                  { k:'Scholarly',    v:M.institution.identity.scholarly,    tone:'pine' },
                ].map(r=>(
                  <div key={r.k} style={{display:'grid', gridTemplateColumns:'100px 1fr 30px', gap:10, alignItems:'center'}}>
                    <span className="serif" style={{fontSize:12.5, color:'var(--birch-dim)'}}>{r.k}</span>
                    <div style={{height:7, background:'var(--ink-well)', position:'relative', border:'1px solid var(--hairline-soft)'}}>
                      <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${r.v}%`, background:`var(--${r.tone})`, opacity:0.85}}></div>
                    </div>
                    <span className="num" style={{fontSize:11, color:'var(--birch)', textAlign:'right'}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== FLOOR — three columns (unchanged) ===== */}
        <div className="stratum floor" style={{padding:'18px 56px', display:'grid', gridTemplateColumns:'1.05fr 1.4fr 1fr', gap:36, minHeight:0}}>

          {/* Roster */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow">Roster · sections</span>
              <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>{M.roster.strength}/100 composite</span>
            </div>
            <div className="rule-silver" style={{marginBottom:12, opacity:0.5}}></div>

            {M.roster.sections.map((s,i)=>{
              const stressTone = s.stress>50 ? 'ember' : s.stress>30 ? 'bark' : 'pine';
              return (
                <div key={s.key} style={{padding:'8px 0', borderBottom:i<M.roster.sections.length-1?'1px solid var(--hairline-soft)':'none'}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr auto auto', gap:10, alignItems:'baseline'}}>
                    <span className="serif" style={{fontSize:17, color:'var(--birch)', letterSpacing:'0.005em'}}>{s.label}</span>
                    <span className="display" style={{fontSize:19, color:'var(--birch)', fontWeight:500, lineHeight:1}}>{s.strength}</span>
                    <span className="num" style={{fontSize:9, color:`var(--${stressTone})`, letterSpacing:'0.12em'}}>STR {s.stress}</span>
                  </div>
                  <div style={{fontSize:11.5, color:'var(--birch-dim)', marginTop:2, fontStyle:'italic'}}>{s.note}</div>
                </div>
              );
            })}

            <div style={{marginTop:12}}>
              <span className="eyebrow">Watch · principals</span>
              <div className="rule-silver" style={{margin:'6px 0 8px', opacity:0.4}}></div>
              {M.roster.principals.slice(0,3).map(p=>(
                <div key={p.name} style={{display:'grid', gridTemplateColumns:'1fr auto auto', padding:'4px 0', alignItems:'baseline', gap:8}}>
                  <span className="serif" style={{fontSize:13, color:'var(--birch)'}}>{p.name} <span className="num" style={{fontSize:9, color:'var(--silver-dim)', marginLeft:4}}>{p.position}</span></span>
                  <span className="num" style={{fontSize:11, color: p.form<60?'var(--ember)':'var(--birch-dim)'}}>F{p.form}</span>
                  <span className="num" style={{fontSize:11, color: p.morale<60?'var(--ember)':'var(--birch-dim)'}}>M{p.morale}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next concert */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow" style={{color:'var(--bark)'}}>The next concert</span>
              <span className="eyebrow">III follows on Jan 11</span>
            </div>
            <div className="rule-brown" style={{marginBottom:12}}></div>

            <div className="display" style={{fontSize:32, color:'var(--birch)', fontWeight:500, letterSpacing:'-0.005em', lineHeight:1.1}}>
              <span style={{fontStyle:'italic', color:'var(--silver)'}}>{M.nextConcert.name.split('·')[0].trim()}</span> · {M.nextConcert.name.split('·')[1].trim()}
            </div>
            <div style={{fontSize:12, color:'var(--birch-dim)', marginTop:4, fontStyle:'italic'}}>{M.nextConcert.venue} · {M.nextConcert.date}</div>

            <div style={{marginTop:14}}>
              {M.nextConcert.workSlots.map((w,i)=>(
                <div key={w.roman} style={{
                  display:'grid', gridTemplateColumns:'60px 1fr auto',
                  padding:'12px 0',
                  borderBottom:'1px solid var(--hairline-soft)',
                  alignItems:'baseline'
                }}>
                  <span className="serif" style={{fontSize:22, color:'var(--silver)', fontStyle:'italic', fontWeight:400}}>{w.roman}.</span>
                  <div>
                    <span className="serif" style={{fontSize:17, color:'var(--birch-dim)', fontStyle:'italic'}}>— open —</span>
                    <div style={{fontSize:11, color:'var(--silver-dim)', marginTop:2, letterSpacing:'0.06em', fontFamily:'var(--mono)', textTransform:'uppercase'}}>{w.note.replace(/^.*?·\s?/,'')}</div>
                  </div>
                  <span className="num" style={{fontSize:9.5, color:'var(--bark)', letterSpacing:'0.18em'}}>＋ ASSIGN</span>
                </div>
              ))}
            </div>

            <div style={{marginTop:14}}>
              <span className="eyebrow">From the library · suggested for II</span>
              <div className="rule-silver" style={{margin:'6px 0 8px', opacity:0.4}}></div>
              {M.nextConcert.candidates.slice(0,3).map((c,i)=>(
                <div key={i} style={{display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:14, padding:'5px 0', alignItems:'baseline'}}>
                  <span><span className="serif" style={{fontSize:13, color:'var(--birch)'}}>{c.composer}, </span><span className="serif" style={{fontSize:13, color:'var(--birch-dim)', fontStyle:'italic'}}>{c.title}</span></span>
                  <span className="num" style={{fontSize:10, color:'var(--silver-dim)'}}>{c.duration}m</span>
                  <span className="num" style={{fontSize:10, color:'var(--birch-dim)'}}>P{c.prestige}</span>
                  <span className="num" style={{fontSize:10, color:'var(--birch-dim)'}}>D{c.draw}</span>
                  <span className="num" style={{fontSize:10, color: c.load>60?'var(--ember)':'var(--silver-dim)'}}>L{c.load}</span>
                </div>
              ))}
            </div>

            <button style={{
              marginTop:16, width:'100%', padding:'14px 18px',
              background:'transparent', border:'1px solid var(--silver-dim)',
              color:'var(--birch)', cursor:'pointer',
              display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'baseline', textAlign:'left'
            }}>
              <span className="serif" style={{fontSize:22, color:'var(--silver)', fontStyle:'italic'}}>▸</span>
              <span className="display" style={{fontSize:18, color:'var(--birch)', fontWeight:500, letterSpacing:'0.01em'}}>Open Program Builder for II</span>
              <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)', letterSpacing:'0.18em'}}>T−{M.nextConcert.daysOut}d</span>
            </button>
          </div>

          {/* Inbox + finance trace */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow">Inbox</span>
              <span className="num" style={{fontSize:9, color:'var(--bark)'}}>4 NEW</span>
            </div>
            <div className="rule-silver" style={{marginBottom:8, opacity:0.5}}></div>

            {M.inbox.map((m,i)=>(
              <div key={i} style={{padding:'8px 0', borderBottom:i<M.inbox.length-1?'1px solid var(--hairline-soft)':'none'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                  <span className="num" style={{fontSize:8.5, color:'var(--bark)', letterSpacing:'0.18em', textTransform:'uppercase'}}>{m.kind}</span>
                  <span className="num" style={{fontSize:8.5, color:'var(--silver-dim)'}}>{m.time}</span>
                </div>
                <div className="serif" style={{fontSize:13, color:'var(--birch)', lineHeight:1.35, fontStyle:'italic'}}>{m.text}</div>
              </div>
            ))}

            <div style={{marginTop:14}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6}}>
                <span className="eyebrow">Finance · 14 wk trace</span>
                <span className="num" style={{fontSize:9.5, color:'var(--pine)'}}>+$21.4K net</span>
              </div>
              <div className="rule-silver" style={{marginBottom:8, opacity:0.5}}></div>
              <svg width="100%" height="44" viewBox="0 0 300 44" preserveAspectRatio="none">
                <line x1="0" y1="34" x2="300" y2="34" stroke="var(--hairline)" strokeWidth="0.5"/>
                <polyline
                  points={M.finance.sparkline.map((v,i)=>`${(i/(M.finance.sparkline.length-1))*300},${42-v*1.4}`).join(' ')}
                  fill="none" stroke="var(--silver)" strokeWidth="1.2"
                />
                {M.finance.sparkline.map((v,i)=>(
                  <circle key={i} cx={(i/(M.finance.sparkline.length-1))*300} cy={42-v*1.4} r="1.4" fill="var(--silver)"/>
                ))}
              </svg>
              <div style={{display:'flex', gap:8, alignItems:'flex-start', marginTop:6}}>
                <span className="dot ember" style={{marginTop:4}}></span>
                <span className="serif" style={{fontSize:12.5, color:'var(--ember)', lineHeight:1.4, fontStyle:'italic'}}>Donor confidence −4 — first warning.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TRAIL — the season terrain (B's idea, woven into C) ===== */}
        <div className="stratum trail" style={{
          padding:0,
          background:'linear-gradient(180deg, #050d0a 0%, #030806 100%)',
          position:'relative',
          height:240,
          overflow:'hidden',
          borderBottom:'none'
        }}>
          {/* topo contours */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:`
              repeating-radial-gradient( ellipse 38% 70% at 18% 90%, transparent 0 16px, rgba(138,107,79,0.10) 16px 17px ),
              repeating-radial-gradient( ellipse 26% 60% at 50% 10%, transparent 0 14px, rgba(138,107,79,0.08) 14px 15px ),
              repeating-radial-gradient( ellipse 30% 70% at 86% 100%, transparent 0 15px, rgba(138,107,79,0.10) 15px 16px )
            `,
            mixBlendMode:'screen',
            opacity:0.85
          }}></div>
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none', opacity:0.07,
            backgroundImage:`linear-gradient(to right, var(--bark) 1px, transparent 1px), linear-gradient(to bottom, var(--bark) 1px, transparent 1px)`,
            backgroundSize:'60px 60px'
          }}></div>

          {/* trail svg with path + leader lines */}
          <svg
            viewBox={`0 0 ${TRAIL_W} ${TRAIL_H}`}
            preserveAspectRatio="none"
            style={{position:'absolute', inset:0, width:'100%', height:'100%', zIndex:2}}
          >
            {/* horizon line */}
            <line x1="0" y1={TRAIL_H-20} x2={TRAIL_W} y2={TRAIL_H-20} stroke="var(--hairline)" strokeWidth="0.5" strokeDasharray="2 6"/>
            <line x1="0" y1="20" x2={TRAIL_W} y2="20" stroke="var(--hairline)" strokeWidth="0.5" strokeDasharray="2 6"/>

            {/* the season path — gentle curve through the four landmarks */}
            <path
              d={`M 0 ${landmarks[0].y+30}
                  Q ${landmarks[0].x-40} ${landmarks[0].y+15}, ${landmarks[0].x} ${landmarks[0].y}
                  S ${landmarks[1].x-40} ${landmarks[1].y}, ${landmarks[1].x} ${landmarks[1].y}
                  S ${landmarks[2].x-40} ${landmarks[2].y}, ${landmarks[2].x} ${landmarks[2].y}
                  S ${landmarks[3].x-40} ${landmarks[3].y}, ${landmarks[3].x} ${landmarks[3].y}
                  T ${TRAIL_W} ${landmarks[3].y-20}`}
              fill="none" stroke="var(--silver-dim)" strokeWidth="1" strokeDasharray="3 4" opacity="0.6"
            />
            {/* resolved leg — solid, brighter */}
            <path
              d={`M 0 ${landmarks[0].y+30}
                  Q ${landmarks[0].x-40} ${landmarks[0].y+15}, ${landmarks[0].x} ${landmarks[0].y}`}
              fill="none" stroke="var(--pine)" strokeWidth="1.5" opacity="0.85"
            />

            {/* leader lines from annotations to landmarks */}
            {annotations.map((a,i)=>{
              const lm = landmarks[a.lm];
              return (
                <g key={i}>
                  <path
                    d={`M ${a.x} ${a.y} L ${(a.x+lm.x)/2} ${(a.y+lm.y)/2} L ${lm.x} ${lm.y}`}
                    fill="none" stroke="var(--silver-dim)" strokeWidth="0.7" opacity="0.55"
                  />
                  <circle cx={lm.x} cy={lm.y} r="2.5" fill="var(--silver)"/>
                </g>
              );
            })}
          </svg>

          {/* season label + compass at far left — compact, hugs the very top */}
          <div style={{position:'absolute', left:18, top:14, zIndex:3, maxWidth:90}}>
            <div className="eyebrow" style={{color:'var(--silver)', whiteSpace:'nowrap'}}>The Season</div>
            <div style={{marginTop:4, fontFamily:'var(--mono)', fontSize:8.5, color:'var(--silver-dim)', letterSpacing:'0.18em', whiteSpace:'nowrap'}}>SEPT ▸ JUNE</div>
          </div>
          <div style={{position:'absolute', left:18, bottom:14, zIndex:3, maxWidth:120}}>
            <div className="serif" style={{fontSize:12, color:'var(--birch-dim)', fontStyle:'italic', lineHeight:1.3}}>1 done · 1 in flight · 2 ahead</div>
            <div style={{fontFamily:'var(--mono)', fontSize:8, color:'var(--silver-dim)', letterSpacing:'0.16em', marginTop:4}}>KARTTA / SEASON I</div>
          </div>

          {/* landmark diamonds (DOM, positioned by px) */}
          {landmarks.map((lm,i)=>{
            const s = lm.slot;
            const active = s.status==='active';
            const done = s.status==='resolved';
            const xPct = (lm.x / TRAIL_W) * 100;
            const yPct = (lm.y / TRAIL_H) * 100;
            return (
              <div key={i} style={{
                position:'absolute', left:`${xPct}%`, top:`${yPct}%`,
                transform:'translate(-50%, -50%)',
                zIndex:5, textAlign:'center', pointerEvents:'auto'
              }}>
                <div style={{
                  width: active?40:28, height: active?40:28,
                  border:`1px solid ${active?'var(--silver)':done?'var(--pine)':'var(--silver-dim)'}`,
                  background: active?'var(--ink-2)':'var(--ink-0)',
                  display:'grid', placeItems:'center',
                  boxShadow: active?'0 0 0 4px rgba(184,192,188,0.10), 0 0 22px rgba(184,192,188,0.18)':'none',
                  transform:'rotate(45deg)',
                  margin:'0 auto'
                }}>
                  <span className="serif" style={{
                    transform:'rotate(-45deg)', fontStyle:'italic',
                    fontSize: active?15:12,
                    color: active?'var(--birch)':done?'var(--pine)':'var(--silver-dim)',
                    fontWeight:500
                  }}>{['I','II','III','IV'][i]}</span>
                </div>
                <div style={{marginTop:8, fontFamily:'var(--mono)', fontSize:8, color:'var(--silver-dim)', letterSpacing:'0.18em', whiteSpace:'nowrap'}}>{s.date.toUpperCase()}</div>
                <div className="serif" style={{fontSize: active?13:11.5, color: active?'var(--birch)':'var(--birch-dim)', marginTop:1, whiteSpace:'nowrap', fontStyle: active?'italic':'normal'}}>
                  {s.name.split('·')[1]?.trim() ?? s.name}
                </div>
                {done && <div className="num" style={{fontSize:8.5, color:'var(--pine)', marginTop:2, letterSpacing:'0.04em'}}>Q{s.quality} · {s.attendance.toLocaleString()} seats</div>}
                {active && <div className="num" style={{fontSize:8.5, color:'var(--bark)', marginTop:2, letterSpacing:'0.18em'}}>● PROGRAMMING</div>}
                {s.status==='locked' && <div className="num" style={{fontSize:8.5, color:'var(--silver-dim)', marginTop:2, letterSpacing:'0.18em'}}>○ LOCKED</div>}
                {s.headline && (
                  <div className="serif" style={{
                    fontSize:11.5, color: active?'var(--silver)':'var(--birch-dim)',
                    fontStyle:'italic', lineHeight:1.3, marginTop:4,
                    maxWidth:150, marginLeft:'auto', marginRight:'auto', whiteSpace:'normal'
                  }}>“{s.headline}”</div>
                )}
              </div>
            );
          })}

          {/* floating annotations connected by leader lines */}
          {annotations.map((a,i)=>{
            const xPct = (a.x / TRAIL_W) * 100;
            const yPct = (a.y / TRAIL_H) * 100;
            return (
              <div key={i} style={{
                position:'absolute', left:`${xPct}%`, top:`${yPct}%`,
                transform: a.side==='bottom'?'translate(-50%, -100%)':'translate(-50%, 0)',
                zIndex:4, maxWidth:220, pointerEvents:'auto'
              }}>
                <div style={{display:'flex', alignItems:'baseline', gap:8, justifyContent: a.side==='bottom'?'flex-start':'flex-start', whiteSpace:'nowrap'}}>
                  <span className="num" style={{fontSize:8, color:'var(--bark)', letterSpacing:'0.18em', textTransform:'uppercase'}}>{a.kind}</span>
                  <span style={{height:1, width:14, background:'var(--silver-dim)', opacity:0.5}}></span>
                </div>
                <div className="serif" style={{fontSize:12, color:'var(--birch-dim)', fontStyle:'italic', lineHeight:1.3, marginTop:2, whiteSpace:'normal'}}>
                  {a.text}
                </div>
              </div>
            );
          })}

          {/* right-edge marginalia: next season hint — compact */}
          <div style={{position:'absolute', right:18, top:14, zIndex:3, textAlign:'right', maxWidth:120}}>
            <div className="eyebrow" style={{color:'var(--silver-dim)', whiteSpace:'nowrap'}}>NEXT TURN</div>
            <div className="serif" style={{fontSize:12, color:'var(--birch-dim)', fontStyle:'italic', marginTop:4, lineHeight:1.3}}>Season II glimpsed →</div>
          </div>
          <div style={{position:'absolute', right:18, bottom:14, zIndex:3, fontFamily:'var(--mono)', fontSize:8.5, color:'var(--silver-dim)', letterSpacing:'0.16em', textTransform:'uppercase', textAlign:'right'}}>
            Wk 6 · II in 41d
          </div>
        </div>
      </div>
    </div>
  );
}

window.HomeCv2 = HomeCv2;
