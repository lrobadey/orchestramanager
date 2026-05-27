interface EnterScreenProps {
  onEnter: () => void
}

export default function EnterScreen({ onEnter }: EnterScreenProps) {
  return (
    <div className="enter-screen">
      <div className="enter-content">
        <img src="/open.png" alt="Orchestra Manager" className="enter-logo" />
        <button className="enter-play-btn" onClick={onEnter}>
          Enter
        </button>
      </div>
    </div>
  )
}
