// Ledger screen
// Big cash line as the hero graphic, then income/expense breakdowns, concert P&L,
// donor list, upcoming bills, and recent transactions. Forest at dusk, layered.

const { useMemo: useMLG } = React;

function fmtK(n){
  if (n == null) return '—';
  const k = n/1000;
  return (k >= 0 ? '' : '−') + '$' + Math.abs(k).toFixed(Math.abs(k)>=100?0:1) + 'K';
}
function fmtFull(n){
  if (n == null) return '—';
  return (n >= 0 ? '' : '−') + '$' + Math.abs(n).toLocaleString();
}

// Cash line hero --------------------------------------------------------------
function CashLine({ history, concerts }){
  const W = 1000, H = 220, padX = 24, padY = 20;
  const minV = Math.min(...history);
  const maxV = Math.max(...history);
  const range = (maxV - minV) || 1;
  const xFor = (i) => padX + (i / (history.length-1)) * (W - padX*2);
  const yFor = (v) => H - padY - ((v - minV) / range) * (H - padY*2);

  // gridlines at $50K intervals
  const grid = [];
  for (let v = Math.ceil(minV/50000)*50000; v <= maxV; v += 50000) grid.push(v);

  const line = history.map((v,i)=>`${i===0?'M':'L'} ${xFor(i)} ${yFor(v)}`).join(' ');
  const area = `${line} L ${xFor(history.length-1)} ${H - padY} L ${xFor(0)} ${H - padY} Z`;

  // map concerts to week indices (1-based weeks; sept 14, oct 26, jan 11, mar 22 spread across season)
  // For Season I we'll mark concerts at weeks: I=3, II=8 (this is the forecast week)
  const concertWeeks = [3, 8, 13]; // illustrative; only first one is realized in cashHistory
  const concertNames = ['I','II','III'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:'block', width:'100%', height:'100%'}}>
      {/* horizontal grid */}
      {grid.map(v => (
        <g key={v}>
          <line x1={padX} y1={yFor(v)} x2={W-padX} y2={yFor(v)} stroke="var(--hairline)" strokeWidth="0.4" strokeDasharray="2 4"/>
          <text x={padX-4} y={yFor(v)+3} textAnchor="end" fontFamily="JetBrains Mono" fontSize="8" fill="var(--silver-dim)" letterSpacing="1">${(v/1000).toFixed(0)}K</text>
        </g>
      ))}

      {/* concert vertical markers */}
      {concertWeeks.map((wk,i)=>(
        i < history.length && (
          <g key={i}>
            <line x1={xFor(wk-1)} y1={padY} x2={xFor(wk-1)} y2={H-padY} stroke="var(--bark-dim)" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.7"/>
            <text x={xFor(wk-1)} y={padY-4} textAnchor="middle" fontFamily="EB Garamond" fontStyle="italic" fontSize="14" fill="var(--bark)" fontWeight="500">{concertNames[i]}.</text>
          </g>
        )
      ))}

      {/* area + line */}
      <defs>
        <linearGradient id="cash-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--silver)" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="var(--silver)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cash-grad)"/>
      <path d={line} fill="none" stroke="var(--silver)" strokeWidth="1.6"/>

      {/* current dot */}
      <circle cx={xFor(history.length-1)} cy={yFor(history[history.length-1])} r="4" fill="var(--silver)"/>
      <circle cx={xFor(history.length-1)} cy={yFor(history[history.length-1])} r="9" fill="none" stroke="var(--silver)" strokeOpacity="0.35" strokeWidth="1"/>

      {/* x axis labels */}
      <text x={xFor(0)} y={H-4} textAnchor="start" fontFamily="JetBrains Mono" fontSize="8" fill="var(--silver-dim)" letterSpacing="1.4">WK 1 · SEP</text>
      <text x={xFor(history.length-1)} y={H-4} textAnchor="end" fontFamily="JetBrains Mono" fontSize="8" fill="var(--silver-dim)" letterSpacing="1.4">WK 14 · NOW</text>
    </svg>
  );
}

// Category breakdown bar list ------------------------------------------------
function CategoryList({ items, total }){
  return (
    <div style={{display:'grid', gap:8}}>
      {items.map(it => {
        const pct = total > 0 ? (it.amount / total) * 100 : 0;
        return (
          <div key={it.key} style={{padding:'6px 0', borderBottom:'1px solid var(--hairline-soft)'}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr auto', alignItems:'baseline', gap:8}}>
              <div>
                <div className="serif" style={{fontSize:14, color:'var(--birch)', lineHeight:1.15}}>{it.label}</div>
                <div className="num" style={{fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.04em', marginTop:2}}>{it.note}</div>
              </div>
              <div className="display" style={{fontSize:20, color:'var(--birch)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em', textAlign:'right'}}>
                {fmtK(it.amount)}
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 36px', alignItems:'center', gap:8, marginTop:5}}>
              <div style={{height:3, background:'var(--ink-well)', position:'relative'}}>
                <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`, background:`var(--${it.tone})`}}></div>
              </div>
              <span className="num" style={{fontSize:9, color:'var(--silver-dim)', textAlign:'right'}}>{pct.toFixed(0)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Concert P&L card -----------------------------------------------------------
function ConcertPnL({ c }){
  const isResolved = c.status === 'resolved';
  const isForecast = c.status === 'forecast';
  const isPlanning = c.status === 'planning';
  const tone = isResolved ? 'pine' : isForecast ? 'silver' : 'silver-dim';

  return (
    <div style={{
      padding:'14px 16px',
      borderLeft: `2px solid ${isResolved?'var(--pine)':isForecast?'var(--silver)':'var(--hairline)'}`,
      background: isResolved ? 'rgba(92,138,111,0.05)' : isForecast ? 'rgba(184,192,188,0.04)' : 'transparent',
      borderTop:'1px solid var(--hairline-soft)',
      opacity: isPlanning ? 0.55 : 1,
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
        <div>
          <div className="serif" style={{fontSize:16, color:'var(--birch)', fontStyle:'italic'}}>{c.name}</div>
          <div className="num" style={{fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.18em', marginTop:2}}>{c.date.toUpperCase()}</div>
        </div>
        <span className="num" style={{fontSize:8.5, color:`var(--${tone})`, letterSpacing:'0.2em'}}>
          {isResolved ? '● RESOLVED' : isForecast ? '◇ FORECAST' : '○ PLANNING'}
        </span>
      </div>

      {!isPlanning ? (
        <>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:8}}>
            <div>
              <div className="eyebrow" style={{fontSize:8}}>Revenue</div>
              <div className="display" style={{fontSize:20, color:'var(--birch)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{fmtK(c.revenue)}</div>
            </div>
            <div>
              <div className="eyebrow" style={{fontSize:8}}>Expenses</div>
              <div className="display" style={{fontSize:20, color:'var(--birch)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{fmtK(c.expenses)}</div>
            </div>
            <div>
              <div className="eyebrow" style={{fontSize:8, color:c.net>=0?'var(--pine)':'var(--ember)'}}>Net</div>
              <div className="display" style={{fontSize:24, color: c.net>=0?'var(--pine)':'var(--ember)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{c.net>=0?'+':''}{fmtK(c.net)}</div>
            </div>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
            <span className="num" style={{fontSize:10, color:'var(--silver-dim)'}}>
              {c.attendance?.toLocaleString()} seats · {c.capacity}% full
            </span>
            {c.donorUplift > 0 && (
              <span className="num" style={{fontSize:10, color:'var(--pine)'}}>donor uplift +{fmtK(c.donorUplift)}</span>
            )}
          </div>
        </>
      ) : (
        <div className="serif" style={{fontSize:12, color:'var(--birch-dim)', fontStyle:'italic'}}>Programme not yet drafted.</div>
      )}
    </div>
  );
}

// Main -----------------------------------------------------------------------
function Ledger(){
  const M = window.MOCK;
  const F = M.finance;
  const I = M.institution;

  const incomeTotal = useMLG(()=>F.income.reduce((s,x)=>s+x.amount,0), [F]);
  const expenseTotal = useMLG(()=>F.expenses.reduce((s,x)=>s+x.amount,0), [F]);
  const upcomingTotal = F.upcomingBills.reduce((s,x)=>s+x.amount,0);

  return (
    <div className="artboard-surface" style={{padding:0}}>
      <div style={{display:'grid', gridTemplateRows:'auto auto 1fr', height:'100%'}}>

        {/* ===== CANOPY ===== */}
        <div className="stratum canopy" style={{padding:'16px 40px 14px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12}}>
            <div style={{display:'flex', alignItems:'baseline', gap:18}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{width:24,height:24, border:'1px solid var(--silver-dim)', display:'grid', placeItems:'center', color:'var(--silver)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em'}}>OM</div>
                <span className="display" style={{fontSize:16, color:'var(--birch)', fontWeight:500, letterSpacing:'0.04em'}}>{I.name}</span>
              </div>
              <span className="eyebrow">{I.seasonLabel}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:16}}>
              <span className="eyebrow">Wk 6 of 14 · Oct 17</span>
              {['home','roster','programme','library','ledger'].map((t)=>(
                <span key={t} onClick={()=>window.__navigate && window.__navigate(t)} className="serif" style={{fontSize:13, color: t==='ledger'?'var(--birch)':'var(--silver-dim)', fontStyle:t==='ledger'?'italic':'normal', cursor:'pointer'}}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1.4fr auto', alignItems:'end', gap:30}}>
            <div>
              <span className="eyebrow" style={{color:'var(--bark)'}}>The Ledger · books open</span>
              <h1 className="display" style={{fontSize:44, fontWeight:500, letterSpacing:'-0.02em', lineHeight:0.95, margin:'4px 0 0', color:'var(--birch)'}}>
                <span style={{fontStyle:'italic', color:'var(--silver)', fontWeight:400}}>+</span>{fmtK(F.netYTD)} <span className="serif" style={{fontSize:24, color:'var(--birch-dim)', fontStyle:'italic', fontWeight:400}}>net, season to date</span>
              </h1>
              <p className="serif" style={{fontSize:14, color:'var(--birch-dim)', margin:'4px 0 0', lineHeight:1.4, fontStyle:'italic'}}>
                Cash on hand carrying us through to the new year. Donor confidence wobbled this week — one to watch.
              </p>
            </div>
            <div style={{display:'flex', gap:24, alignItems:'baseline'}}>
              {[
                { k:'CASH',     v: fmtK(I.cash),         sub:`${I.cashDelta>=0?'+':''}${fmtK(I.cashDelta)} wk`, subTone: I.cashDelta>=0?'pine':'ember' },
                { k:'RUNWAY',   v: I.runwayWeeks + 'wk', sub:'at current burn',     subTone:'silver-dim' },
                { k:'DONORS',   v: I.vitals.find(v=>v.key==='donors').value, sub:`${I.vitals.find(v=>v.key==='donors').delta>=0?'+':''}${I.vitals.find(v=>v.key==='donors').delta} wk`, subTone:'ember' },
              ].map(s=>(
                <div key={s.k} style={{textAlign:'right'}}>
                  <div className="eyebrow">{s.k}</div>
                  <div className="display" style={{fontSize:38, color:'var(--birch)', fontWeight:500, lineHeight:0.85, letterSpacing:'-0.03em'}}>{s.v}</div>
                  <div className="num" style={{fontSize:9, color:`var(--${s.subTone})`, marginTop:2}}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== HERO — cash line ===== */}
        <div className="stratum understory" style={{padding:'14px 40px 14px'}}>
          <div className="rule-brown" style={{marginBottom:10}}></div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
            <span className="eyebrow">Cash on Hand · 14 weeks of Season I</span>
            <div style={{display:'flex', gap:14, alignItems:'baseline'}}>
              <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>peak <span style={{color:'var(--birch)'}}>{fmtK(Math.max(...F.cashHistory))}</span> wk 4</span>
              <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>trough <span style={{color:'var(--birch)'}}>{fmtK(Math.min(...F.cashHistory))}</span> now</span>
              <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>weekly burn ~$8K</span>
            </div>
          </div>
          <div style={{height:220}}>
            <CashLine history={F.cashHistory} concerts={F.concertPnL}/>
          </div>
        </div>

        {/* ===== FLOOR — 3 columns ===== */}
        <div style={{
          padding:'14px 40px 18px',
          display:'grid', gridTemplateColumns:'1fr 1.05fr 0.95fr', gap:24,
          minHeight:0, overflow:'hidden',
          background:'linear-gradient(180deg, #07110d, #050c09)'
        }}>

          {/* LEFT — income + expenses */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0, gap:14}}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--pine)'}}>Income · YTD</span>
                <span className="display" style={{fontSize:22, color:'var(--pine)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{fmtK(incomeTotal)}</span>
              </div>
              <div className="rule-silver" style={{marginBottom:6, opacity:0.5}}></div>
              <CategoryList items={F.income} total={incomeTotal}/>
            </div>

            <div style={{minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--ember)'}}>Expenses · YTD</span>
                <span className="display" style={{fontSize:22, color:'var(--ember)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{fmtK(expenseTotal)}</span>
              </div>
              <div className="rule-silver" style={{marginBottom:6, opacity:0.5}}></div>
              <div style={{flex:1, minHeight:0, overflow:'auto'}}>
                <CategoryList items={F.expenses} total={expenseTotal}/>
              </div>
            </div>
          </div>

          {/* CENTER — concert P&L */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0, minWidth:0}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span className="eyebrow" style={{color:'var(--silver)'}}>Concerts · per-evening P&L</span>
              <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>4 concerts · 1 done</span>
            </div>
            <div className="rule-silver" style={{marginBottom:0, opacity:0.5}}></div>
            <div style={{flex:1, minHeight:0, overflow:'auto'}}>
              {F.concertPnL.map(c => <ConcertPnL key={c.idx} c={c}/>)}
            </div>

            {/* upcoming bills */}
            <div style={{marginTop:12, paddingTop:12, borderTop:'1px solid var(--hairline)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--bark)'}}>Upcoming bills · next 4 weeks</span>
                <span className="display" style={{fontSize:18, color:'var(--bark)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{fmtK(upcomingTotal)}</span>
              </div>
              {F.upcomingBills.map((b,i)=>(
                <div key={i} style={{display:'grid', gridTemplateColumns:'48px 1fr auto auto', gap:10, padding:'5px 0', alignItems:'baseline', borderBottom: i<F.upcomingBills.length-1?'1px solid var(--hairline-soft)':'none'}}>
                  <span className="num" style={{fontSize:9, color:'var(--silver-dim)', letterSpacing:'0.16em', textTransform:'uppercase'}}>{b.due}</span>
                  <span className="serif" style={{fontSize:13, color:'var(--birch)', fontStyle:'italic'}}>{b.note || b.kind}</span>
                  <span className="num" style={{fontSize:9, color: b.recurring?'var(--silver-dim)':'var(--bark)', letterSpacing:'0.14em'}}>{b.recurring?'RECUR':'ONE-OFF'}</span>
                  <span className="num" style={{fontSize:13, color:'var(--birch)', textAlign:'right'}}>{fmtFull(-b.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — donors + transactions */}
          <div style={{display:'flex', flexDirection:'column', minHeight:0, minWidth:0, gap:14}}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow" style={{color:'var(--pine)'}}>Donors · {F.donors.length} relationships</span>
                <span className="display" style={{fontSize:18, color:'var(--pine)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em'}}>{fmtK(F.donors.reduce((s,d)=>s+d.amount,0))}</span>
              </div>
              <div className="rule-silver" style={{marginBottom:6, opacity:0.5}}></div>
              <div style={{maxHeight:218, overflow:'auto'}}>
                {F.donors.map(d=>{
                  const statusColor = d.status==='pleased'?'var(--pine)':d.status==='watching'?'var(--ember)':'var(--bark)';
                  const tierBg = d.tier==='Lead'?'rgba(92,138,111,0.18)':d.tier==='Major'?'rgba(184,192,188,0.10)':'transparent';
                  return (
                    <div key={d.name} style={{display:'grid', gridTemplateColumns:'1fr auto', padding:'7px 8px', gap:8, alignItems:'baseline', borderBottom:'1px solid var(--hairline-soft)', background: tierBg}}>
                      <div style={{minWidth:0}}>
                        <div style={{display:'flex', alignItems:'baseline', gap:6}}>
                          <span style={{width:5,height:5,borderRadius:'50%', background:statusColor, display:'inline-block', flex:'0 0 5px'}}></span>
                          <span className="serif" style={{fontSize:13, color:'var(--birch)'}}>{d.name}</span>
                        </div>
                        <div className="num" style={{fontSize:9, color:'var(--silver-dim)', marginTop:2, letterSpacing:'0.04em'}}>{d.tier} · {d.note}</div>
                      </div>
                      <div className="display" style={{fontSize:16, color:'var(--birch)', fontWeight:500, lineHeight:1, letterSpacing:'-0.02em', textAlign:'right'}}>{fmtK(d.amount)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{minHeight:0, display:'flex', flexDirection:'column'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                <span className="eyebrow">Recent transactions</span>
                <span className="num" style={{fontSize:9, color:'var(--silver-dim)'}}>last 2 weeks</span>
              </div>
              <div className="rule-silver" style={{marginBottom:6, opacity:0.5}}></div>
              <div style={{flex:1, minHeight:0, overflow:'auto'}}>
                {F.transactions.map((t,i)=>(
                  <div key={i} style={{display:'grid', gridTemplateColumns:'14px 1fr auto', gap:8, padding:'6px 0', alignItems:'baseline', borderBottom:'1px solid var(--hairline-soft)'}}>
                    <span style={{
                      display:'inline-block', width:7, textAlign:'center',
                      fontFamily:'var(--mono)', fontSize:11,
                      color: t.kind==='in'?'var(--pine)':'var(--ember)'
                    }}>{t.kind==='in'?'+':'−'}</span>
                    <div style={{minWidth:0}}>
                      <div className="serif" style={{fontSize:12.5, color:'var(--birch)', lineHeight:1.25, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.text}</div>
                      <div className="num" style={{fontSize:8.5, color:'var(--silver-dim)', letterSpacing:'0.16em', marginTop:2}}>{t.category.toUpperCase()} · {t.when}</div>
                    </div>
                    <span className="num" style={{fontSize:12, color: t.kind==='in'?'var(--pine)':'var(--birch)'}}>{fmtFull(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

window.Ledger = Ledger;
