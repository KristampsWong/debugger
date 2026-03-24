import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
    <Dialog open={true}>
      <DialogContent className="text-center sm:max-w-md" data-testid="level-complete-modal">
        <DialogHeader>
          <DialogTitle className="text-center text-green-500">Level Complete!</DialogTitle>
        </DialogHeader>
        <div>
          <p className="text-muted-foreground">
            <strong>{clientName}:</strong> {completionMessage}
          </p>
          <div className="mt-4">
            <p>
              Time: {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
            {alreadyCompleted ? (
              <p data-testid="already-completed" className="text-muted-foreground">Already completed</p>
            ) : (
              <p data-testid="payout" className="font-mono text-2xl font-bold text-green-500">
                +${payout}
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
          <Button asChild variant="outline">
            <Link to="/board">Back to Board</Link>
          </Button>
          <Button variant="outline" onClick={onReplay}>
            Replay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
