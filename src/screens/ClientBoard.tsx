import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { levels } from '../data/levels'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ClientBoard() {
  const { money, completedLevels } = useGameStore()

  const isLevelUnlocked = (prerequisites: string[]) =>
    prerequisites.every((id) => completedLevels.includes(id))

  return (
    <div className="mx-auto max-w-[900px] p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Board</h1>
        <div className="flex items-center gap-4">
          <span data-testid="money" className="font-mono text-lg font-bold text-green-500">
            ${money}
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link to="/shop">Shop</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Menu</Link>
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {levels.map((level) => {
          const unlocked = isLevelUnlocked(level.prerequisites)
          const completed = completedLevels.includes(level.id)

          return (
            <Card
              key={level.id}
              data-testid="level-card"
              className={`flex flex-col ${!unlocked ? 'opacity-50' : ''} ${completed ? 'border-green-500' : ''}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{level.title}</CardTitle>
                <p data-testid="client-name" className="text-sm text-muted-foreground">
                  {level.client.name}
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <p data-testid="brief" className="text-sm text-muted-foreground">
                  {level.client.brief}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex w-full justify-between">
                  <span data-testid="difficulty" className="text-yellow-500">
                    {'★'.repeat(level.difficulty)}
                  </span>
                  <span data-testid="payout" className="font-mono text-green-500">
                    ${level.payout}
                  </span>
                </div>
                {unlocked ? (
                  <Button asChild className="w-full" size="sm">
                    <Link to={`/mission/${level.id}`}>
                      {completed ? 'Replay' : 'Accept Contract'}
                    </Link>
                  </Button>
                ) : (
                  <p data-testid="locked-label" className="w-full text-center text-sm text-muted-foreground">
                    Locked
                  </p>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
