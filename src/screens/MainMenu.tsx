import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { Button } from '@/components/ui/button'

export function MainMenu() {
  const { completedLevels, resetGame } = useGameStore()
  const hasSave = completedLevels.length > 0

  const handleNewGame = () => {
    resetGame()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-mono text-6xl font-bold text-primary">Debugger</h1>
      <p className="mb-6 text-lg text-muted-foreground">
        Fix bugs. Get paid. Buy better tools.
      </p>
      <nav className="flex flex-col gap-3">
        <Button asChild size="lg" className="px-12">
          <Link to="/board" onClick={handleNewGame}>
            New Game
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="px-12"
        >
          <Link
            to="/board"
            onClick={(e) => !hasSave && e.preventDefault()}
            aria-disabled={!hasSave || undefined}
            tabIndex={!hasSave ? -1 : undefined}
            className={!hasSave ? 'pointer-events-none opacity-40' : ''}
          >
            Continue
          </Link>
        </Button>
      </nav>
    </div>
  )
}
