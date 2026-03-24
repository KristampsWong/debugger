import { describe, it, expect, vi } from 'vitest'
import { runTests } from '../testRunner'
import type { Test } from '../../types'

function createMockDoc(elements: Record<string, Record<string, string>>): Document {
  const doc = {
    querySelector: vi.fn((selector: string) => {
      const styles = elements[selector]
      if (!styles) return null
      return { __styles: styles }
    }),
    defaultView: {
      getComputedStyle: vi.fn((el: any) => ({
        getPropertyValue: (prop: string) => el.__styles[prop] ?? '',
      })),
    },
  }
  return doc as unknown as Document
}

describe('runTests', () => {
  it('returns passed when all assertions match', () => {
    const tests: Test[] = [
      {
        id: 't1',
        description: 'Box is red',
        assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
      },
    ]
    const doc = createMockDoc({ '.box': { color: 'rgb(255, 0, 0)' } })
    const results = runTests(tests, doc)

    expect(results).toEqual([{ testId: 't1', passed: true }])
  })

  it('returns failed when element is not found', () => {
    const tests: Test[] = [
      {
        id: 't1',
        description: 'Missing element',
        assertions: [{ selector: '.missing', property: 'color', expected: 'red' }],
      },
    ]
    const doc = createMockDoc({})
    const results = runTests(tests, doc)

    expect(results).toHaveLength(1)
    expect(results[0].passed).toBe(false)
    expect(results[0].failedAssertion).toContain('.missing')
    expect(results[0].failedAssertion).toContain('element not found')
  })

  it('returns failed when property value does not match', () => {
    const tests: Test[] = [
      {
        id: 't1',
        description: 'Wrong color',
        assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
      },
    ]
    const doc = createMockDoc({ '.box': { color: 'rgb(0, 0, 255)' } })
    const results = runTests(tests, doc)

    expect(results).toHaveLength(1)
    expect(results[0].passed).toBe(false)
    expect(results[0].failedAssertion).toContain('expected "rgb(255, 0, 0)"')
    expect(results[0].failedAssertion).toContain('got "rgb(0, 0, 255)"')
  })

  it('fails on the first failing assertion in a multi-assertion test', () => {
    const tests: Test[] = [
      {
        id: 't1',
        description: 'Multiple checks',
        assertions: [
          { selector: '.box', property: 'color', expected: 'red' },
          { selector: '.box', property: 'font-size', expected: '16px' },
        ],
      },
    ]
    const doc = createMockDoc({ '.box': { color: 'blue', 'font-size': '16px' } })
    const results = runTests(tests, doc)

    expect(results[0].passed).toBe(false)
    expect(results[0].failedAssertion).toContain('color')
  })

  it('passes when all assertions in a multi-assertion test match', () => {
    const tests: Test[] = [
      {
        id: 't1',
        description: 'Multiple checks',
        assertions: [
          { selector: '.box', property: 'color', expected: 'red' },
          { selector: '.box', property: 'font-size', expected: '16px' },
        ],
      },
    ]
    const doc = createMockDoc({ '.box': { color: 'red', 'font-size': '16px' } })
    const results = runTests(tests, doc)

    expect(results[0].passed).toBe(true)
  })

  it('handles multiple tests independently', () => {
    const tests: Test[] = [
      {
        id: 't1',
        description: 'Pass',
        assertions: [{ selector: '.a', property: 'color', expected: 'red' }],
      },
      {
        id: 't2',
        description: 'Fail',
        assertions: [{ selector: '.b', property: 'color', expected: 'blue' }],
      },
    ]
    const doc = createMockDoc({
      '.a': { color: 'red' },
      '.b': { color: 'green' },
    })
    const results = runTests(tests, doc)

    expect(results).toHaveLength(2)
    expect(results[0].passed).toBe(true)
    expect(results[1].passed).toBe(false)
  })

  it('returns empty array for empty tests', () => {
    const doc = createMockDoc({})
    const results = runTests([], doc)
    expect(results).toEqual([])
  })
})
