import type { Test, TestResult } from '../types'

interface TestPanelProps {
  tests: Test[]
  results: TestResult[]
  showPropertyHints: boolean
}

export function TestPanel({ tests, results, showPropertyHints }: TestPanelProps) {
  const getResult = (testId: string) => results.find((r) => r.testId === testId)

  return (
    <div className="max-h-[250px] overflow-y-auto bg-muted/50 p-3" data-testid="test-panel">
      <h3 className="mb-2 text-sm text-muted-foreground">Tests</h3>
      <ul className="flex list-none flex-col gap-1.5">
        {tests.map((test) => {
          const result = getResult(test.id)
          const status = result ? (result.passed ? 'passed' : 'failed') : 'pending'

          return (
            <li
              key={test.id}
              role="listitem"
              data-testid="test-item"
              data-status={status}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                status === 'passed'
                  ? 'text-green-500'
                  : status === 'failed'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              }`}
            >
              <span className="w-4 font-mono font-bold">
                {status === 'passed' ? '✓' : status === 'failed' ? '✗' : '○'}
              </span>
              <span data-testid="test-description">{test.description}</span>
              {showPropertyHints && (
                <span data-testid="test-hints" className="ml-auto font-mono text-xs text-muted-foreground">
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
