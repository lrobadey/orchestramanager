// Post-concert Report screen
// Editorial verdict, performance hero numbers, per-section outcomes,
// audience mix with response, critic quotes, roster aftermath, institutional deltas.

const { useMemo: useMR } = React;

function fmtRK(n){ if (n == null) return '—'; const k = n/1000; return (k>=0?'+':'−')+'$'+Math.abs(k).toFixed(Math.abs(k)>=100?0:1)+'K'; }
function fmtR(n){ if (n==null) return '—'; return (n>=0?'+':'')+n; }

function qTone(v){
  if (v>=70) return 'pine';
  if (v>=55) return 'silver';
  if (v>=40) return 'bark';
  return 'ember';
}

function qLabel(v){
  if (v>=85) return 'Exceptional';
  if (v>=70) return 'Strong';
  if (v>=55) return 'Solid';
  if (v>=40) return 'Uneven';
  if (v>=25) return 'Weak';
  return 'Poor';
}

function Report(){
  const M = window.MOCK;
  const R = M.report;
  const I = M.institution;

  return (
    <div className="artboard-surface" style={{padding:0}}>
      <div style={{display:'grid', gridTemplateRows:'auto 1fr auto', height:'100%'}}>

        {/* ===== CANOPY ===== */}
        <div className="stratum canopy" style={{padding:'18px 40px 18px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12}}>
            <div style={{display:'flex', alignItems:'baseline', gap:18}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{width:24,height:24, border:'1px solid var(--silver-dim)', display:'grid', placeItems:'center', color:'var(--silver)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em'}}>OM</div>
                <span className="display" style={{fontSize:16, color:'var(--birch)', fontWeight:500, letterSpacing:'0.04em'}}>{I.name}</span>
              </div>
              <span className="eyebrow">{I.seasonLabel}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:16}}>
              <span className="eyebrow">Post-concert report</span>
              <span className="num" style={{fontSize:9, color:'var(--silver)', letterSpacing:'0.22em'}}>● RESOLVED</span>
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', alignItems:'end', gap:30}}>
            <div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>Concert {R.concertIdx} · {R.concertDate} · {R.venue}</span>
              <h1 className="display" style={{fontSize:54, fontWeight:500, letterSpacing:'-0.02em', lineHeight:0.95, margin:'6px 0 0', color:'var(--birch)'}}>
                <span style={{fontStyle:'italic', color:'var(--silver)', fontWeight:400}}>{R.concertName.split('·')[0].trim()}.</span> {R.verdict}
              </h1>
              <p className="serif" style={{fontSize:15, color:'var(--birch-dim)', margin:'8px 0 0', lineHeight:1.4, fontStyle:'italic', maxWidth:800}}>
                {R.verdictLong}
              </p>
              <div style={{display:'flex', gap:14, marginTop:10}}>
                {R.works.map((w,i)=>(
                  <span key={i} className="serif" style={{fontSize:12.5, color:'var(--birch-dim)', fontStyle:'italic'}}>
                    {w.composer} · <span style={{color:'var(--birch)'}}>{w.title}</span>
                    {i<R.works.length-1 && <span style={{color:'var(--bark)', marginLeft:14}}>·</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* 4 hero numbers */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
              {[
                { k:'QUALITY',    v:R.performanceQuality, label:qLabel(R.performanceQuality), tone:qTone(R.performanceQuality) },
                { k:'AUDIENCE',   v:R.audienceResponse,   label:qLabel(R.audienceResponse),   tone:qTone(R.audienceResponse) },
                { k:'ATTENDANCE', v:R.attendance.toLocaleString(), label:`${R.capacityPercent}% capacity`, tone:'silver' },
                { k:'NET',        v:fmtRK(R.net),         label:'cash impact',                 tone:R.net>=0?'pine':'ember' },
              ].map(s=>(
                <div key={s.k} style={{textAlign:'right'}}>
                  <div className="eyebrow" style={{color: s.tone==='pine'?'var(--pine)':s.tone==='ember'?'var(--ember)':'var(--silver-dim)'}}>{s.k}</div>
                  <div className="display" style={{fontSize:42, color: s.tone==='pine'?'var(--pine)':s.tone==='ember'?'var(--ember)':'var(--birch)', fontWeight:500, lineHeight:0.85, letterSpacing:'-0.03em'}}>{s.v}</div>
                  <div className="num" style={{fontSize:9, color:'var(--silver-dim)', marginTop:2, letterSpacing:'0.06em'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== FLOOR — 3 columns ===== */}
        <div style={{
          padding:'14px 40px 14px',
          display:'grid', gridTemplateColumns:'1.05fr 1.05fr 1fr', gap:24,
          minHeight:0, overflow:'hidden',
          background:'linear-gradient(180deg, #07110d, #050d0a)'
        }}>

          {/* LEFT — section outcomes + notable moments */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0, gap:16, minWidth:0}}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--silver)'}}>Section outcomes</span>
                <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>quality per section</span>
              </div>
              <div className="rule-silver" style={{marginBottom:10, opacity:0.5}}></div>
              {R.sectionOutcomes.map((s,i)=>{
                const tone = qTone(s.quality);
                return (
                  <div key={s.section} style={{padding:'10px 0', borderBottom:i<R.sectionOutcomes.length-1?'1px solid var(--hairline-soft)':'none'}}>
                    <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'baseline', marginBottom:6}}>
                      <div style={{display:'flex', alignItems:'baseline', gap:14}}>
                        <span className="serif" style={{fontSize:17, color:'var(--birch)', fontStyle:'italic'}}>{s.label}</span>
                        <span className="num" style={{fontSize:9, color:`var(--${tone})`, letterSpacing:'0.16em'}}>{qLabel(s.quality).toUpperCase()}</span>
                      </div>
                      <span className="display" style={{fontSize:26, color:`var(--${tone})`, fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{s.quality}</span>
                    </div>
                    <div style={{height:3, background:'var(--ink-well)', position:'relative', marginBottom:6}}>
                      <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${s.quality}%`, background:`var(--${tone})`}}></div>
                    </div>
                    <div className="serif" style={{fontSize:12, color:'var(--birch-dim)', fontStyle:'italic', lineHeight:1.35}}>{s.note}</div>
                  </div>
                );
              })}
            </div>

            <div style={{flex:1, minHeight:0, display:'flex', flexDirection:'column'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--silver)'}}>Notable moments</span>
              </div>
              <div className="rule-silver" style={{marginBottom:8, opacity:0.5}}></div>
              <div style={{flex:1, minHeight:0, overflow:'auto'}}>
                {R.notableMoments.map((m,i)=>(
                  <div key={i} style={{display:'flex', gap:10, alignItems:'flex-start', padding:'6px 0'}}>
                    <span className="serif" style={{fontSize:16, color:'var(--silver)', fontStyle:'italic', lineHeight:1, flex:'0 0 14px'}}>{i+1}.</span>
                    <span className="serif" style={{fontSize:13.5, color:'var(--birch)', fontStyle:'italic', lineHeight:1.4}}>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER — audience + critics */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0, gap:16, minWidth:0}}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--silver)'}}>Audience mix</span>
                <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>{R.attendance.toLocaleString()} seats · {R.capacityPercent}%</span>
              </div>
              <div className="rule-silver" style={{marginBottom:10, opacity:0.5}}></div>

              {/* stacked bar of share */}
              <div style={{display:'flex', height:14, marginBottom:12, border:'1px solid var(--hairline)'}}>
                {R.audienceBreakdown.map((seg,i)=>{
                  const color = ['var(--silver)','var(--bark)','var(--pine)','var(--ember)'][i];
                  return (
                    <div key={seg.segmentId} style={{flex:seg.attendance, background:color, opacity:0.85}} title={`${seg.segmentName} ${(seg.shareOfHouse*100).toFixed(0)}%`}></div>
                  );
                })}
              </div>

              {R.audienceBreakdown.map((seg,i)=>{
                const color = ['var(--silver)','var(--bark)','var(--pine)','var(--ember)'][i];
                const isBest = seg.segmentName === R.bestSegment;
                const isWorst = seg.segmentName === R.worstSegment;
                return (
                  <div key={seg.segmentId} style={{padding:'8px 0', borderBottom:i<R.audienceBreakdown.length-1?'1px solid var(--hairline-soft)':'none'}}>
                    <div style={{display:'grid', gridTemplateColumns:'14px 1fr auto auto', alignItems:'baseline', gap:10}}>
                      <span style={{width:7, height:7, borderRadius:'50%', background:color, display:'inline-block'}}></span>
                      <div style={{minWidth:0}}>
                        <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                          <span className="serif" style={{fontSize:14, color:'var(--birch)'}}>{seg.segmentName}</span>
                          {isBest && <span className="num" style={{fontSize:8.5, color:'var(--pine)', letterSpacing:'0.16em'}}>↑ BEST</span>}
                          {isWorst && <span className="num" style={{fontSize:8.5, color:'var(--bark)', letterSpacing:'0.16em'}}>watch</span>}
                        </div>
                        <div className="num" style={{fontSize:9, color:'var(--silver-dim)', marginTop:2, letterSpacing:'0.04em'}}>{seg.attendance.toLocaleString()} · {(seg.shareOfHouse*100).toFixed(0)}%</div>
                      </div>
                      <span className="num" style={{fontSize:11, color:'var(--silver-dim)'}}>resp</span>
                      <span className="num" style={{fontSize:14, color: seg.response>=70?'var(--pine)':seg.response>=55?'var(--birch)':'var(--ember)'}}>{seg.response}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{flex:1, minHeight:0, display:'flex', flexDirection:'column'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--silver)'}}>Critics</span>
                <span className="num" style={{fontSize:11, color: qTone(R.criticResponse)==='pine'?'var(--pine)':qTone(R.criticResponse)==='ember'?'var(--ember)':'var(--birch)'}}>
                  {R.criticResponse} · {qLabel(R.criticResponse).toLowerCase()}
                </span>
              </div>
              <div className="rule-silver" style={{marginBottom:10, opacity:0.5}}></div>
              <div style={{flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:10}}>
                {R.quotes.map((q,i)=>(
                  <div key={i} style={{paddingLeft:14, borderLeft:'2px solid var(--bark)'}}>
                    <div className="serif" style={{fontSize:14, color:'var(--birch)', fontStyle:'italic', lineHeight:1.4}}>"{q.text}"</div>
                    <div className="num" style={{fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.18em', textTransform:'uppercase', marginTop:4}}>— {q.src}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — roster aftermath + institutional impact */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0, gap:16, minWidth:0}}>
            <div style={{flex:'1 1 0', minHeight:0, display:'flex', flexDirection:'column'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--silver)'}}>Roster aftermath</span>
                <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>form & morale shift</span>
              </div>
              <div className="rule-silver" style={{marginBottom:8, opacity:0.5}}></div>
              <div style={{flex:1, minHeight:0, overflow:'auto'}}>
                {R.rosterChanges.map((c,i)=>{
                  const formColor = c.formDelta>0?'var(--pine)':c.formDelta<0?'var(--ember)':'var(--silver-dim)';
                  const morColor  = c.moraleDelta>0?'var(--pine)':c.moraleDelta<0?'var(--ember)':'var(--silver-dim)';
                  return (
                    <div key={c.principalId} style={{padding:'8px 0', borderBottom:i<R.rosterChanges.length-1?'1px solid var(--hairline-soft)':'none'}}>
                      <div style={{display:'grid', gridTemplateColumns:'1fr auto auto', alignItems:'baseline', gap:10, marginBottom:3}}>
                        <div style={{minWidth:0}}>
                          <span className="serif" style={{fontSize:13.5, color:'var(--birch)'}}>{c.principalName}</span>
                          <span className="num" style={{fontSize:8.5, color:'var(--silver-dim)', letterSpacing:'0.16em', marginLeft:6, textTransform:'uppercase'}}>{c.position}</span>
                        </div>
                        <span className="num" style={{fontSize:11, color:formColor}}>F {fmtR(c.formDelta)}</span>
                        <span className="num" style={{fontSize:11, color:morColor}}>M {fmtR(c.moraleDelta)}</span>
                      </div>
                      <div className="serif" style={{fontSize:11.5, color:'var(--birch-dim)', fontStyle:'italic', lineHeight:1.35}}>{c.note}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--silver)'}}>Institutional impact</span>
              </div>
              <div className="rule-silver" style={{marginBottom:8, opacity:0.5}}></div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                {[
                  { k:'Cash',       v:fmtRK(R.institutionalDeltas.cash), tone: R.institutionalDeltas.cash>=0?'pine':'ember' },
                  { k:'Reputation', v:fmtR(R.institutionalDeltas.artisticReputation), tone:'pine' },
                  { k:'Trust',      v:fmtR(R.institutionalDeltas.audienceTrust), tone:'pine' },
                  { k:'Donors',     v:fmtR(R.institutionalDeltas.donorConfidence), tone:'pine' },
                  { k:'Morale',     v:fmtR(R.institutionalDeltas.musicianMorale), tone: R.institutionalDeltas.musicianMorale>=0?'pine':'ember' },
                  { k:'Tech',       v:fmtR(R.institutionalDeltas.technicalQuality), tone:'pine' },
                ].map(d=>(
                  <div key={d.k} style={{padding:'8px 10px', background:'rgba(0,0,0,0.18)', border:'1px solid var(--hairline-soft)'}}>
                    <div className="eyebrow" style={{fontSize:8}}>{d.k}</div>
                    <div className="display" style={{fontSize:20, color: d.tone==='pine'?'var(--pine)':'var(--ember)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em', marginTop:2}}>{d.v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex', gap:14, marginTop:8, fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase'}}>
                {R.institutionalDeltas.identity.adventurous>0 && <span style={{color:'var(--silver)'}}>+{R.institutionalDeltas.identity.adventurous} ADVENTUROUS</span>}
                {R.institutionalDeltas.identity.communityFocused>0 && <span style={{color:'var(--bark)'}}>+{R.institutionalDeltas.identity.communityFocused} COMMUNITY</span>}
                {R.institutionalDeltas.identity.scholarly>0 && <span style={{color:'var(--pine)'}}>+{R.institutionalDeltas.identity.scholarly} SCHOLARLY</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ===== CTA bar ===== */}
        <div style={{padding:'14px 40px', borderTop:'1px solid var(--hairline)', background:'#040a07', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div className="serif" style={{fontSize:14, color:'var(--birch-dim)', fontStyle:'italic'}}>
            Concert {R.concertIdx} of 4 resolved. Three to go.
          </div>
          <div style={{display:'flex', gap:10}}>
            <button onClick={()=>window.__navigate && window.__navigate('home')} style={{
              padding:'12px 18px', background:'transparent', border:'1px solid var(--hairline)',
              color:'var(--birch-dim)', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase'
            }}>Return to home</button>
            <button onClick={()=>window.__navigate && window.__navigate('programme')} style={{
              padding:'12px 22px', background:'linear-gradient(180deg, #1a2e25, #122019)',
              border:'1px solid var(--silver-dim)', color:'var(--birch)', cursor:'pointer',
              display:'flex', gap:14, alignItems:'baseline'
            }}>
              <span className="serif" style={{fontSize:20, color:'var(--silver)', fontStyle:'italic'}}>▸</span>
              <span className="display" style={{fontSize:16, fontWeight:500, letterSpacing:'0.01em'}}>Continue to Concert {R.concertIdx+1}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Report = Report;
