import type { Test, TestResult } from '../types'

const COLOR_PROPERTIES = new Set([
  'color', 'background-color', 'border-color',
  'border-top-color', 'border-right-color',
  'border-bottom-color', 'border-left-color', 'outline-color',
])

interface TestPanelProps {
  tests: Test[]
  results: TestResult[]
  showPropertyHints: boolean
  showEnhancedErrors?: boolean
}

export function TestPanel({ tests, results, showPropertyHints, showEnhancedErrors = false }: TestPanelProps) {
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
              className={`flex flex-col gap-1 rounded px-2 py-1.5 text-sm ${
                status === 'passed'
                  ? 'text-green-500'
                  : status === 'failed'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 font-mono font-bold">
                  {status === 'passed' ? '✓' : status === 'failed' ? '✗' : '○'}
                </span>
                <span data-testid="test-description">{test.description}</span>
                {showPropertyHints && (
                  <span data-testid="test-hints" className="ml-auto font-mono text-xs text-muted-foreground">
                    {test.assertions.map((a) => a.property).join(', ')}
                  </span>
                )}
              </div>
              {showEnhancedErrors && result && !result.passed && result.failureDetail && (
                <div className="ml-6 rounded bg-muted p-2 text-xs" data-testid="error-detail">
                  {result.failureDetail.type === 'not-found' ? (
                    <span>Element not found: <code className="font-mono text-yellow-400">{result.failureDetail.selector}</code></span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>Expected:</span>
                        {COLOR_PROPERTIES.has(result.failureDetail.property) && (
                          <span
                            data-testid="color-swatch"
                            className="inline-block h-3 w-3 rounded border border-border"
                            style={{ backgroundColor: result.failureDetail.expected }}
                          />
                        )}
                        <code className="font-mono text-green-400">{result.failureDetail.expected}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Actual:</span>
                        {COLOR_PROPERTIES.has(result.failureDetail.property) && (
                          <span
                            data-testid="color-swatch"
                            className="inline-block h-3 w-3 rounded border border-border"
                            style={{ backgroundColor: result.failureDetail.actual }}
                          />
                        )}
                        <code className="font-mono text-red-400">{result.failureDetail.actual}</code>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
