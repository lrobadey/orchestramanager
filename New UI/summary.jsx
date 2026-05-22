// Season Summary screen
// End-of-season retrospective. Editorial verdict + the season trail in full,
// big stats, institutional arc (start → end), identity narrative, CTA to next season.

function fmtSK(n){ if (n == null) return '—'; const k = n/1000; return (k>=0?'+':'−')+'$'+Math.abs(k).toFixed(Math.abs(k)>=100?0:1)+'K'; }
function fmtSF(n){ if (n==null) return '—'; return (n>=0?'+':'')+n; }
function sTone(v){ if (v>=70) return 'pine'; if (v>=55) return 'silver'; if (v>=40) return 'bark'; return 'ember'; }
function sLabel(v){ if (v>=85) return 'Exceptional'; if (v>=70) return 'Strong'; if (v>=55) return 'Solid'; if (v>=40) return 'Uneven'; if (v>=25) return 'Weak'; return 'Poor'; }

function Summary(){
  const M = window.MOCK;
  const S = M.summary;
  const I = M.institution;

  // The full season trail as a finished path
  const TRAIL_W = 1440, TRAIL_H = 200;
  const landmarks = S.seasonHighlights.map((h,i)=>({
    ...h,
    x: 200 + i * 340,
    y: [140, 100, 70, 40][i], // gentle upward arc through the season
  }));

  return (
    <div className="artboard-surface" style={{padding:0}}>
      <div style={{display:'grid', gridTemplateRows:'auto auto 1fr auto', height:'100%'}}>

        {/* ===== CANOPY ===== */}
        <div className="stratum canopy" style={{padding:'18px 40px 16px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12}}>
            <div style={{display:'flex', alignItems:'baseline', gap:18}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{width:24,height:24, border:'1px solid var(--silver-dim)', display:'grid', placeItems:'center', color:'var(--silver)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em'}}>OM</div>
                <span className="display" style={{fontSize:16, color:'var(--birch)', fontWeight:500, letterSpacing:'0.04em'}}>{I.name}</span>
              </div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>{S.seasonLabel}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:16}}>
              <span className="eyebrow">End of season</span>
              <span className="num" style={{fontSize:9, color:'var(--pine)', letterSpacing:'0.22em'}}>● 4/4 RESOLVED</span>
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1.4fr auto', alignItems:'end', gap:30}}>
            <div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>The season in review</span>
              <h1 className="display" style={{fontSize:54, fontWeight:500, letterSpacing:'-0.02em', lineHeight:0.95, margin:'6px 0 0', color:'var(--birch)'}}>
                <span style={{fontStyle:'italic', color:'var(--silver)', fontWeight:400}}>An</span> adventurous, capable debut<span style={{color:'var(--bark)'}}>.</span>
              </h1>
              <p className="serif" style={{fontSize:15, color:'var(--birch-dim)', margin:'8px 0 0', lineHeight:1.4, fontStyle:'italic', maxWidth:840}}>
                Four concerts in, you took risks and the critics noticed. The brass is tired, the donors are pleased, and the orchestra is sturdier than it was in September.
              </p>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, textAlign:'right'}}>
              {[
                { k:'AVG QUALITY',  v:S.averagePerformanceQuality, sub:sLabel(S.averagePerformanceQuality), tone:sTone(S.averagePerformanceQuality) },
                { k:'TOTAL NET',    v:fmtSK(S.totalNet), sub:'cash on hand +', tone:S.totalNet>=0?'pine':'ember' },
                { k:'ATTENDANCE',   v:S.totalAttendance.toLocaleString(), sub:`avg ${S.averageCapacityPercent}% capacity`, tone:'silver' },
                { k:'CRITIC AVG',   v:S.averageCriticResponse, sub:sLabel(S.averageCriticResponse), tone:sTone(S.averageCriticResponse) },
              ].map(s=>(
                <div key={s.k}>
                  <div className="eyebrow" style={{color: s.tone==='pine'?'var(--pine)':s.tone==='ember'?'var(--ember)':'var(--silver-dim)'}}>{s.k}</div>
                  <div className="display" style={{fontSize:34, color: s.tone==='pine'?'var(--pine)':s.tone==='ember'?'var(--ember)':'var(--birch)', fontWeight:500, lineHeight:0.85, letterSpacing:'-0.03em'}}>{s.v}</div>
                  <div className="num" style={{fontSize:9, color:'var(--silver-dim)', marginTop:2, letterSpacing:'0.06em'}}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== TRAIL — full retrospective ===== */}
        <div className="stratum trail" style={{
          padding:0,
          background:'linear-gradient(180deg, #050d0a 0%, #03070b 100%)',
          position:'relative',
          height:240,
          overflow:'hidden',
          borderBottom:'1px solid var(--hairline)'
        }}>
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:`
              repeating-radial-gradient( ellipse 38% 70% at 12% 90%, transparent 0 16px, rgba(138,107,79,0.10) 16px 17px ),
              repeating-radial-gradient( ellipse 26% 60% at 50% 10%, transparent 0 14px, rgba(138,107,79,0.08) 14px 15px ),
              repeating-radial-gradient( ellipse 30% 70% at 88% 100%, transparent 0 15px, rgba(138,107,79,0.10) 15px 16px )
            `,
            mixBlendMode:'screen',
            opacity:0.85
          }}></div>
          <div style={{position:'absolute', inset:0, pointerEvents:'none', opacity:0.07,
            backgroundImage:`linear-gradient(to right, var(--bark) 1px, transparent 1px), linear-gradient(to bottom, var(--bark) 1px, transparent 1px)`,
            backgroundSize:'60px 60px'}}></div>

          <svg viewBox={`0 0 ${TRAIL_W} ${TRAIL_H}`} preserveAspectRatio="none" style={{position:'absolute', inset:0, width:'100%', height:'100%', zIndex:2}}>
            {/* full path — solid pine (resolved) */}
            <path
              d={`M 0 ${landmarks[0].y+30}
                  Q ${landmarks[0].x-40} ${landmarks[0].y+15}, ${landmarks[0].x} ${landmarks[0].y}
                  S ${landmarks[1].x-40} ${landmarks[1].y}, ${landmarks[1].x} ${landmarks[1].y}
                  S ${landmarks[2].x-40} ${landmarks[2].y}, ${landmarks[2].x} ${landmarks[2].y}
                  S ${landmarks[3].x-40} ${landmarks[3].y}, ${landmarks[3].x} ${landmarks[3].y}
                  T ${TRAIL_W} ${landmarks[3].y-30}`}
              fill="none" stroke="var(--pine)" strokeWidth="1.4" opacity="0.85"
            />
          </svg>

          {/* edge marginalia */}
          <div style={{position:'absolute', left:18, top:14, zIndex:3, maxWidth:120}}>
            <div className="eyebrow" style={{color:'var(--pine)', whiteSpace:'nowrap'}}>The Season · walked</div>
            <div style={{marginTop:4, fontFamily:'var(--mono)', fontSize:8.5, color:'var(--silver-dim)', letterSpacing:'0.18em', whiteSpace:'nowrap'}}>SEPT ▸ JUNE</div>
          </div>
          <div style={{position:'absolute', right:18, top:14, zIndex:3, maxWidth:140, textAlign:'right'}}>
            <div className="eyebrow" style={{color:'var(--silver-dim)'}}>NEXT SEASON</div>
            <div className="serif" style={{fontSize:12, color:'var(--birch-dim)', fontStyle:'italic', marginTop:4, lineHeight:1.3}}>{S.nextSeasonPreview}</div>
          </div>

          {landmarks.map((lm,i)=>{
            const isBest = lm.idx === S.bestConcert.idx;
            const isWorst = lm.idx === S.worstConcert.idx;
            const tone = sTone(lm.quality);
            const xPct = (lm.x / TRAIL_W) * 100;
            const yPct = (lm.y / TRAIL_H) * 100;
            return (
              <div key={i} style={{
                position:'absolute', left:`${xPct}%`, top:`${yPct}%`,
                transform:'translate(-50%, -50%)', zIndex:5, textAlign:'center'
              }}>
                <div style={{
                  width: isBest?42:32, height: isBest?42:32,
                  border:`1px solid var(--${tone})`,
                  background:'var(--ink-2)',
                  display:'grid', placeItems:'center',
                  boxShadow: isBest?'0 0 0 4px rgba(92,138,111,0.18), 0 0 22px rgba(92,138,111,0.22)':'none',
                  transform:'rotate(45deg)',
                  margin:'0 auto'
                }}>
                  <span className="serif" style={{transform:'rotate(-45deg)', fontStyle:'italic', fontSize: isBest?15:12, color:`var(--${tone})`, fontWeight:500}}>{['I','II','III','IV'][i]}</span>
                </div>
                <div style={{marginTop:8, fontFamily:'var(--mono)', fontSize:8, color:'var(--silver-dim)', letterSpacing:'0.18em', whiteSpace:'nowrap'}}>{lm.date.toUpperCase()}</div>
                <div className="num" style={{fontSize:9, color:`var(--${tone})`, marginTop:2, letterSpacing:'0.04em'}}>Q{lm.quality} · {lm.attendance.toLocaleString()} · {fmtSK(lm.net)}</div>
                <div className="serif" style={{fontSize:11.5, color:'var(--birch-dim)', fontStyle:'italic', lineHeight:1.3, marginTop:4, maxWidth:160, marginLeft:'auto', marginRight:'auto'}}>
                  "{lm.headline}"
                </div>
                {isBest  && <div className="num" style={{fontSize:8, color:'var(--pine)', letterSpacing:'0.18em', marginTop:4}}>↑ BEST</div>}
                {isWorst && <div className="num" style={{fontSize:8, color:'var(--bark)', letterSpacing:'0.18em', marginTop:4}}>watch</div>}
              </div>
            );
          })}
        </div>

        {/* ===== FLOOR — 2 columns ===== */}
        <div style={{
          padding:'16px 40px', display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:36,
          minHeight:0, overflow:'hidden',
          background:'linear-gradient(180deg, #07110d, #050d0a)'
        }}>

          {/* LEFT — institutional arc */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow" style={{color:'var(--silver)'}}>Institutional arc · Sept → June</span>
              <span className="num" style={{fontSize:9.5, color:'var(--silver-dim)'}}>start → end</span>
            </div>
            <div className="rule-silver" style={{marginBottom:10, opacity:0.5}}></div>

            {/* Cash arc — highlighted */}
            <div style={{padding:'10px 12px', background:'rgba(92,138,111,0.06)', border:'1px solid var(--hairline)', marginBottom:14}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr auto auto auto', alignItems:'baseline', gap:14}}>
                <span className="serif" style={{fontSize:18, color:'var(--birch)', fontStyle:'italic'}}>Cash on hand</span>
                <span className="num" style={{fontSize:11, color:'var(--silver-dim)'}}>start</span>
                <span className="display" style={{fontSize:20, color:'var(--silver-dim)', fontWeight:500, lineHeight:1}}>${(S.startingInstitution.cash/1000).toFixed(0)}K</span>
                <span className="num" style={{fontSize:14, color:'var(--silver)'}}>→</span>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr auto auto auto', alignItems:'baseline', gap:14, marginTop:4}}>
                <span></span>
                <span className="num" style={{fontSize:11, color:'var(--pine)'}}>end</span>
                <span className="display" style={{fontSize:24, color:'var(--pine)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>${(S.finalInstitution.cash/1000).toFixed(0)}K</span>
                <span className="num" style={{fontSize:12, color:'var(--pine)'}}>{fmtSK(S.finalInstitution.cash - S.startingInstitution.cash)}</span>
              </div>
            </div>

            {/* The 6 vitals as before-after rows */}
            <div style={{display:'grid', gap:8}}>
              {[
                { k:'Reputation',         from:S.startingInstitution.artisticReputation, to:S.finalInstitution.artisticReputation },
                { k:'Audience Trust',     from:S.startingInstitution.audienceTrust,     to:S.finalInstitution.audienceTrust },
                { k:'Donor Confidence',   from:S.startingInstitution.donorConfidence,   to:S.finalInstitution.donorConfidence },
                { k:'Musician Morale',    from:S.startingInstitution.musicianMorale,    to:S.finalInstitution.musicianMorale },
                { k:'Technical Quality',  from:S.startingInstitution.technicalQuality,  to:S.finalInstitution.technicalQuality },
              ].map(v => {
                const delta = v.to - v.from;
                const tone = delta>0?'pine':delta<0?'ember':'silver';
                return (
                  <div key={v.k} style={{display:'grid', gridTemplateColumns:'130px 1fr 60px', gap:10, alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--hairline-soft)'}}>
                    <span className="serif" style={{fontSize:13.5, color:'var(--birch)'}}>{v.k}</span>
                    <div style={{position:'relative', height:8, background:'var(--ink-well)', border:'1px solid var(--hairline-soft)'}}>
                      <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${Math.min(v.from,v.to)}%`, background:'var(--silver-dim)', opacity:0.7}}></div>
                      <div style={{position:'absolute', left:`${Math.min(v.from,v.to)}%`, top:0, bottom:0, width:`${Math.abs(v.to-v.from)}%`, background:`var(--${tone})`}}></div>
                      <div style={{position:'absolute', left:`${v.from}%`, top:-3, bottom:-3, width:1, background:'var(--silver-dim)'}}></div>
                      <div style={{position:'absolute', left:`${v.to}%`, top:-4, bottom:-4, width:1.5, background:`var(--${tone})`}}></div>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                      <span className="num" style={{fontSize:11, color:'var(--silver-dim)'}}>{v.from}</span>
                      <span className="num" style={{fontSize:12, color:`var(--${tone})`}}>{fmtSF(delta)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Identity drift */}
            <div style={{marginTop:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>Identity drift</div>
              <div className="rule-silver" style={{marginBottom:8, opacity:0.4}}></div>
              {[
                { k:'Adventurous', from:S.startingInstitution.identity.adventurous, to:S.finalInstitution.identity.adventurous, tone:'silver' },
                { k:'Community',   from:S.startingInstitution.identity.communityFocused, to:S.finalInstitution.identity.communityFocused, tone:'bark' },
                { k:'Scholarly',   from:S.startingInstitution.identity.scholarly, to:S.finalInstitution.identity.scholarly, tone:'pine' },
              ].map(r=>{
                const delta = r.to - r.from;
                const deltaCol = delta>0?'var(--pine)':delta<0?'var(--ember)':'var(--silver-dim)';
                return (
                  <div key={r.k} style={{display:'grid', gridTemplateColumns:'100px 1fr 70px', gap:10, alignItems:'center', padding:'5px 0'}}>
                    <span className="serif" style={{fontSize:13, color:'var(--birch-dim)'}}>{r.k}</span>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <span className="num" style={{fontSize:11, color:'var(--silver-dim)', width:28, textAlign:'right'}}>{r.from}</span>
                      <span className="num" style={{fontSize:10, color:'var(--silver-dim)'}}>→</span>
                      <span className="display" style={{fontSize:18, color: `var(--${r.tone})`, fontWeight:500, width:36, textAlign:'left'}}>{r.to}</span>
                    </div>
                    <span className="num" style={{fontSize:12, color:deltaCol, textAlign:'right'}}>{fmtSF(delta)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — narrative + audience + flags */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0, gap:14}}>
            <div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>The identity that emerged</span>
              <div className="rule-brown" style={{margin:'8px 0', opacity:0.6}}></div>
              <ul style={{margin:0, padding:0, listStyle:'none'}}>
                {S.identityNarrative.map((n,i)=>(
                  <li key={i} style={{display:'flex', gap:12, padding:'6px 0', alignItems:'flex-start'}}>
                    <span className="serif" style={{fontSize:18, color:'var(--silver)', fontStyle:'italic', lineHeight:1, flex:'0 0 14px'}}>{i+1}.</span>
                    <span className="serif" style={{fontSize:14, color:'var(--birch)', fontStyle:'italic', lineHeight:1.4}}>{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--silver)'}}>Audience over the season</span>
                <span className="display" style={{fontSize:18, color:'var(--birch)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{S.totalAttendance.toLocaleString()}</span>
              </div>
              <div className="rule-silver" style={{marginBottom:10, opacity:0.5}}></div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                <div style={{padding:'10px 12px', background:'rgba(92,138,111,0.10)', border:'1px solid var(--hairline-soft)'}}>
                  <div className="eyebrow" style={{color:'var(--pine)'}}>BEST SEGMENT</div>
                  <div className="display" style={{fontSize:20, color:'var(--birch)', fontWeight:500, lineHeight:1, marginTop:4, fontStyle:'italic', letterSpacing:'-0.005em'}}>{S.bestSegment}</div>
                </div>
                <div style={{padding:'10px 12px', background:'rgba(201,122,74,0.10)', border:'1px solid var(--hairline-soft)'}}>
                  <div className="eyebrow" style={{color:'var(--bark)'}}>WEAK SEGMENT</div>
                  <div className="display" style={{fontSize:20, color:'var(--birch)', fontWeight:500, lineHeight:1, marginTop:4, fontStyle:'italic', letterSpacing:'-0.005em'}}>{S.worstSegment}</div>
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:10}}>
                <div style={{padding:'10px 12px', background:'rgba(92,138,111,0.10)', border:'1px solid var(--hairline-soft)'}}>
                  <div className="eyebrow" style={{color:'var(--pine)'}}>BEST CONCERT</div>
                  <div className="serif" style={{fontSize:16, color:'var(--birch)', fontStyle:'italic', marginTop:4}}>{S.bestConcert.name}</div>
                  <div className="num" style={{fontSize:10, color:'var(--pine)', marginTop:2, letterSpacing:'0.06em'}}>Q{S.bestConcert.quality} · {sLabel(S.bestConcert.quality)}</div>
                </div>
                <div style={{padding:'10px 12px', background:'rgba(201,122,74,0.10)', border:'1px solid var(--hairline-soft)'}}>
                  <div className="eyebrow" style={{color:'var(--bark)'}}>WEAK CONCERT</div>
                  <div className="serif" style={{fontSize:16, color:'var(--birch)', fontStyle:'italic', marginTop:4}}>{S.worstConcert.name}</div>
                  <div className="num" style={{fontSize:10, color:'var(--bark)', marginTop:2, letterSpacing:'0.06em'}}>Q{S.worstConcert.quality} · {sLabel(S.worstConcert.quality)}</div>
                </div>
              </div>
            </div>

            {S.financialRiskFlags.length>0 && (
              <div>
                <span className="eyebrow" style={{color:'var(--ember)'}}>Carries into next season</span>
                <div className="rule-silver" style={{margin:'8px 0', opacity:0.4}}></div>
                {S.financialRiskFlags.map((f,i)=>(
                  <div key={i} style={{display:'flex', gap:8, alignItems:'flex-start', padding:'4px 0'}}>
                    <span className="dot ember" style={{marginTop:6}}></span>
                    <span className="serif" style={{fontSize:13.5, color:'var(--ember)', fontStyle:'italic', lineHeight:1.4}}>{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== CTA bar ===== */}
        <div style={{padding:'14px 40px', borderTop:'1px solid var(--hairline)', background:'#040a07', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div className="serif" style={{fontSize:14, color:'var(--birch-dim)', fontStyle:'italic'}}>
            Books closed on {S.seasonLabel}. The orchestra is ready for what comes next.
          </div>
          <div style={{display:'flex', gap:10}}>
            <button onClick={()=>window.__navigate && window.__navigate('ledger')} style={{
              padding:'12px 18px', background:'transparent', border:'1px solid var(--hairline)',
              color:'var(--birch-dim)', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase'
            }}>Review the books</button>
            <button onClick={()=>window.__navigate && window.__navigate('home')} style={{
              padding:'12px 22px', background:'linear-gradient(180deg, #1a2e25, #122019)',
              border:'1px solid var(--silver-dim)', color:'var(--birch)', cursor:'pointer',
              display:'flex', gap:14, alignItems:'baseline'
            }}>
              <span className="serif" style={{fontSize:20, color:'var(--silver)', fontStyle:'italic'}}>▸</span>
              <span className="display" style={{fontSize:16, fontWeight:500, letterSpacing:'0.01em'}}>Begin Season II</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Summary = Summary;
