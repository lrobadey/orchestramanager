import { useMemo, useState } from 'react'
import { works } from '../data/works'
import { principals } from '../data/principals'
import { cityAudienceSegments } from '../data/audienceSegments'
import { startingInstitution } from '../data/institution'
import { forecastProgram } from './forecastProgram'
import { resolveConcert } from './resolveConcert'
import { createInitialSeason, resolveSeasonConcert } from './season'
import { computeSeasonFunding, type SeasonFundingConcertInput } from './seasonFunding'
import {
  createSwayState,
  swayKey,
  dedicationsUsed,
  MAX_DEDICATIONS,
  START_GOODWILL,
  type SwayState,
} from './seasonSway'
import { clamp } from './scoring'
import { isProgramComplete, isSeasonPlanComplete, sanitizeOrchestraName } from './founding'
import {
  ConcertProgram,
  ConcertReport,
  SeasonState,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
} from '../types/core'
import type { HomeNavKey } from '../components/HomeConsole'

export type Phase = 'planning' | 'report'
export type MainView =
  | 'enter'
  | 'founding'
  | 'plan-season'
  | 'home'
  | 'programme'
  | 'roster'
  | 'library'
  | 'ledger'
  | 'donors'
  | 'audience'

type SeasonPrograms = [ConcertProgram, ConcertProgram, ConcertProgram, ConcertProgram]

const evenAllocation = (): SlotTuple<number> => [7, 7, TOTAL_REHEARSAL_HOURS - 14]

const emptyProgram = (): ConcertProgram => ({
  workCount: 3,
  workIds: [null, null, null],
  intermissionAfter: 1,
  rehearsalAllocation: evenAllocation(),
  marketingSpend: 15_000,
  marketingStyle: 'digital',
  ticketPrice: 70,
  studentTicketsEnabled: false,
  studentTicketPrice: 25,
})

const emptyDraftPrograms = (): SeasonPrograms => [
  emptyProgram(),
  emptyProgram(),
  emptyProgram(),
  emptyProgram(),
]

function createSeasonForOrchestra(orchestraName: string): SeasonState {
  return createInitialSeason({ ...startingInstitution, name: orchestraName }, principals)
}

export function useSeasonGame() {
  const [orchestraName, setOrchestraName] = useState(startingInstitution.name)
  const [season, setSeason] = useState<SeasonState>(() => createSeasonForOrchestra(startingInstitution.name))
  // One editable program per concert slot. Authored up front on the season-plan
  // screen, then frozen when the season begins and consumed in order during play.
  const [draftPrograms, setDraftPrograms] = useState<SeasonPrograms>(emptyDraftPrograms)
  // Which slot the season-plan screen is editing (pre-season only).
  const [selectedSlot, setSelectedSlot] = useState(0)
  // The plan locks when the season begins; from then on programs are read-only
  // and concerts resolve against the committed plan one at a time.
  const [seasonStarted, setSeasonStarted] = useState(false)
  const [phase, setPhase] = useState<Phase>('planning')
  const [mainView, setMainView] = useState<MainView>('enter')
  const [report, setReport] = useState<ConcertReport | null>(null)
  // The player's sway over donors during planning: dedications, pushed asks, and
  // restricted asks. Frozen into the committed funding when the season begins.
  const [sway, setSway] = useState<SwayState>(createSwayState)

  const institution = season.institution
  const livePrincipals = season.roster.principals
  const seasonComplete = season.currentSlotIndex >= 4

  // Pre-season the player edits the selected slot; in-season the "active" program
  // is the concert currently up for resolution.
  const activeProgramIndex = seasonStarted ? Math.min(season.currentSlotIndex, 3) : selectedSlot
  const program = draftPrograms[activeProgramIndex]

  const planComplete = useMemo(() => isSeasonPlanComplete(draftPrograms), [draftPrograms])

  // Live donor auto-fill while planning: each programmed concert's cost becomes
  // an ask, and the deterministic engine fills it from aligned donor capacity.
  // Only fully-programmed concerts are scored (an empty program has no
  // repertoire for donors to react to); coverage grows as the plan fills in.
  const fundingConcerts = useMemo<SeasonFundingConcertInput[]>(
    () =>
      draftPrograms.map((draft, index) => ({
        id: `concert-${index}`,
        index,
        name: season.slots[index]?.name ?? `Concert ${index + 1}`,
        program: isProgramComplete(draft) ? draft : null,
      })),
    [draftPrograms, season.slots],
  )

  const seasonFunding = useMemo(
    () =>
      computeSeasonFunding({
        donors: season.donors.donors,
        concerts: fundingConcerts,
        works,
        institution,
        sway,
      }),
    [season.donors.donors, fundingConcerts, institution, sway],
  )

  const goodwillRemaining = Math.max(0, START_GOODWILL - seasonFunding.goodwillSpent)

  // Dedicate a concert to a donor (their "home night"). A donor holds at most
  // one; the season holds at most MAX_DEDICATIONS. Toggling an existing pairing
  // clears it.
  function toggleDedication(concertIndex: number, donorId: string) {
    if (seasonStarted) return
    setSway(prev => {
      const dedications = [...prev.dedications]
      if (dedications[concertIndex] === donorId) {
        dedications[concertIndex] = null
        return { ...prev, dedications }
      }
      const heldElsewhere = dedications.indexOf(donorId)
      if (heldElsewhere >= 0) dedications[heldElsewhere] = null
      const usedAfter = dedications.filter((d, i) => i !== concertIndex && d).length + 1
      if (usedAfter > MAX_DEDICATIONS) return prev
      dedications[concertIndex] = donorId
      return { ...prev, dedications }
    })
  }

  // Set the absolute pledge target the player is asking a donor for on a concert.
  function setAsk(donorId: string, concertIndex: number, target: number) {
    if (seasonStarted) return
    setSway(prev => ({
      ...prev,
      asks: { ...prev.asks, [swayKey(donorId, concertIndex)]: Math.max(0, Math.round(target)) },
    }))
  }

  function toggleRestricted(donorId: string, concertIndex: number) {
    if (seasonStarted) return
    setSway(prev => {
      const key = swayKey(donorId, concertIndex)
      const restricted = { ...prev.restricted }
      if (restricted[key]) delete restricted[key]
      else restricted[key] = true
      return { ...prev, restricted }
    })
  }

  function setProgram(next: ConcertProgram) {
    // Locked once the season is under way: no editing the committed plan.
    if (seasonStarted) return
    setDraftPrograms(prev => {
      const copy = [...prev] as SeasonPrograms
      copy[activeProgramIndex] = next
      return copy
    })
  }

  const forecast = useMemo(
    () =>
      forecastProgram({
        works,
        institution,
        principals: livePrincipals,
        cityAudienceSegments,
        audienceState: season.audience,
        program,
        donorState: season.donors,
      }),
    [institution, livePrincipals, program, season.audience, season.donors],
  )

  function handleRunConcert() {
    if (!forecast.isComplete) return
    // The night's donor income is the committed pledges that latched to this
    // concert, realized with their volatility. Falls back to the legacy estimate
    // only if no plan was committed (defensive — should not happen in play).
    const committedConcert = season.funding?.concerts.find(
      concert => concert.concertIndex === season.currentSlotIndex,
    )
    const result = resolveConcert({
      works,
      institution,
      principals: livePrincipals,
      cityAudienceSegments,
      audienceState: season.audience,
      program,
      donorState: season.donors,
      donorIncome: committedConcert?.realized,
      roll: Math.random() * 100,
    })
    setReport(result)
    setPhase('report')
  }

  function applyPendingReport() {
    if (!report) return
    setSeason(prev => resolveSeasonConcert(prev, draftPrograms[prev.currentSlotIndex], report, works))
    setReport(null)
    setPhase('planning')
  }

  function handleDone() {
    applyPendingReport()
    setMainView('home')
  }

  function navigateTo(view: MainView) {
    if (phase === 'report') applyPendingReport()
    setMainView(view)
  }

  function handleFoundOrchestra(name: string) {
    const cleanName = sanitizeOrchestraName(name)
    setOrchestraName(cleanName)
    setSeason(prev => ({
      ...prev,
      institution: { ...prev.institution, name: cleanName },
    }))
  }

  function selectSlot(index: number) {
    if (index < 0 || index > 3) return
    setSelectedSlot(index)
  }

  function beginSeason() {
    if (!planComplete || seasonStarted) return
    // "Make the ask": freeze the live auto-fill into season state. From here the
    // committed pledges (and their realized amounts) are what concerts resolve
    // against, so the donor money the player saw while planning is the money
    // that actually arrives. The ask also leaves a mark on the donors — a
    // dedication warms them, an over-push cools them (mild drift).
    setSeason(prev => {
      const donors = prev.donors.donors.map(donor => {
        const delta = seasonFunding.donors.find(result => result.donorId === donor.id)?.relationshipDelta ?? 0
        return delta ? { ...donor, relationship: clamp(donor.relationship + delta, 0, 100) } : donor
      })
      return { ...prev, funding: seasonFunding, donors: { donors } }
    })
    setSeasonStarted(true)
    setPhase('planning')
    setMainView('home')
  }

  function handleNewSeason() {
    setSeason(createSeasonForOrchestra(orchestraName))
    setDraftPrograms(emptyDraftPrograms())
    setSelectedSlot(0)
    setSway(createSwayState())
    setSeasonStarted(false)
    setReport(null)
    setPhase('planning')
    setMainView('plan-season')
  }

  function handleHomeNavigate(key: HomeNavKey) {
    navigateTo(key)
  }

  const slotWorks: SlotTuple<ReturnType<typeof works.find>> = [
    program.workIds[0] ? works.find(w => w.id === program.workIds[0]) : undefined,
    program.workIds[1] ? works.find(w => w.id === program.workIds[1]) : undefined,
    program.workIds[2] ? works.find(w => w.id === program.workIds[2]) : undefined,
  ]
  const filledSlotWorks = slotWorks
    .slice(0, program.workCount)
    .filter((w): w is NonNullable<typeof w> => w !== undefined)

  const currentSlotName = !seasonComplete ? season.slots[activeProgramIndex].name : null

  // Movement shown on the vitals strip is the institutional delta from the most
  // recently resolved concert. currentSlotIndex points at the next pending slot,
  // so the last resolved slot is the one immediately before it.
  const lastResolvedSlot = season.currentSlotIndex > 0 ? season.slots[season.currentSlotIndex - 1] : null
  const lastDeltas = lastResolvedSlot?.report?.institutionalDeltas

  return {
    season,
    program,
    setProgram,
    setMainView,
    phase,
    mainView,
    report,
    institution,
    seasonComplete,
    seasonStarted,
    forecast,
    draftPrograms,
    selectedSlot,
    selectSlot,
    planComplete,
    seasonFunding,
    sway,
    goodwillRemaining,
    dedicationsUsed: dedicationsUsed(sway),
    maxDedications: MAX_DEDICATIONS,
    toggleDedication,
    setAsk,
    toggleRestricted,
    beginSeason,
    slotWorks,
    filledSlotWorks,
    currentSlotName,
    lastDeltas,
    handleRunConcert,
    handleDone,
    navigateTo,
    handleNewSeason,
    handleHomeNavigate,
    handleFoundOrchestra,
  }
}
