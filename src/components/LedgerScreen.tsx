import {
  LEDGER_BILL_STUBS,
  LEDGER_DONOR_STUBS,
  LEDGER_TRANSACTION_STUBS,
} from '../data/consoleStubs'
import type { ConcertForecast, InstitutionState, SeasonState } from '../types/core'
import CanopyHeader from './home/CanopyHeader'
import UnderstoryVitals from './home/UnderstoryVitals'
import '../styles/home.css'

interface LedgerScreenProps {
  season: SeasonState
  forecast: ConcertForecast
  institution: InstitutionState
  onNavigate: (key: 'home' | 'roster' | 'programme' | 'library' | 'ledger') => void
}

export default function LedgerScreen({
  season,
  forecast,
  institution,
  onNavigate,
}: LedgerScreenProps) {
  const rows = season.slots.map(slot => {
    if (slot.report) {
      return {
        id: slot.index,
        name: slot.name,
        status: 'resolved',
        revenue: money(slot.report.revenue),
        donor: money(slot.report.donorUplift),
        expenses: money(slot.report.expenses),
        net: money(slot.report.net),
      }
    }

    if (slot.index === season.currentSlotIndex && forecast.isComplete) {
      return {
        id: slot.index,
        name: slot.name,
        status: 'forecast',
        revenue: money(forecast.projectedRevenue),
        donor: money(forecast.projectedDonorUplift),
        expenses: money(forecast.projectedExpenses),
        net: money(forecast.projectedNet),
      }
    }

    return {
      id: slot.index,
      name: slot.name,
      status: 'planning',
      revenue: 'Planning',
      donor: 'Pending',
      expenses: 'Pending',
      net: 'Unmodeled',
    }
  })

  return (
    <div className="home-console">
      <div className="home-strata">
        <CanopyHeader
          institution={institution}
          season={season}
          activeNav="ledger"
          onNavigate={onNavigate}
        />
        <UnderstoryVitals institution={institution} />
        <div className="home-stratum floor console-screen-floor">
          <section className="ledger-screen">
            <div className="ledger-head">
              <div>
                <span className="hc-eyebrow">Production ledger</span>
                <h2 className="ledger-title hc-display">Cash motion.</h2>
              </div>
              <div className="ledger-cash">
                <span className="hc-label">Current cash</span>
                <strong>{money(institution.cash)}</strong>
              </div>
            </div>

            <div className="ledger-layout">
              <div className="ledger-table" role="table" aria-label="Season concert profit and loss">
                <div className="ledger-row ledger-row-head" role="row">
                  <span>Concert</span>
                  <span>Status</span>
                  <span>Revenue</span>
                  <span>Donor</span>
                  <span>Expenses</span>
                  <span>Net</span>
                </div>
                {rows.map(row => (
                  <div key={row.id} className={`ledger-row ${row.status}`} role="row">
                    <span className="ledger-concert-name">{row.name}</span>
                    <span className="ledger-status">{row.status}</span>
                    <span>{row.revenue}</span>
                    <span>{row.donor}</span>
                    <span>{row.expenses}</span>
                    <span className={row.net.startsWith('-') ? 'negative' : ''}>{row.net}</span>
                  </div>
                ))}
              </div>

              <aside className="ledger-side">
                <StubPanel title="Donor watch">
                  {LEDGER_DONOR_STUBS.map(row => (
                    <div key={row.id} className="ledger-stub-row">
                      <strong>{row.name}</strong>
                      <span>{row.pledgeLabel}</span>
                      <em>{row.restriction}</em>
                    </div>
                  ))}
                </StubPanel>

                <StubPanel title="Bills queued">
                  {LEDGER_BILL_STUBS.map(row => (
                    <div key={row.id} className="ledger-stub-row">
                      <strong>{row.vendor}</strong>
                      <span>{row.amountLabel}</span>
                      <em>{row.dueLabel}</em>
                    </div>
                  ))}
                </StubPanel>

                <StubPanel title="Recent transactions">
                  {LEDGER_TRANSACTION_STUBS.map(row => (
                    <div key={row.id} className={`ledger-stub-row ${row.kind}`}>
                      <strong>{row.label}</strong>
                      <span>{row.amountLabel}</span>
                      <em>STUB row</em>
                    </div>
                  ))}
                </StubPanel>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StubPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ledger-stub-panel">
      <div className="ledger-stub-head">
        <span className="hc-label">{title}</span>
        <span className="inbox-stub-flag">STUB</span>
      </div>
      {children}
    </div>
  )
}

function money(value: number): string {
  const rounded = Math.round(value / 1000)
  const prefix = rounded > 0 ? '+' : ''
  return `${prefix}$${rounded}K`
}
