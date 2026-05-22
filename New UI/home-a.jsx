// Direction A — Cockpit / Notched Bezel
// One frame, many bays. Hairline silver cutouts, monospaced bay codes.
// Reads like a marine / aviation instrument panel.

function Bay({ code, title, right, style, children }){
  return (
    <div className="cpa-frame" style={{padding:'18px 16px 14px', ...style}}>
      <span className="corner-bl"></span><span className="corner-br"></span>
      <span className="cpa-bay-title">{title}</span>
      {code && <span className="cpa-bay-id">{code}</span>}
      {right}
      {children}
    </div>
  );
}

function VitalBlock({ v }){
  const tone = v.tone || 'silver';
  return (
    <div style={{display:'grid', gridTemplateRows:'auto auto auto', gap:6, paddingRight:14, borderRight:'1px solid var(--hairline)'}}>
      <span className="label">{v.label}</span>
      <div style={{display:'flex', alignItems:'baseline', gap:8}}>
        <span className="display" style={{fontSize:28, fontWeight:500, color:'var(--birch)', letterSpacing:'-0.01em'}}>{v.value}</span>
        <span className="num" style={{fontSize:10, color: v.delta>=0 ? 'var(--pine)' : 'var(--ember)'}}>
          {v.delta>=0?'+':''}{v.delta}
        </span>
      </div>
      <div className="bar"><i className={tone} style={{width:`${v.value}%`}}></i></div>
    </div>
  );
}

function SectionRow({ s }){
  const stressTone = s.stress>50 ? 'ember' : s.stress>30 ? 'bark' : 'pine';
  return (
    <div style={{display:'grid', gridTemplateColumns:'46px 1fr auto', gap:10, alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--hairline-soft)'}}>
      <div className="well" style={{padding:'8px 0', textAlign:'center'}}>
        <div className="display" style={{fontSize:22, color:'var(--birch)', lineHeight:1, fontWeight:500}}>{s.strength}</div>
        <div className="num" style={{fontSize:8, color:'var(--silver-dim)', marginTop:2, letterSpacing:'0.1em'}}>STR</div>
      </div>
      <div>
        <div className="serif" style={{fontSize:15, color:'var(--birch)', letterSpacing:'0.01em'}}>{s.label}</div>
        <div style={{fontSize:11, color:'var(--birch-dim)', marginTop:2, lineHeight:1.3}}>{s.note}</div>
        <div style={{display:'flex', gap:10, marginTop:6, alignItems:'center'}}>
          <span className="label" style={{fontSize:8.5}}>DMD</span>
          <div className="bar" style={{flex:1, maxWidth:60}}><i className="silver" style={{width:`${s.demand}%`}}></i></div>
          <span className="label" style={{fontSize:8.5}}>STR</span>
          <div className="bar" style={{flex:1, maxWidth:60}}><i className={stressTone} style={{width:`${s.stress}%`}}></i></div>
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        <div className="num" style={{fontSize:10, color:'var(--silver-dim)'}}>{s.principalCount} chairs</div>
        <div className="label" style={{fontSize:8.5, color:'var(--bark)', marginTop:6}}>OPEN ▸</div>
      </div>
    </div>
  );
}

function HomeA(){
  const M = window.MOCK;

  return (
    <div className="artboard-surface">
      <div className="cpa">
        {/* ============ HEADER ============ */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'baseline', gap:18}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <div style={{width:22,height:22, border:'1px solid var(--silver-dim)', display:'grid', placeItems:'center', color:'var(--silver)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em'}}>OM</div>
              <span className="display" style={{fontSize:18, color:'var(--birch)', fontWeight:500, letterSpacing:'0.02em'}}>{M.institution.name}</span>
            </div>
            <span className="eyebrow">{M.institution.city}</span>
            <span className="eyebrow" style={{color:'var(--bark)'}}>{M.institution.seasonLabel}</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:14}}>
            <span className="label">Wk 6 · Oct 17</span>
            <span className="pill silver">Programming II</span>
            <button style={{background:'transparent', border:'1px solid var(--hairline)', color:'var(--birch)', padding:'7px 12px', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', cursor:'pointer'}}>Advance Week ▸</button>
          </div>
        </div>

        {/* ============ VITALS STRIP — single notched bay ============ */}
        <Bay code="INS·01" title="Institutional Vitals" right={
          <div style={{position:'absolute', top:-7, right:80, padding:'0 8px', background:'var(--ink-1)'}}>
            <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>SYNC · stable</span>
          </div>
        }>
          <div style={{display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr 1fr 1fr 1fr 1.3fr', gap:14, alignItems:'center'}}>
            {/* cash gets a slightly larger well */}
            <div style={{display:'grid', gridTemplateRows:'auto auto auto', gap:6, paddingRight:14, borderRight:'1px solid var(--hairline)'}}>
              <span className="label">Cash on Hand</span>
              <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                <span className="display" style={{fontSize:32, fontWeight:500, color:'var(--birch)', letterSpacing:'-0.01em'}}>$412.8K</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <span className="num" style={{fontSize:10, color:'var(--ember)'}}>−$18.4K wk</span>
                <span className="num" style={{fontSize:10, color:'var(--birch-dim)'}}>· runway 14 wk</span>
              </div>
            </div>
            {M.institution.vitals.map(v=>(<VitalBlock key={v.key} v={v} />))}
            {/* Identity inset */}
            <div className="well" style={{padding:'10px 12px'}}>
              <div className="label" style={{fontSize:8.5, marginBottom:8}}>Identity Orientation</div>
              {[['Adventurous','adventurous','silver'],['Community','community','bark'],['Scholarly','scholarly','pine']].map(([lab,k,tone])=>(
                <div key={k} style={{display:'grid', gridTemplateColumns:'70px 1fr 24px', gap:8, alignItems:'center', marginTop:4}}>
                  <span className="num" style={{fontSize:9.5, color:'var(--birch-dim)'}}>{lab}</span>
                  <div className="bar"><i className={tone} style={{width:`${M.institution.identity[k]}%`}}></i></div>
                  <span className="num" style={{fontSize:10, color:'var(--birch)', textAlign:'right'}}>{M.institution.identity[k]}</span>
                </div>
              ))}
            </div>
          </div>
        </Bay>

        {/* ============ MAIN GRID ============ */}
        <div style={{display:'grid', gridTemplateColumns:'340px 1fr 340px', gap:14, minHeight:0}}>

          {/* LEFT — Roster bay */}
          <Bay code="ROS·02" title="Roster — Sections">
            <div className="display" style={{fontSize:14, color:'var(--birch-dim)', marginBottom:6}}>
              Composite strength
              <span className="display" style={{fontSize:30, color:'var(--birch)', marginLeft:10, fontWeight:500}}>{M.roster.strength}</span>
              <span className="num" style={{fontSize:10, color:'var(--silver-dim)', marginLeft:8}}>/ 100</span>
            </div>
            <div className="bar" style={{height:5, marginBottom:14}}><i className="silver" style={{width:`${M.roster.strength}%`}}></i></div>
            {M.roster.sections.map(s=>(<SectionRow key={s.key} s={s} />))}
            <div style={{marginTop:14, paddingTop:12, borderTop:'1px solid var(--hairline)'}}>
              <div className="eyebrow" style={{marginBottom:8}}>Watchlist · Principals</div>
              {M.roster.principals.slice(0,3).map(p=>(
                <div key={p.name} style={{display:'grid', gridTemplateColumns:'1fr auto auto', gap:8, padding:'4px 0', alignItems:'center'}}>
                  <div>
                    <div className="serif" style={{fontSize:13, color:'var(--birch)'}}>{p.name}</div>
                    <div className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>{p.position.toUpperCase()}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="num" style={{fontSize:9.5, color:'var(--birch-dim)'}}>FORM</div>
                    <div className="num" style={{fontSize:13, color: p.form>=70?'var(--birch)':'var(--ember)'}}>{p.form}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="num" style={{fontSize:9.5, color:'var(--birch-dim)'}}>MRL</div>
                    <div className="num" style={{fontSize:13, color: p.morale>=60?'var(--birch)':'var(--ember)'}}>{p.morale}</div>
                  </div>
                </div>
              ))}
            </div>
          </Bay>

          {/* CENTER — Next Concert bay (the F1 "next race" card) */}
          <Bay code="CON·II" title="Next Concert">
            <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:14, alignItems:'baseline'}}>
              <div>
                <span className="eyebrow" style={{color:'var(--bark)'}}>{M.nextConcert.date} · {M.nextConcert.venue}</span>
                <div className="display" style={{fontSize:42, color:'var(--birch)', fontWeight:500, letterSpacing:'-0.01em', marginTop:4, lineHeight:1.05}}>
                  {M.nextConcert.name}
                </div>
              </div>
              <div className="well" style={{padding:'10px 16px', textAlign:'right'}}>
                <div className="num" style={{fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.18em'}}>T−</div>
                <div className="display" style={{fontSize:36, color:'var(--silver)', fontWeight:500, lineHeight:1}}>{M.nextConcert.daysOut}</div>
                <div className="num" style={{fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.18em', marginTop:2}}>DAYS</div>
              </div>
            </div>

            {/* Three program slot prompts — show as inset wells with "open" state */}
            <div style={{marginTop:18}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow">Programme · 3 slots open</span>
                <span className="pill bark">Rehearsals begin {M.nextConcert.rehearsalStart}</span>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
                {M.nextConcert.workSlots.map(w=>(
                  <div key={w.roman} className="well" style={{padding:'14px 12px', minHeight:104, display:'grid', gridTemplateRows:'auto 1fr auto'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span className="serif" style={{fontSize:16, color:'var(--silver)', fontStyle:'italic'}}>{w.roman}</span>
                      <span className="num" style={{fontSize:9, color:'var(--bark)'}}>EMPTY</span>
                    </div>
                    <div style={{fontSize:11, color:'var(--birch-dim)', marginTop:8}}>{w.note}</div>
                    <div className="label" style={{fontSize:8.5, color:'var(--silver)', marginTop:8}}>＋ ASSIGN ▸</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate ticker — suggestions from repertoire that fit the slot */}
            <div style={{marginTop:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>Suggested from repertoire · 4 of 27</div>
              <div style={{display:'grid', gap:6}}>
                {M.nextConcert.candidates.slice(0,3).map((c,i)=>(
                  <div key={i} style={{display:'grid', gridTemplateColumns:'140px 1fr 50px 50px 50px 50px', gap:10, padding:'8px 10px', background:'rgba(0,0,0,0.18)', border:'1px solid var(--hairline-soft)', alignItems:'baseline'}}>
                    <div className="serif" style={{fontSize:12.5, color:'var(--birch)'}}>{c.composer}</div>
                    <div style={{fontSize:12, color:'var(--birch-dim)', fontStyle:'italic'}}>{c.title}</div>
                    <div className="num" style={{fontSize:10, color:'var(--silver)', textAlign:'right'}}>{c.duration}m</div>
                    <div className="num" style={{fontSize:10, color:'var(--birch-dim)', textAlign:'right'}}>P{c.prestige}</div>
                    <div className="num" style={{fontSize:10, color:'var(--birch-dim)', textAlign:'right'}}>D{c.draw}</div>
                    <div className="num" style={{fontSize:10, color: c.load>60?'var(--ember)':'var(--silver-dim)', textAlign:'right'}}>L{c.load}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA — the F1 "begin session" button */}
            <div style={{marginTop:18, display:'flex', gap:10, alignItems:'stretch'}}>
              <button style={{
                flex:1, padding:'16px 18px',
                background:'linear-gradient(180deg, #1a2e25, #122019)',
                border:'1px solid var(--silver-dim)',
                color:'var(--birch)',
                fontFamily:'var(--display)', fontSize:18, fontWeight:500, letterSpacing:'0.02em',
                cursor:'pointer', textAlign:'left',
                position:'relative'
              }}>
                <span style={{display:'block', fontFamily:'var(--mono)', fontSize:9, color:'var(--silver)', letterSpacing:'0.22em', marginBottom:4}}>OPEN ▸</span>
                Program Builder — Concert II
              </button>
              <button style={{padding:'16px 18px', background:'transparent', border:'1px solid var(--hairline)', color:'var(--birch-dim)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', cursor:'pointer'}}>
                Skip to<br/>Concert
              </button>
            </div>
          </Bay>

          {/* RIGHT — Finance + Inbox stacked */}
          <div style={{display:'grid', gridTemplateRows:'auto 1fr', gap:14, minHeight:0}}>
            <Bay code="FIN·03" title="Finance · YTD">
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10}}>
                <div>
                  <div className="label" style={{fontSize:8.5}}>Income</div>
                  <div className="display" style={{fontSize:20, color:'var(--birch)', fontWeight:500}}>$184K</div>
                </div>
                <div>
                  <div className="label" style={{fontSize:8.5}}>Expenses</div>
                  <div className="display" style={{fontSize:20, color:'var(--birch)', fontWeight:500}}>$162.6K</div>
                </div>
              </div>
              <div className="well" style={{padding:'10px 12px', display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
                <span className="label" style={{fontSize:9}}>Net</span>
                <span className="display" style={{fontSize:22, color:'var(--pine)', fontWeight:500}}>+$21.4K</span>
              </div>
              {/* sparkline (CSS bars) */}
              <div style={{display:'flex', alignItems:'flex-end', gap:3, height:34, marginTop:10}}>
                {M.finance.sparkline.map((v,i)=>(
                  <div key={i} style={{flex:1, height:`${v*3.5}%`, background: i===M.finance.sparkline.length-1?'var(--silver)':'var(--silver-dim)', opacity: i===M.finance.sparkline.length-1?1:0.4}}></div>
                ))}
              </div>
              <div className="label" style={{fontSize:8.5, marginTop:8}}>Wk 1 ─────── Wk 14</div>
              {M.finance.riskFlags.length>0 && (
                <div style={{marginTop:10, paddingTop:10, borderTop:'1px solid var(--hairline)'}}>
                  {M.finance.riskFlags.map((r,i)=>(
                    <div key={i} style={{display:'flex', gap:8, alignItems:'flex-start'}}>
                      <span className="dot ember" style={{marginTop:5}}></span>
                      <span style={{fontSize:11.5, color:'var(--ember)', lineHeight:1.4}}>{r.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </Bay>

            <Bay code="MSG·04" title="Inbox">
              {M.inbox.map((m,i)=>(
                <div key={i} style={{padding:'9px 0', borderBottom:i<M.inbox.length-1?'1px solid var(--hairline-soft)':'none'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                    <span className="num" style={{fontSize:8.5, color:'var(--bark)', letterSpacing:'0.18em', textTransform:'uppercase'}}>{m.kind}</span>
                    <span className="num" style={{fontSize:8.5, color:'var(--silver-dim)'}}>{m.time} ago</span>
                  </div>
                  <div style={{fontSize:12, color:'var(--birch)', lineHeight:1.35}}>{m.text}</div>
                </div>
              ))}
            </Bay>
          </div>
        </div>

        {/* ============ FOOT — season timeline ============ */}
        <Bay code="SEA·00" title="Season Timeline">
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:0}}>
            {M.season.slots.map((s,i)=>{
              const active = s.status==='active';
              const done = s.status==='resolved';
              return (
                <div key={s.idx} style={{
                  padding:'8px 14px',
                  borderLeft: i>0?'1px solid var(--hairline)':'none',
                  position:'relative',
                  opacity: s.status==='locked'?0.5:1
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                    <span className="eyebrow" style={{color: active?'var(--silver)':done?'var(--pine)':'var(--silver-dim)'}}>
                      {active?'● NOW':done?'✓ DONE':'○ LOCKED'}
                    </span>
                    <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>{s.date}</span>
                  </div>
                  <div className="serif" style={{fontSize:14, color:'var(--birch)', marginTop:2}}>{s.name}</div>
                  <div style={{fontSize:11, color:'var(--birch-dim)', marginTop:2, lineHeight:1.3}}>
                    {done && <>Quality <span className="num" style={{color:'var(--birch)'}}>{s.quality}</span> · Attn <span className="num" style={{color:'var(--birch)'}}>{s.attendance.toLocaleString()}</span></>}
                    {active && s.headline}
                    {s.status==='locked' && <span style={{color:'var(--silver-dim)', fontStyle:'italic'}}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Bay>

      </div>
    </div>
  );
}

window.HomeA = HomeA;
