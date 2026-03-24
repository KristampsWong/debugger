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

export function Mission() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()

  const { completedLevels, ownedTools, inProgressCSS, completeLevel, saveProgress } =
    useGameStore()
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

  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const [showComplete, setShowComplete] = useState(false)
  const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false)

  // Load level on mount
  useEffect(() => {
    if (!levelId) return
    const level = getLevelById(levelId)
    if (!level) {
      navigate('/board')
      return
    }
    const { completedLevels: completed, inProgressCSS: saved } = useGameStore.getState()
    const unlocked = level.prerequisites.every((id) => completed.includes(id))
    if (!unlocked) {
      navigate('/board')
      return
    }
    setWasAlreadyCompleted(completed.includes(levelId))
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

  const hasPropertyHint = ownedTools.includes('property-hint')
  const hasBugDetector = ownedTools.includes('bug-detector')
  const hasAutocomplete = ownedTools.includes('syntax-highlighter')
  const hasClientCall = ownedTools.includes('client-call')

  return (
    <div className="mission-screen">
      <div className="mission-topbar">
        <ClientBrief
          clientName={currentLevel.client.name}
          brief={currentLevel.client.brief}
          hintMessage={currentLevel.client.hintMessage}
          showHint={hasClientCall}
        />
        <div className="mission-controls">
          <span className="timer">
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </span>
          <button
            className="submit-btn"
            disabled={!allPassed}
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
      <div className="mission-workspace">
        <div className="mission-left">
          <CodeEditor
            value={currentCSS}
            onChange={handleCSSChange}
            bugLines={currentLevel.bugLines}
            showBugDetector={hasBugDetector}
            enableAutocomplete={hasAutocomplete}
          />
        </div>
        <div className="mission-right">
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
