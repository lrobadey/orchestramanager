interface EnterScreenProps {
  onEnter: () => void
}

export default function EnterScreen({ onEnter }: EnterScreenProps) {
  return (
    <div className="enter-screen">
      <div className="enter-content">
        <div className="enter-logo-wrap" aria-label="Orchestra Manager">
          <img src="/open.png" alt="" className="enter-logo" aria-hidden="true" />
        </div>
        <button className="enter-play-btn" onClick={onEnter}>
          Enter
        </button>
      </div>
    </div>
  )
}
