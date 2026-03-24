import { Link } from 'react-router-dom'

interface LevelCompleteModalProps {
  clientName: string
  completionMessage: string
  payout: number
  time: number
  alreadyCompleted: boolean
  onReplay: () => void
}

export function LevelCompleteModal({
  clientName,
  completionMessage,
  payout,
  time,
  alreadyCompleted,
  onReplay,
}: LevelCompleteModalProps) {
  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Level Complete!</h2>
        <p className="client-message">
          <strong>{clientName}:</strong> {completionMessage}
        </p>
        <div className="modal-stats">
          <p>
            Time: {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          {alreadyCompleted ? (
            <p className="already-completed">Already completed</p>
          ) : (
            <p className="payout">+${payout}</p>
          )}
        </div>
        <div className="modal-actions">
          <Link to="/board" className="modal-btn">
            Back to Board
          </Link>
          <button onClick={onReplay} className="modal-btn">
            Replay
          </button>
        </div>
      </div>
    </div>
  )
}
