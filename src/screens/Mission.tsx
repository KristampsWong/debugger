import { useEffect, useRef, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useLevelStore } from '../store/levelStore'
import { getLevelById } from '../data/levels'
import { runTests } from '../engine/testRunner'
import { CodeEditor } from '../components/CodeEditor'
import { LivePreview } from '../components/LivePreview'
import { TestPanel } from '../components/TestPanel'
import { ClientBrief } from '../components/ClientBrief'
import { LevelCompleteModal } from '../components/LevelCompleteModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CSSReferencePanel } from '../components/CSSReferencePanel'

const NOOP = () => {}

export function Mission() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()

  const { ownedTools, disabledTools, completeLevel, saveProgress } = useGameStore()
  const {
    currentLevel,
    currentCSS,
    testResults,
    allPassed,
    elapsedTime,
    loadLevel,
    updateCSS,
    updateTestResults,
    tick,
    reset,
  } = useLevelStore()

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [showComplete, setShowComplete] = useState(false)
  const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false)
  const [showReference, setShowReference] = useState(false)

  useEffect(() => {
    if (!levelId) return
    const level = getLevelById(levelId)
    if (!level) {
      navigate('/board')
      return
    }
    const { completedLevels: completed, skippedLevels: skipped, inProgressCSS: saved } = useGameStore.getState()
    const unlocked = level.prerequisites.every((id) => completed.includes(id))
    if (!unlocked) {
      navigate('/board')
      return
    }
    setWasAlreadyCompleted(completed.includes(levelId) && !skipped.includes(levelId))
    loadLevel(level, saved[levelId])

    timerRef.current = setInterval(() => tick(), 1000)

    return () => {
      clearInterval(timerRef.current)
      reset()
    }
  }, [levelId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCSSChange = useCallback(
    (css: string) => {
      updateCSS(css)

      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (levelId) saveProgress(levelId, css)
      }, 300)
    },
    [levelId, updateCSS, saveProgress]
  )

  const handleIframeReady = useCallback(
    (doc: Document) => {
      if (!currentLevel) return
      const results = runTests(currentLevel.tests, doc)
      updateTestResults(results)
    },
    [currentLevel, updateTestResults]
  )

  const handleSubmit = () => {
    if (!currentLevel || !allPassed) return
    setShowComplete(true)
    completeLevel(currentLevel.id, currentLevel.payout, elapsedTime)
    clearInterval(timerRef.current)
  }

  const handleReplay = () => {
    if (!currentLevel) return
    setShowComplete(false)
    setWasAlreadyCompleted(true)
    loadLevel(currentLevel)
    timerRef.current = setInterval(() => tick(), 1000)
  }

  if (!currentLevel) return null

  const isToolActive = (id: string) =>
    ownedTools.includes(id) && !disabledTools.includes(id)

  const hasPropertyHint = isToolActive('property-hint')
  const hasBugDetector = isToolActive('bug-detector')
  const hasAutocomplete = isToolActive('syntax-highlighter')
  const hasClientCall = isToolActive('client-call')
  const hasSolutionPreview = isToolActive('solution-preview')
  const hasCSSReference = ownedTools.includes('css-reference')

  return (
    <div className="flex h-screen flex-col" data-testid="mission-screen">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/50 px-4 py-2">
        <ClientBrief
          clientName={currentLevel.client.name}
          brief={currentLevel.client.brief}
          hintMessage={currentLevel.client.hintMessage}
          showHint={hasClientCall}
        />
        <div className="flex items-center gap-4">
          <Badge variant="outline" data-testid="timer" className="font-mono text-base">
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </Badge>
          <Button
            disabled={!allPassed}
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700"
          >
            Submit
          </Button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="relative w-1/2 border-r border-border">
          {hasCSSReference && (
            <button
              onClick={() => setShowReference(!showReference)}
              aria-label="Open CSS reference"
              className="absolute right-2 top-2 z-20 rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              📖 Ref
            </button>
          )}
          <CodeEditor
            value={currentCSS}
            onChange={handleCSSChange}
            bugLines={currentLevel.bugLines}
            showBugDetector={hasBugDetector}
            enableAutocomplete={hasAutocomplete}
          />
          {hasCSSReference && (
            <CSSReferencePanel
              open={showReference}
              onClose={() => setShowReference(false)}
            />
          )}
        </div>
        <div className="flex w-1/2 flex-col">
          {hasSolutionPreview ? (
            <>
              <div className="flex flex-1 flex-col overflow-hidden min-[500px]:flex-row">
                <div className="flex min-h-0 flex-1 flex-col min-[500px]:w-1/2 min-[500px]:flex-none">
                  <LivePreview
                    html={currentLevel.html}
                    css={currentCSS}
                    onIframeReady={handleIframeReady}
                    label="My Result"
                  />
                </div>
                <div className="flex min-h-0 flex-1 flex-col border-l border-border min-[500px]:w-1/2 min-[500px]:flex-none">
                  <LivePreview
                    html={currentLevel.html}
                    css={currentLevel.solutionCSS}
                    onIframeReady={NOOP}
                    label="Correct Answer"
                  />
                </div>
              </div>
              <TestPanel
                tests={currentLevel.tests}
                results={testResults}
                showPropertyHints={hasPropertyHint}
              />
            </>
          ) : (
            <>
              <LivePreview
                html={currentLevel.html}
                css={currentCSS}
                onIframeReady={handleIframeReady}
              />
              <TestPanel
                tests={currentLevel.tests}
                results={testResults}
                showPropertyHints={hasPropertyHint}
              />
            </>
          )}
        </div>
      </div>
      {showComplete && (
        <LevelCompleteModal
          clientName={currentLevel.client.name}
          completionMessage={currentLevel.client.completionMessage}
          payout={currentLevel.payout}
          time={elapsedTime}
          alreadyCompleted={wasAlreadyCompleted}
          onReplay={handleReplay}
        />
      )}
    </div>
  )
}
