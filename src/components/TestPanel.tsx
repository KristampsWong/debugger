import type { Test, TestResult } from '../types'

interface TestPanelProps {
  tests: Test[]
  results: TestResult[]
  showPropertyHints: boolean
}

export function TestPanel({ tests, results, showPropertyHints }: TestPanelProps) {
  const getResult = (testId: string) => results.find((r) => r.testId === testId)

  return (
    <div className="test-panel">
      <h3>Tests</h3>
      <ul className="test-list">
        {tests.map((test) => {
          const result = getResult(test.id)
          const status = result ? (result.passed ? 'passed' : 'failed') : 'pending'

          return (
            <li key={test.id} role="listitem" className={`test-item ${status}`}>
              <span className="test-status">
                {status === 'passed' ? '✓' : status === 'failed' ? '✗' : '○'}
              </span>
              <span className="test-description">{test.description}</span>
              {showPropertyHints && (
                <span className="test-hints">
                  {test.assertions.map((a) => a.property).join(', ')}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
