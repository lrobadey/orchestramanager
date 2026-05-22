// Direction C — Stratum / Editorial Depth
// Horizontal bands at different depths of the forest.
// Display serif headlines, dense sub-grid, hairline brown rules. Concert program in motion.

function HomeC(){
  const M = window.MOCK;

  return (
    <div className="artboard-surface" style={{padding:0}}>
      <div className="strata">

        {/* ===== CANOPY — editorial header ===== */}
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
                <span key={t} className="serif" style={{fontSize:13, color: i===0?'var(--birch)':'var(--silver-dim)', fontStyle:i===0?'italic':'normal', cursor:'pointer'}}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', alignItems:'end', gap:30}}>
            <div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>The hour · prologue to II</span>
              <h1 className="display" style={{
                fontSize:68, fontWeight:500, letterSpacing:'-0.02em', lineHeight:0.95,
                margin:'8px 0 0', color:'var(--birch)',
              }}>
                <span style={{fontStyle:'italic', color:'var(--silver)', fontWeight:400}}>II.</span> Pohjola is taking shape<span style={{color:'var(--bark)'}}>.</span>
              </h1>
              <p className="serif" style={{fontSize:17, color:'var(--birch-dim)', margin:'10px 0 0', lineHeight:1.4, maxWidth:760, fontStyle:'italic'}}>
                Forty‑one days to curtain. The Lindgren donors are watching for Sibelius. Principal Horn is tired. The hall is open the 24th through the 26th.
              </p>
            </div>

            <div style={{textAlign:'right'}}>
              <div className="display" style={{fontSize:90, color:'var(--birch)', fontWeight:500, lineHeight:1, letterSpacing:'-0.04em'}}>
                {M.nextConcert.daysOut}<span style={{color:'var(--silver)', fontStyle:'italic', fontSize:48, marginLeft:6}}>d</span>
              </div>
              <div className="eyebrow" style={{marginTop:4}}>until curtain · October 26</div>
            </div>
          </div>
        </div>

        {/* ===== UNDERSTORY — vitals + identity inscription ===== */}
        <div className="stratum understory" style={{padding:'18px 56px'}}>
          <div className="rule-brown" style={{marginBottom:14}}></div>

          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:40, alignItems:'start'}}>
            {/* Vitals as a typographic line */}
            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
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
                    <div className="display" style={{fontSize: i===0?28:26, color:'var(--birch)', fontWeight:500, lineHeight:1.1, letterSpacing:'-0.01em', marginTop:4}}>{v.big}</div>
                    <div className="num" style={{fontSize:9.5, color:`var(--${v.subTone})`, marginTop:2}}>{v.sub}</div>
                    {v.pct != null && (
                      <div style={{height:1, background:'var(--hairline)', marginTop:8, position:'relative'}}>
                        <div style={{position:'absolute', left:0, top:-1, height:3, width:`${v.pct}%`, background:`var(--${v.tone})`}}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Identity dial */}
            <div style={{borderLeft:'1px solid var(--hairline)', paddingLeft:30}}>
              <div className="eyebrow" style={{marginBottom:8}}>Identity emerging</div>
              <div className="serif" style={{fontSize:17, color:'var(--birch)', fontStyle:'italic', lineHeight:1.35, marginBottom:12}}>
                Leaning <span style={{color:'var(--silver)'}}>adventurous</span> — Lindgren donors expect Sibelius next.
              </div>
              <div style={{display:'grid', gap:6}}>
                {[
                  { k:'Adventurous', v:M.institution.identity.adventurous, tone:'silver' },
                  { k:'Community',    v:M.institution.identity.community,    tone:'bark' },
                  { k:'Scholarly',    v:M.institution.identity.scholarly,    tone:'pine' },
                ].map(r=>(
                  <div key={r.k} style={{display:'grid', gridTemplateColumns:'100px 1fr 30px', gap:10, alignItems:'center'}}>
                    <span className="serif" style={{fontSize:13, color:'var(--birch-dim)'}}>{r.k}</span>
                    <div style={{height:8, background:'var(--ink-well)', position:'relative', border:'1px solid var(--hairline-soft)'}}>
                      <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${r.v}%`, background:`var(--${r.tone})`, opacity:0.85}}></div>
                    </div>
                    <span className="num" style={{fontSize:11, color:'var(--birch)', textAlign:'right'}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== FLOOR — three columns ===== */}
        <div className="stratum floor" style={{padding:'22px 56px', display:'grid', gridTemplateColumns:'1.05fr 1.4fr 1fr', gap:36, minHeight:0}}>

          {/* Roster */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow">Roster · sections</span>
              <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>{M.roster.strength}/100 composite</span>
            </div>
            <div className="rule-silver" style={{marginBottom:14, opacity:0.5}}></div>

            {M.roster.sections.map((s,i)=>{
              const stressTone = s.stress>50 ? 'ember' : s.stress>30 ? 'bark' : 'pine';
              return (
                <div key={s.key} style={{padding:'9px 0', borderBottom:i<M.roster.sections.length-1?'1px solid var(--hairline-soft)':'none'}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr auto auto', gap:10, alignItems:'baseline'}}>
                    <span className="serif" style={{fontSize:18, color:'var(--birch)', letterSpacing:'0.005em'}}>{s.label}</span>
                    <span className="display" style={{fontSize:20, color:'var(--birch)', fontWeight:500, lineHeight:1}}>{s.strength}</span>
                    <span className="num" style={{fontSize:9, color:`var(--${stressTone})`, letterSpacing:'0.12em'}}>STR {s.stress}</span>
                  </div>
                  <div style={{fontSize:11.5, color:'var(--birch-dim)', marginTop:2, fontStyle:'italic'}}>{s.note}</div>
                </div>
              );
            })}

            <div style={{marginTop:14}}>
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

          {/* Next concert — editorial center */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow" style={{color:'var(--bark)'}}>The next concert</span>
              <span className="eyebrow">III follows on Jan 11</span>
            </div>
            <div className="rule-brown" style={{marginBottom:14}}></div>

            <div className="display" style={{fontSize:34, color:'var(--birch)', fontWeight:500, letterSpacing:'-0.005em', lineHeight:1.1}}>
              <span style={{fontStyle:'italic', color:'var(--silver)'}}>{M.nextConcert.name.split('·')[0].trim()}</span> · {M.nextConcert.name.split('·')[1].trim()}
            </div>
            <div style={{fontSize:12, color:'var(--birch-dim)', marginTop:4, fontStyle:'italic'}}>{M.nextConcert.venue} · {M.nextConcert.date}</div>

            {/* programme as a typeset list of openings */}
            <div style={{marginTop:18}}>
              {M.nextConcert.workSlots.map((w,i)=>(
                <div key={w.roman} style={{
                  display:'grid', gridTemplateColumns:'60px 1fr auto',
                  padding:'14px 0',
                  borderBottom:'1px solid var(--hairline-soft)',
                  alignItems:'baseline'
                }}>
                  <span className="serif" style={{fontSize:24, color:'var(--silver)', fontStyle:'italic', fontWeight:400}}>{w.roman}.</span>
                  <div>
                    <span className="serif" style={{fontSize:18, color:'var(--birch-dim)', fontStyle:'italic'}}>— open —</span>
                    <div style={{fontSize:11, color:'var(--silver-dim)', marginTop:2, letterSpacing:'0.06em', fontFamily:'var(--mono)', textTransform:'uppercase'}}>{w.note.replace(/^.*?·\s?/,'')}</div>
                  </div>
                  <span className="num" style={{fontSize:9.5, color:'var(--bark)', letterSpacing:'0.18em'}}>＋ ASSIGN</span>
                </div>
              ))}
            </div>

            <div style={{marginTop:16}}>
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
              marginTop:20, width:'100%', padding:'16px 18px',
              background:'transparent', border:'1px solid var(--silver-dim)',
              color:'var(--birch)', cursor:'pointer',
              display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'baseline', textAlign:'left'
            }}>
              <span className="serif" style={{fontSize:22, color:'var(--silver)', fontStyle:'italic'}}>▸</span>
              <span className="display" style={{fontSize:19, color:'var(--birch)', fontWeight:500, letterSpacing:'0.01em'}}>Open Program Builder for II</span>
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
              <div key={i} style={{padding:'9px 0', borderBottom:i<M.inbox.length-1?'1px solid var(--hairline-soft)':'none'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                  <span className="num" style={{fontSize:8.5, color:'var(--bark)', letterSpacing:'0.18em', textTransform:'uppercase'}}>{m.kind}</span>
                  <span className="num" style={{fontSize:8.5, color:'var(--silver-dim)'}}>{m.time}</span>
                </div>
                <div className="serif" style={{fontSize:13, color:'var(--birch)', lineHeight:1.35, fontStyle:'italic'}}>{m.text}</div>
              </div>
            ))}

            <div style={{marginTop:18}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow">Finance · 14 wk trace</span>
                <span className="num" style={{fontSize:9.5, color:'var(--pine)'}}>+$21.4K net</span>
              </div>
              <div className="rule-silver" style={{marginBottom:10, opacity:0.5}}></div>
              <svg width="100%" height="50" viewBox="0 0 300 50" preserveAspectRatio="none">
                <line x1="0" y1="38" x2="300" y2="38" stroke="var(--hairline)" strokeWidth="0.5"/>
                <polyline
                  points={M.finance.sparkline.map((v,i)=>`${(i/(M.finance.sparkline.length-1))*300},${46-v*1.6}`).join(' ')}
                  fill="none" stroke="var(--silver)" strokeWidth="1.2"
                />
                {M.finance.sparkline.map((v,i)=>(
                  <circle key={i} cx={(i/(M.finance.sparkline.length-1))*300} cy={46-v*1.6} r="1.6" fill="var(--silver)"/>
                ))}
              </svg>
              <div style={{display:'flex', gap:8, alignItems:'flex-start', marginTop:8}}>
                <span className="dot ember" style={{marginTop:4}}></span>
                <span className="serif" style={{fontSize:12.5, color:'var(--ember)', lineHeight:1.4, fontStyle:'italic'}}>Donor confidence −4 — first warning.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== DUFF — season timeline ===== */}
        <div className="stratum duff" style={{padding:'14px 56px 18px'}}>
          <div className="rule-brown" style={{marginBottom:14}}></div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24}}>
            {M.season.slots.map((s,i)=>{
              const active = s.status==='active';
              const done = s.status==='resolved';
              return (
                <div key={s.idx} style={{opacity: s.status==='locked'?0.5:1, position:'relative'}}>
                  <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:4}}>
                    <span className="serif" style={{fontSize:24, fontStyle:'italic', color: active?'var(--silver)':done?'var(--pine)':'var(--silver-dim)', fontWeight:400}}>
                      {s.name.split('·')[0].trim()}.
                    </span>
                    <span className="serif" style={{fontSize:14, color:'var(--birch)'}}>{s.name.split('·')[1]?.trim()}</span>
                    <span className="num" style={{fontSize:9, color:'var(--silver-dim)', marginLeft:'auto'}}>{s.date}</span>
                  </div>
                  <div style={{height:2, background: done?'var(--pine)':active?'var(--silver)':'var(--hairline)', marginBottom:6}}></div>
                  <div style={{fontSize:11, color:'var(--birch-dim)', lineHeight:1.35, fontStyle: active?'italic':'normal'}}>
                    {done && <>Quality <span className="num" style={{color:'var(--birch)'}}>{s.quality}</span> · {s.attendance.toLocaleString()} seats · {s.headline}</>}
                    {active && s.headline}
                    {s.status==='locked' && '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

window.HomeC = HomeC;
