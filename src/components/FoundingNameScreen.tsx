import { FormEvent, useMemo, useState } from 'react'
import {
  ORCHESTRA_NAME_MAX_LENGTH,
  isValidOrchestraName,
  sanitizeOrchestraName,
} from '../sim/founding'

interface FoundingNameScreenProps {
  onFound: (orchestraName: string) => void
  onPlanFirstSeason: () => void
}

export default function FoundingNameScreen({ onFound, onPlanFirstSeason }: FoundingNameScreenProps) {
  const [draftName, setDraftName] = useState('')
  const [foundedName, setFoundedName] = useState<string | null>(null)
  const cleanName = useMemo(() => sanitizeOrchestraName(draftName), [draftName])
  const canConfirm = isValidOrchestraName(draftName)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canConfirm) return
    setFoundedName(cleanName)
    onFound(cleanName)
  }

  return (
    <div className="enter-screen founding-screen">
      <div className="enter-content founding-content">
        <div className="enter-logo-wrap founding-logo-wrap" aria-label="Orchestra Manager">
          <img src="/open.png" alt="" className="enter-logo" aria-hidden="true" />
        </div>

        {foundedName ? (
          <div className="founding-panel founding-panel-confirmed" aria-live="polite">
            <p className="founding-kicker">Founding charter sealed</p>
            <h1>You have founded {foundedName}.</h1>
            <button className="enter-play-btn founding-action" onClick={onPlanFirstSeason}>
              Plan Your First Season
            </button>
          </div>
        ) : (
          <form className="founding-panel" onSubmit={handleSubmit}>
            <label className="founding-prompt" htmlFor="orchestra-name">
              Welcome to Orchestra Manager. What is your orchestra&apos;s name?
            </label>
            <input
              id="orchestra-name"
              className="founding-input"
              type="text"
              value={draftName}
              onChange={event => setDraftName(event.target.value.slice(0, ORCHESTRA_NAME_MAX_LENGTH))}
              maxLength={ORCHESTRA_NAME_MAX_LENGTH}
              autoFocus
              aria-describedby="orchestra-name-rule"
            />
            <p id="orchestra-name-rule" className="founding-rule">
              2–60 characters. Accidental spaces at the beginning or end are ignored.
            </p>
            <button className="enter-play-btn founding-action" type="submit" disabled={!canConfirm}>
              Confirm Name
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
