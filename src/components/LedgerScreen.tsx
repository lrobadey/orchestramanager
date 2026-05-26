import type { ReactNode } from 'react'
import type { ConcertForecast, FinanceTransaction, InstitutionState, SeasonState } from '../types/core'
import CanopyHeader from './home/CanopyHeader'
import UnderstoryVitals from './home/UnderstoryVitals'
import '../styles/home.css'

interface LedgerScreenProps {
  season: SeasonState
  forecast: ConcertForecast
  institution: InstitutionState
  onNavigate: (key: 'home' | 'roster' | 'programme' | 'library' | 'ledger' | 'donors' | 'audience') => void
}

export default function LedgerScreen({
  season,
  forecast,
  institution,
  onNavigate,
}: LedgerScreenProps) {
  const allTransactions = season.slots.flatMap(slot => slot.financeTransactions)
  const transactions = allTransactions
    .filter(transaction => transaction.status === 'posted')
    .slice()
    .reverse()
    .slice(0, 8)
  const donorWatch = allTransactions
    .filter(transaction => transaction.status === 'scheduled' && transaction.kind === 'donor-support' && transaction.amount > 0)
    .slice(0, 4)
  const billsQueued = allTransactions
    .filter(transaction => transaction.status === 'scheduled' && transaction.amount < 0)
    .slice(0, 4)

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
                <StubPanel title="Donor watch" stub={false}>
                  {donorWatch.length > 0 ? donorWatch.map(row => (
                    <TransactionRow key={row.id} transaction={row} />
                  )) : (
                    <EmptyFinanceRow label="No donor pledges scheduled" />
                  )}
                </StubPanel>

                <StubPanel title="Bills queued" stub={false}>
                  {billsQueued.length > 0 ? billsQueued.map(row => (
                    <TransactionRow key={row.id} transaction={row} />
                  )) : (
                    <EmptyFinanceRow label="No bills queued" />
                  )}
                </StubPanel>

                <StubPanel title="Recent transactions" stub={false}>
                  {transactions.length > 0 ? transactions.map(row => (
                    <TransactionRow key={row.id} transaction={row} />
                  )) : (
                    <EmptyFinanceRow label="No resolved transactions yet" note="Run a concert" />
                  )}
                </StubPanel>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function TransactionRow({ transaction }: { transaction: FinanceTransaction }) {
  return (
    <div className={`ledger-stub-row ${transaction.amount < 0 ? 'expense' : 'income'}`}>
      <strong>{transaction.label}</strong>
      <span>{fullMoney(transaction.amount)}</span>
      <em>{transaction.concertName} · {dueLabel(transaction)}</em>
    </div>
  )
}

function EmptyFinanceRow({ label, note = 'Pending' }: { label: string; note?: string }) {
  return (
    <div className="ledger-stub-row">
      <strong>{label}</strong>
      <span>Pending</span>
      <em>{note}</em>
    </div>
  )
}

function StubPanel({ title, children, stub = true }: { title: string; children: ReactNode; stub?: boolean }) {
  return (
    <div className="ledger-stub-panel">
      <div className="ledger-stub-head">
        <span className="hc-label">{title}</span>
        {stub && <span className="inbox-stub-flag">STUB</span>}
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

function fullMoney(value: number): string {
  const prefix = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}$${Math.round(Math.abs(value)).toLocaleString()}`
}

function dueLabel(transaction: FinanceTransaction): string {
  if (transaction.status === 'posted') return transaction.postedDate ? `posted ${transaction.postedDate}` : 'posted'
  return `due ${transaction.dueDate}`
}
