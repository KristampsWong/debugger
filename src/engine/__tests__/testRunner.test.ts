import { describe, it, expect } from 'vitest'
import { runTests } from '../testRunner'
import type { Test } from '../../types'

// Helper: create a minimal document with computed styles
function createMockDocument(styles: Record<string, Record<string, string>>) {
  const elements: Record<string, { props: Record<string, string> }> = {}
  for (const [selector, props] of Object.entries(styles)) {
    elements[selector] = { props }
  }

  return {
    querySelector: (selector: string) => elements[selector] ?? null,
    defaultView: {
      getComputedStyle: (el: { props: Record<string, string> }) => ({
        getPropertyValue: (prop: string) => el.props[prop] ?? '',
      }),
    },
  } as unknown as Document
}

describe('runTests', () => {
  it('returns passing result when assertion matches', () => {
    const doc = createMockDocument({
      '.box': { color: 'rgb(255, 0, 0)' },
    })
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Box is red',
        assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
      },
    ]
    const results = runTests(tests, doc)
    expect(results).toEqual([{ testId: 'test-1', passed: true }])
  })

  it('returns failing result when assertion does not match', () => {
    const doc = createMockDocument({
      '.box': { color: 'rgb(0, 0, 255)' },
    })
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Box is red',
        assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
      },
    ]
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(false)
    expect(results[0].failedAssertion).toBeDefined()
  })

  it('fails when selector not found', () => {
    const doc = createMockDocument({})
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Box is red',
        assertions: [{ selector: '.missing', property: 'color', expected: 'rgb(255, 0, 0)' }],
      },
    ]
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(false)
    expect(results[0].failedAssertion).toContain('element not found')
  })

  it('passes compound assertions only when all match', () => {
    const doc = createMockDocument({
      '.header': { position: 'fixed', top: '0px' },
    })
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Header fixed to top',
        assertions: [
          { selector: '.header', property: 'position', expected: 'fixed' },
          { selector: '.header', property: 'top', expected: '0px' },
        ],
      },
    ]
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(true)
  })

  it('fails compound assertions when one does not match', () => {
    const doc = createMockDocument({
      '.header': { position: 'fixed', top: '10px' },
    })
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Header fixed to top',
        assertions: [
          { selector: '.header', property: 'position', expected: 'fixed' },
          { selector: '.header', property: 'top', expected: '0px' },
        ],
      },
    ]
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(false)
  })

  it('runs multiple tests independently', () => {
    const doc = createMockDocument({
      '.box': { color: 'rgb(255, 0, 0)' },
      '.title': { 'font-weight': '400' },
    })
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
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(true)
    expect(results[1].passed).toBe(false)
  })
})
