import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { levels } from '../data/levels'

export function ClientBoard() {
  const { money, completedLevels } = useGameStore()

  const isLevelUnlocked = (prerequisites: string[]) =>
    prerequisites.every((id) => completedLevels.includes(id))

  return (
    <div className="client-board">
      <header className="board-header">
        <h1>Job Board</h1>
        <div className="board-actions">
          <span className="money">${money}</span>
          <Link to="/shop" className="shop-link">Shop</Link>
          <Link to="/" className="back-link">Menu</Link>
        </div>
      </header>
      <div className="level-grid">
        {levels.map((level) => {
          const unlocked = isLevelUnlocked(level.prerequisites)
          const completed = completedLevels.includes(level.id)

          return (
            <div
              key={level.id}
              className={`level-card ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
            >
              <h3>{level.title}</h3>
              <p className="client-name">{level.client.name}</p>
              <p className="brief">{level.client.brief}</p>
              <div className="level-meta">
                <span className="difficulty">{'★'.repeat(level.difficulty)}</span>
                <span className="payout">${level.payout}</span>
              </div>
              {unlocked ? (
                <Link to={`/mission/${level.id}`} className="start-btn">
                  {completed ? 'Replay' : 'Accept Contract'}
                </Link>
              ) : (
                <span className="locked-label">Locked</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
