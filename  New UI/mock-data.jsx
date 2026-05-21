// Shared mock state for all three home-screen directions.
// One source of truth so the three sketches compare apples to apples.

const MOCK = {
  institution: {
    name: "Pohjola Philharmonic",
    city: "Tampere",
    seasonLabel: "Season I · Debut",
    cash: 412800,
    cashDelta: -18400,
    runwayWeeks: 14,
    vitals: [
      { key:"reputation", label:"Reputation", value:54, delta:+3, tone:"silver" },
      { key:"trust",      label:"Audience Trust", value:61, delta:+2, tone:"silver" },
      { key:"donors",     label:"Donor Confidence", value:48, delta:-4, tone:"ember" },
      { key:"morale",     label:"Musician Morale", value:67, delta:+1, tone:"pine" },
      { key:"tech",       label:"Technical", value:72, delta:+5, tone:"silver" },
    ],
    identity: { adventurous:42, community:31, scholarly:27 }, // sums to 100
  },

  season: {
    current: 2, // 1-indexed; we're between concert I (done) and II (programming)
    total: 4,
    slots: [
      { idx:1, name:"I · Inauguration", date:"Sep 14", status:"resolved", quality:62, attendance:1840, headline:"A capable, cautious opening." },
      { idx:2, name:"II · Pohjola",      date:"Oct 26", status:"active",   quality:null, attendance:null, headline:"Programming in progress." },
      { idx:3, name:"III · Winter Light",date:"Jan 11", status:"locked",   quality:null, attendance:null, headline:"Programme not yet drafted." },
      { idx:4, name:"IV · Spring Tide",  date:"Mar 22", status:"locked",   quality:null, attendance:null, headline:"Season finale — open canvas." },
    ],
  },

  nextConcert: {
    name:"II · Pohjola",
    venue:"Tampere Hall · Main Stage",
    date:"October 26",
    daysOut: 41,
    rehearsalStart:"in 3 weeks",
    stage:"Programming",
    workSlots:[
      { roman:"I", title:null, note:"Open · curtain-raiser slot" },
      { roman:"II", title:null, note:"Open · concerto candidate" },
      { roman:"III", title:null, note:"Open · symphonic anchor" },
    ],
    candidates:[
      { composer:"Sibelius", title:"Symphony No. 2 in D",     duration:46, prestige:78, draw:71, load:62, era:"Late Romantic" },
      { composer:"Rautavaara", title:"Cantus Arcticus",        duration:18, prestige:64, draw:48, load:38, era:"Contemporary" },
      { composer:"Kaija Saariaho", title:"Orion",              duration:24, prestige:72, draw:42, load:74, era:"Contemporary" },
      { composer:"Grieg", title:"Piano Concerto in A minor",   duration:30, prestige:58, draw:82, load:44, era:"Romantic" },
    ],
  },

  // Full repertoire library used by the Programme screen.
  // ownership: 'owned' = in our shelf, 'rented' = leased for an upcoming concert,
  // 'unowned' = available in the catalog to rent or purchase.
  repertoire:[
    // Classical (public domain — all owned, no rental fees)
    { id:'moz40',     composer:'Mozart',      title:'Symphony No. 40 in G minor',           era:'classical',     duration:32, prestige:62, draw:68, load:42, demands:{strings:62, winds:58, brass:30, percussion:18}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'hay94',     composer:'Haydn',       title:'Symphony No. 94 \u201cSurprise\u201d',  era:'classical',     duration:24, prestige:54, draw:55, load:34, demands:{strings:60, winds:54, brass:36, percussion:38}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'bee1',      composer:'Beethoven',   title:'Symphony No. 1 in C',                  era:'classical',     duration:28, prestige:60, draw:61, load:40, demands:{strings:64, winds:56, brass:40, percussion:20}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'mozcpc',    composer:'Mozart',      title:'Piano Concerto No. 21 in C',           era:'classical',     duration:30, prestige:64, draw:74, load:38, demands:{strings:60, winds:52, brass:24, percussion:14}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    // Romantic (public domain — all owned)
    { id:'bee5',      composer:'Beethoven',   title:'Symphony No. 5 in C minor',            era:'romantic',      duration:32, prestige:80, draw:88, load:54, demands:{strings:76, winds:62, brass:64, percussion:48}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'bra1',      composer:'Brahms',      title:'Symphony No. 1 in C minor',            era:'romantic',      duration:48, prestige:78, draw:72, load:62, demands:{strings:78, winds:64, brass:62, percussion:36}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'schpc',     composer:'Schumann',    title:'Piano Concerto in A minor',            era:'romantic',      duration:32, prestige:64, draw:76, load:48, demands:{strings:68, winds:54, brass:42, percussion:22}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'grpc',      composer:'Grieg',       title:'Piano Concerto in A minor',            era:'romantic',      duration:30, prestige:58, draw:82, load:44, demands:{strings:66, winds:52, brass:40, percussion:18}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    // Late Romantic (mostly owned; a couple in critical editions still under license)
    { id:'sib1',      composer:'Sibelius',    title:'Symphony No. 1 in E minor',            era:'late-romantic', duration:38, prestige:72, draw:64, load:58, demands:{strings:76, winds:58, brass:62, percussion:48}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'sib2',      composer:'Sibelius',    title:'Symphony No. 2 in D',                  era:'late-romantic', duration:46, prestige:78, draw:71, load:62, demands:{strings:80, winds:62, brass:66, percussion:46}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'sib5',      composer:'Sibelius',    title:'Symphony No. 5 in E\u2011flat',        era:'late-romantic', duration:32, prestige:82, draw:72, load:60, demands:{strings:74, winds:66, brass:74, percussion:42}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'sibfin',    composer:'Sibelius',    title:'Finlandia',                            era:'late-romantic', duration:9,  prestige:58, draw:76, load:28, demands:{strings:70, winds:64, brass:78, percussion:42}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    { id:'mah1',      composer:'Mahler',      title:'Symphony No. 1 \u201cTitan\u201d',    era:'late-romantic', duration:54, prestige:86, draw:78, load:78, demands:{strings:82, winds:78, brass:82, percussion:64}, ownership:'unowned', rentalCost:1800, purchaseCost:3800 },
    { id:'tch5',      composer:'Tchaikovsky', title:'Symphony No. 5 in E minor',            era:'late-romantic', duration:48, prestige:74, draw:80, load:60, demands:{strings:78, winds:62, brass:68, percussion:44}, ownership:'owned',   rentalCost:null, purchaseCost:0,    acquired:'Season 0' },
    // Contemporary — all in catalog, rental or purchase
    { id:'raucant',   composer:'Rautavaara',  title:'Cantus Arcticus',                      era:'contemporary',  duration:18, prestige:64, draw:48, load:38, demands:{strings:58, winds:62, brass:38, percussion:34}, ownership:'unowned', rentalCost:800,  purchaseCost:2200 },
    { id:'saarorion', composer:'Saariaho',    title:'Orion',                                era:'contemporary',  duration:24, prestige:72, draw:42, load:74, demands:{strings:64, winds:68, brass:62, percussion:78}, ownership:'rented',  rentalCost:1200, purchaseCost:3400, rentedFor:'Concert II' },
    { id:'pendthr',   composer:'Penderecki',  title:'Threnody for Hiroshima',               era:'contemporary',  duration:9,  prestige:68, draw:32, load:48, demands:{strings:88, winds:0,  brass:0,  percussion:0},  ownership:'unowned', rentalCost:600,  purchaseCost:1800 },
    { id:'adesa',     composer:'Ad\u00e8s',    title:'Asyla',                                era:'contemporary',  duration:25, prestige:70, draw:38, load:82, demands:{strings:68, winds:72, brass:70, percussion:88}, ownership:'unowned', rentalCost:1500, purchaseCost:4200 },
  ],

  roster: {
    strength: 58, // composite
    sections:[
      { key:"strings",    label:"Strings",    strength:64, demand:71, stress:38, note:"Concertmaster on a hot streak.", principalCount:6, chairs:48 },
      { key:"winds",      label:"Winds",      strength:59, demand:52, stress:24, note:"Oboe — soloist quality, needs cover.", principalCount:4, chairs:14 },
      { key:"brass",      label:"Brass",      strength:47, demand:46, stress:55, note:"Principal horn tired after I.",     principalCount:3, chairs:11 },
      { key:"percussion", label:"Percussion", strength:52, demand:34, stress:18, note:"Light load; flexible bench.",        principalCount:2, chairs:5 },
    ],
    principals:[
      // Strings
      { name:"Aino Lehtinen",     position:"Concertmaster",       section:"strings", overall:78, form:82, morale:71, best:"leadership", watch:"endurance" },
      { name:"Otso Kärkkäinen",   position:"Asst Concertmaster",  section:"strings", overall:69, form:74, morale:68, best:"blend",      watch:"new music" },
      { name:"Helmi Niemi",        position:"Principal 2nd Violin", section:"strings", overall:66, form:71, morale:73, best:"blend",      watch:"solo" },
      { name:"Riku Tolonen",       position:"Principal Viola",     section:"strings", overall:64, form:67, morale:62, best:"classical", watch:"new music" },
      { name:"Mikko Virtanen",     position:"Principal Cello",     section:"strings", overall:71, form:64, morale:80, best:"solo",      watch:"stress" },
      { name:"Tarja Aalto",        position:"Principal Bass",      section:"strings", overall:62, form:69, morale:64, best:"endurance", watch:"romantic" },
      // Winds
      { name:"Lumi Järvi",         position:"Principal Flute",     section:"winds",   overall:70, form:76, morale:69, best:"solo",      watch:"endurance" },
      { name:"Päivi Salo",          position:"Principal Oboe",      section:"winds",   overall:74, form:69, morale:58, best:"solo",      watch:"morale" },
      { name:"Eero Vainio",         position:"Principal Clarinet",  section:"winds",   overall:67, form:72, morale:71, best:"blend",     watch:"solo" },
      { name:"Anneli Koski",        position:"Principal Bassoon",   section:"winds",   overall:61, form:65, morale:73, best:"classical",watch:"new music" },
      // Brass
      { name:"Jonas Halme",         position:"Principal Horn",      section:"brass",   overall:63, form:41, morale:55, best:"romantic", watch:"form" },
      { name:"Veikko Räsänen",      position:"Principal Trumpet",   section:"brass",   overall:58, form:62, morale:60, best:"classical",watch:"new music" },
      { name:"Sara Lind",           position:"Principal Trombone",  section:"brass",   overall:55, form:58, morale:63, best:"blend",    watch:"solo" },
      // Percussion
      { name:"Saana Korpi",         position:"Principal Timpani",   section:"percussion", overall:66, form:72, morale:74, best:"endurance", watch:"new music" },
      { name:"Tobias Manner",       position:"Principal Percussion",section:"percussion", overall:54, form:68, morale:70, best:"new music", watch:"solo" },
    ],
  },

  finance:{
    incomeYTD: 184000,
    expensesYTD: 162600,
    netYTD: 21400,
    sparkline: [10,16,9,21,14,7,18,22,11,8,14,17,24,19], // weekly net signal
    // running cash balance across the 14 weeks of Season I (in dollars)
    cashHistory: [430000, 422000, 414000, 498000, 490000, 482000, 474000, 468000, 460000, 452000, 442000, 432000, 424000, 412800],
    // YTD breakdowns
    income: [
      { key:'tickets',    label:'Box office',           amount: 88000, share:48, note:'Concert I + advance II', tone:'silver' },
      { key:'donors',     label:'Donor support',        amount: 64000, share:35, note:'8 active patrons',         tone:'pine' },
      { key:'grants',     label:'Grants',               amount: 32000, share:17, note:'Suomen Kulttuurirahasto', tone:'bark' },
      { key:'endowment',  label:'Endowment yield',      amount: 0,     share:0,  note:'— no endowment yet',       tone:'silver' },
    ],
    expenses: [
      { key:'payroll',     label:'Musician payroll',    amount: 96000, share:59, note:'15 principals · weekly',   tone:'silver' },
      { key:'venue',       label:'Hall & venue',        amount: 14000, share:9,  note:'Tampere Hall, rehearsals', tone:'silver' },
      { key:'rentals',     label:'Score rentals',       amount:  8000, share:5,  note:'Saariaho · Concert II',    tone:'ember' },
      { key:'marketing',   label:'Marketing',           amount: 22000, share:14, note:'Concert I push',           tone:'bark' },
      { key:'acquisitions',label:'Score acquisitions',  amount: 12000, share:7,  note:'Sibelius critical edition',tone:'silver' },
      { key:'admin',       label:'Admin & overhead',    amount: 10600, share:6,  note:'office, insurance, fees',  tone:'silver' },
    ],
    // concert-by-concert P&L
    concertPnL: [
      { idx:1, name:'I · Inauguration', date:'Sep 14', status:'resolved', revenue: 88000, donorUplift: 8000, expenses: 62000, net: 34000, attendance: 1840, capacity: 92 },
      { idx:2, name:'II · Pohjola',      date:'Oct 26', status:'forecast', revenue: 92000, donorUplift: 12000, expenses: 71000, net: 33000, attendance: 1620, capacity: 81 },
      { idx:3, name:'III · Winter Light',date:'Jan 11', status:'planning', revenue: null,  donorUplift: null,  expenses: null,  net: null,  attendance: null, capacity: null },
      { idx:4, name:'IV · Spring Tide',  date:'Mar 22', status:'planning', revenue: null,  donorUplift: null,  expenses: null,  net: null,  attendance: null, capacity: null },
    ],
    // donors / patrons
    donors: [
      { name:'Lindgren Foundation', tier:'Lead', amount: 25000, status:'pleased',  note:'expects Sibelius', cadence:'annual' },
      { name:'Aino & Esko Salo',    tier:'Major',amount: 12000, status:'pleased',  note:'attended Concert I',cadence:'annual' },
      { name:'Kone Industries',     tier:'Major',amount: 10000, status:'watching', note:'1‑year sponsorship', cadence:'annual' },
      { name:'Helsinki Klub',       tier:'Patron',amount: 6500, status:'pleased',  note:'subscription circle',cadence:'annual' },
      { name:'M. Lehtinen',         tier:'Patron',amount: 4000, status:'pleased',  note:'sustaining',          cadence:'annual' },
      { name:'Anon. · Tampere',     tier:'Patron',amount: 3500, status:'watching', note:'lapsed in Sep',       cadence:'annual' },
      { name:'Suomen K.rahasto',    tier:'Grant', amount:32000,  status:'pleased',  note:'concert series grant',cadence:'one-time' },
    ],
    upcomingBills: [
      { kind:'payroll',  amount: 8000,  due:'Wk 7',  recurring:true },
      { kind:'rental',   amount: 1200,  due:'Wk 8',  recurring:false, note:'Saariaho · Concert II' },
      { kind:'venue',    amount: 4200,  due:'Wk 9',  recurring:false, note:'Tampere Hall · Oct 24–26' },
      { kind:'marketing',amount: 6000,  due:'Wk 10', recurring:false, note:'Concert II push' },
    ],
    transactions: [
      { kind:'in',  category:'donor',   text:'Lindgren Foundation · Q2 installment', amount: 12500, when:'2d ago' },
      { kind:'out', category:'payroll', text:'Musician payroll · Wk 6',              amount: -8000, when:'3d ago' },
      { kind:'out', category:'rental',  text:'Saariaho · Orion rental',              amount: -1200, when:'5d ago' },
      { kind:'in',  category:'ticket',  text:'Advance sales · Concert II',           amount: 7400,  when:'1w ago' },
      { kind:'out', category:'venue',   text:'Tampere Hall deposit · Concert II',    amount: -2000, when:'1w ago' },
      { kind:'out', category:'payroll', text:'Musician payroll · Wk 5',              amount: -8000, when:'1w ago' },
      { kind:'in',  category:'ticket',  text:'Walk‑up sales · trailing Concert I',   amount: 1850,  when:'2w ago' },
      { kind:'out', category:'marketing',text:'Helsingin Sanomat · print ad',         amount: -3200, when:'2w ago' },
    ],
    riskFlags: [
      { tone:"ember", text:"Donor confidence down 4 — first warning." },
    ],
  },

  inbox:[
    { kind:"donor",   text:"Lindgren Foundation requests Sibelius programming.", time:"2d" },
    { kind:"critic",  text:"Helsingin Sanomat review of Concert I: cautious.",   time:"3d" },
    { kind:"musician",text:"Principal Horn requests two weeks off after II.",    time:"5d" },
    { kind:"venue",   text:"Tampere Hall stage available Oct 24‑26.",            time:"6d" },
  ],

  identityNarrative:"Leaning Adventurous — Lindgren donors expect Sibelius next.",

  // ── Post-concert REPORT (Concert I · Inauguration) ───────────────────────
  report: {
    concertIdx: 1,
    concertName: "I · Inauguration",
    concertDate: "September 14",
    venue: "Tampere Hall · Main Stage",
    works: [
      { composer:"Beethoven",  title:"Coriolan Overture",      duration:9  },
      { composer:"Schumann",   title:"Piano Concerto in A minor", duration:32 },
      { composer:"Beethoven",  title:"Symphony No. 5 in C minor", duration:32 },
    ],
    verdict: "A capable, cautious opening.",
    verdictLong: "The room rose for the Beethoven, the critics noted the strain in the brass, and the donors went home satisfied. A working orchestra — not yet a commanding one.",
    performanceQuality: 62,
    criticResponse: 58,
    audienceResponse: 71,
    attendance: 1840,
    capacityPercent: 92,
    revenue: 88000,
    donorUplift: 8000,
    expenses: 62000,
    net: 34000,
    expenseBreakdown: { baseConcert: 28000, rehearsal: 18000, marketing: 12000, production: 4000 },
    audienceBreakdown: [
      { segmentId:'subs',     segmentName:'Subscribers',    attendance: 920, shareOfHouse:0.50, ticketRevenue:46000, response:78 },
      { segmentId:'single',   segmentName:'Single-ticket',  attendance: 520, shareOfHouse:0.28, ticketRevenue:31200, response:64 },
      { segmentId:'students', segmentName:'Students',       attendance: 220, shareOfHouse:0.12, ticketRevenue: 5500, response:82 },
      { segmentId:'comp',     segmentName:'Comps & donors', attendance: 180, shareOfHouse:0.10, ticketRevenue: 5300, response:74 },
    ],
    bestSegment: 'Students',
    worstSegment: 'Single-ticket',
    financialNotes: [
      "Box office +6% over forecast on walk-up demand.",
      "Lindgren Foundation matched program donation: +$8K.",
    ],
    sectionOutcomes: [
      { section:'strings',    label:'Strings',     quality:74, note:'Concertmaster a clear leader in the Schumann.' },
      { section:'winds',      label:'Winds',       quality:64, note:'Principal oboe — first-half intonation soft.' },
      { section:'brass',      label:'Brass',       quality:48, note:'Beethoven 5 finale exposed the principal horn.' },
      { section:'percussion', label:'Percussion',  quality:69, note:'Steady timpani anchored the third movement.' },
    ],
    notableMoments: [
      "Schumann II.: the slow movement breathed.",
      "Coriolan finale: brass overstretched on the coda.",
      "Standing ovation, 4 minutes, for the Beethoven.",
    ],
    rosterChanges: [
      { principalId:'aino',   principalName:'Aino Lehtinen',   position:'Concertmaster',    formDelta:+4, moraleDelta:+3, note:'Carried the room in the Schumann.' },
      { principalId:'paivi',  principalName:'Päivi Salo',      position:'Principal Oboe',   formDelta:-3, moraleDelta:-5, note:'Visibly frustrated by intonation.' },
      { principalId:'jonas',  principalName:'Jonas Halme',     position:'Principal Horn',   formDelta:-8, moraleDelta:-6, note:'Cracked entrance in Beethoven finale.' },
      { principalId:'saana',  principalName:'Saana Korpi',     position:'Principal Timpani',formDelta:+2, moraleDelta:+4, note:'Crisp and definitive in the V.'  },
      { principalId:'mikko',  principalName:'Mikko Virtanen',  position:'Principal Cello',  formDelta:+1, moraleDelta:+2, note:'Reliable as ever.' },
    ],
    institutionalDeltas: {
      cash:+34000, artisticReputation:+3, audienceTrust:+5, donorConfidence:+2, musicianMorale:-2, technicalQuality:+1,
      identity:{ adventurous:+2, communityFocused:+1, scholarly:0 },
    },
    quotes: [
      { src:'Helsingin Sanomat', text:'A capable opening — Pohjola has the bones of a real orchestra, if not yet the voice.' },
      { src:'Aamulehti',         text:'The Beethoven was thrilling. The Schumann revealed promise. The brass, work to do.' },
    ],
  },

  // ── Season SUMMARY (end of Season I, projected) ──────────────────────────
  summary: {
    seasonLabel: "Season I · Debut",
    concertsPlayed: 4,
    totalAttendance: 7240,
    averageCapacityPercent: 84,
    totalRevenue: 348000,
    totalDonorSupport: 92000,
    totalExpenses: 268000,
    totalNet: 172000,
    averagePerformanceQuality: 67,
    averageAudienceResponse: 73,
    averageCriticResponse: 62,
    bestSegment: 'Subscribers',
    worstSegment: 'Single-ticket',
    bestConcert: { idx:4, name:'IV · Spring Tide', quality:82 },
    worstConcert:{ idx:2, name:'II · Pohjola',     quality:56 },
    startingInstitution: {
      cash: 430000, artisticReputation:51, audienceTrust:56, donorConfidence:52, musicianMorale:66, technicalQuality:67,
      identity:{ adventurous:34, communityFocused:33, scholarly:33 },
    },
    finalInstitution: {
      cash: 602000, artisticReputation:64, audienceTrust:69, donorConfidence:58, musicianMorale:70, technicalQuality:74,
      identity:{ adventurous:48, communityFocused:30, scholarly:22 },
    },
    financialRiskFlags: [
      "Brass over-rotated — two principals near burnout.",
    ],
    identityNarrative: [
      "Programmed two Sibelius works and one Saariaho — the Adventurous reading is now legible.",
      "Donor base shifted: Lindgren Foundation re-upped at Lead tier.",
      "Critics caught on by Concert III; Helsingin Sanomat called you 'an orchestra worth following.'",
    ],
    seasonHighlights: [
      { idx:1, label:'I · Inauguration',  date:'Sep 14', quality:62, attendance:1840, net:34000,  headline:'Capable, cautious opening.' },
      { idx:2, label:'II · Pohjola',      date:'Oct 26', quality:56, attendance:1620, net:21000,  headline:'Brass strained; programming bold.' },
      { idx:3, label:'III · Winter Light',date:'Jan 11', quality:68, attendance:1880, net:48000,  headline:'A turning point — critics warm.' },
      { idx:4, label:'IV · Spring Tide',  date:'Mar 22', quality:82, attendance:1900, net:69000,  headline:'A commanding finale.' },
    ],
    nextSeasonPreview: 'Season II opens in September. Donor pipeline strong; rehearsal capacity stable.',
  },
};

window.MOCK = MOCK;
