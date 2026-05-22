// STUB DATA for New UI console slices that do not yet have simulation backing.
//
// Grep for "STUB" when replacing these with real acquisition, donor, payable,
// and ledger systems. Keep these isolated so UI components can render the
// production SeasonState / Work data without smuggling new sim behavior into
// presentation code.

export interface LibraryAcquisitionStub {
  id: string
  label: string
  status: 'disabled'
  note: string
}

// STUB — replace when repertoire acquisition / licensing exists.
export const LIBRARY_ACQUISITION_STUBS: LibraryAcquisitionStub[] = [
  {
    id: 'rental-quote',
    label: 'Request rental quote',
    status: 'disabled',
    note: 'Rental quotes need publisher / material availability data.',
  },
  {
    id: 'commission-dossier',
    label: 'Open commission dossier',
    status: 'disabled',
    note: 'Commission workflows arrive with the inbox / composer layer.',
  },
  {
    id: 'mark-study',
    label: 'Mark for study',
    status: 'disabled',
    note: 'Study queues need a staff calendar and preparation model.',
  },
]

export interface LedgerDonorStub {
  id: string
  name: string
  pledgeLabel: string
  restriction: string
}

// STUB — replace when donor accounts and restricted gifts exist.
export const LEDGER_DONOR_STUBS: LedgerDonorStub[] = [
  {
    id: 'lindgren-foundation',
    name: 'Lindgren Foundation',
    pledgeLabel: '$18K pending',
    restriction: 'Sibelius / Nordic identity programming',
  },
  {
    id: 'elliott-circle',
    name: 'Elliott Bay Circle',
    pledgeLabel: '$9K soft pledge',
    restriction: 'Audience development match',
  },
]

export interface LedgerBillStub {
  id: string
  vendor: string
  dueLabel: string
  amountLabel: string
}

// STUB — replace when payables and vendor timing exist.
export const LEDGER_BILL_STUBS: LedgerBillStub[] = [
  { id: 'hall-deposit', vendor: 'Benaroya Hall deposit', dueLabel: 'Due Wk 7', amountLabel: '$12K' },
  { id: 'parts-rental', vendor: 'Parts rental reserve', dueLabel: 'Due on programme lock', amountLabel: '$4K' },
  { id: 'marketing-print', vendor: 'Print / street team hold', dueLabel: 'Due Wk 10', amountLabel: '$3K' },
]

export interface LedgerTransactionStub {
  id: string
  label: string
  amountLabel: string
  kind: 'income' | 'expense'
}

// STUB — replace when transaction history exists.
export const LEDGER_TRANSACTION_STUBS: LedgerTransactionStub[] = [
  { id: 'seed-grant', label: 'Founding grant tranche', amountLabel: '+$40K', kind: 'income' },
  { id: 'audition-rentals', label: 'Audition room rentals', amountLabel: '-$6K', kind: 'expense' },
  { id: 'identity-campaign', label: 'Launch identity campaign', amountLabel: '-$8K', kind: 'expense' },
]
