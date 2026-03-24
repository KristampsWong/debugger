import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function MainMenu() {
  const { completedLevels, resetGame } = useGameStore()
  const hasSave = completedLevels.length > 0

  const handleNewGame = () => {
    resetGame()
  }

  return (
    <div className="main-menu">
      <h1>Debugger</h1>
      <p className="subtitle">Fix bugs. Get paid. Buy better tools.</p>
      <nav className="menu-actions">
        <Link to="/board" onClick={handleNewGame} className="menu-btn">
          New Game
        </Link>
        <Link
          to="/board"
          className={`menu-btn ${!hasSave ? 'disabled' : ''}`}
          onClick={(e) => !hasSave && e.preventDefault()}
        >
          Continue
        </Link>
      </nav>
    </div>
  )
}
