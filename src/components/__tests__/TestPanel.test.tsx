import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestPanel } from '../TestPanel'
import type { Test, TestResult } from '../../types'

const tests: Test[] = [
  {
    id: 'test-1',
    description: 'Box is red',
    assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
  },
  {
    id: 'test-2',
    description: 'Title is bold',
    assertions: [{ selector: '.title', property: 'font-weight', expected: '700' }],
  },
]

describe('TestPanel', () => {
  it('renders test descriptions', () => {
    render(<TestPanel tests={tests} results={[]} showPropertyHints={false} />)
    expect(screen.getByText('Box is red')).toBeInTheDocument()
    expect(screen.getByText('Title is bold')).toBeInTheDocument()
  })

  it('shows pass/fail status', () => {
    const results: TestResult[] = [
      { testId: 'test-1', passed: true },
      { testId: 'test-2', passed: false, failedAssertion: 'font-weight mismatch' },
    ]
    render(<TestPanel tests={tests} results={results} showPropertyHints={false} />)
    const items = screen.getAllByTestId('test-item')
    expect(items[0]).toHaveAttribute('data-status', 'passed')
    expect(items[1]).toHaveAttribute('data-status', 'failed')
  })

  it('shows property hints when enabled', () => {
    render(<TestPanel tests={tests} results={[]} showPropertyHints={true} />)
    expect(screen.getByText(/color/)).toBeInTheDocument()
    expect(screen.getByText(/font-weight/)).toBeInTheDocument()
  })

  it('hides property hints when disabled', () => {
    render(<TestPanel tests={tests} results={[]} showPropertyHints={false} />)
    expect(screen.queryByText('color')).not.toBeInTheDocument()
  })

  describe('enhanced errors', () => {
    const failedResults: TestResult[] = [
      {
        testId: 'test-1',
        passed: true,
      },
      {
        testId: 'test-2',
        passed: false,
        failedAssertion: '"h1" color: expected "rgb(255, 0, 0)", got "rgb(0, 0, 0)"',
        failureDetail: {
          type: 'mismatch',
          selector: 'h1',
          property: 'color',
          expected: 'rgb(255, 0, 0)',
          actual: 'rgb(0, 0, 0)',
        },
      },
    ]

    it('shows expected and actual values when enhanced errors enabled', () => {
      render(
        <TestPanel
          tests={tests}
          results={failedResults}
          showPropertyHints={false}
          showEnhancedErrors={true}
        />
      )
      expect(screen.getByText(/Expected:/)).toBeInTheDocument()
      expect(screen.getByText(/rgb\(255, 0, 0\)/)).toBeInTheDocument()
      expect(screen.getByText(/Actual:/)).toBeInTheDocument()
      expect(screen.getByText(/rgb\(0, 0, 0\)/)).toBeInTheDocument()
    })

    it('renders color swatches for color properties', () => {
      render(
        <TestPanel
          tests={tests}
          results={failedResults}
          showPropertyHints={false}
          showEnhancedErrors={true}
        />
      )
      const swatches = screen.getAllByTestId('color-swatch')
      expect(swatches).toHaveLength(2)
    })

    it('does not show enhanced details when tool not owned', () => {
      render(
        <TestPanel
          tests={tests}
          results={failedResults}
          showPropertyHints={false}
          showEnhancedErrors={false}
        />
      )
      expect(screen.queryByText(/Expected:/)).not.toBeInTheDocument()
    })

    it('shows element-not-found message for not-found failures', () => {
      const notFoundResults: TestResult[] = [
        {
          testId: 'test-1',
          passed: false,
          failedAssertion: '".missing" — element not found',
          failureDetail: { type: 'not-found', selector: '.missing' },
        },
      ]
      render(
        <TestPanel
          tests={tests}
          results={notFoundResults}
          showPropertyHints={false}
          showEnhancedErrors={true}
        />
      )
      expect(screen.getByText(/Element not found:/)).toBeInTheDocument()
      expect(screen.getByText(/\.missing/)).toBeInTheDocument()
    })
  })
})
