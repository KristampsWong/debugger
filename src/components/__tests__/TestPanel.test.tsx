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
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveClass('passed')
    expect(items[1]).toHaveClass('failed')
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
})
