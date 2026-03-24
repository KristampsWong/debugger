import { describe, it, expect, beforeEach } from 'vitest'
import { useLevelStore } from '../levelStore'
import type { Level, TestResult } from '../../types'

const mockLevel: Level = {
  id: 'test-level',
  title: 'Test Level',
  client: {
    name: 'Test Client',
    avatar: '',
    brief: 'Fix the bug',
    completionMessage: 'Thanks!',
  },
  difficulty: 1,
  payout: 100,
  prerequisites: [],
  html: '<div class="box">Hello</div>',
  buggyCSS: '.box { color: blue; }',
  solutionCSS: '.box { color: red; }',
  bugLines: [1],
  tests: [
    {
      id: 'test-1',
      description: 'Box should be red',
      assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
    },
  ],
}

describe('levelStore', () => {
  beforeEach(() => {
    useLevelStore.getState().reset()
  })

  it('starts with null level', () => {
    const state = useLevelStore.getState()
    expect(state.currentLevel).toBeNull()
    expect(state.currentCSS).toBe('')
    expect(state.testResults).toEqual([])
    expect(state.allPassed).toBe(false)
  })

  it('loadLevel sets level and buggy CSS', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    const state = useLevelStore.getState()
    expect(state.currentLevel).toEqual(mockLevel)
    expect(state.currentCSS).toBe('.box { color: blue; }')
  })

  it('loadLevel uses saved CSS if provided', () => {
    useLevelStore.getState().loadLevel(mockLevel, '.box { color: green; }')
    expect(useLevelStore.getState().currentCSS).toBe('.box { color: green; }')
  })

  it('updateCSS changes current CSS', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    useLevelStore.getState().updateCSS('.box { color: red; }')
    expect(useLevelStore.getState().currentCSS).toBe('.box { color: red; }')
  })

  it('updateTestResults sets results and computes allPassed', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    const results: TestResult[] = [{ testId: 'test-1', passed: true }]
    useLevelStore.getState().updateTestResults(results)
    const state = useLevelStore.getState()
    expect(state.testResults).toEqual(results)
    expect(state.allPassed).toBe(true)
  })

  it('allPassed is false when any test fails', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    const results: TestResult[] = [{ testId: 'test-1', passed: false, failedAssertion: 'color mismatch' }]
    useLevelStore.getState().updateTestResults(results)
    expect(useLevelStore.getState().allPassed).toBe(false)
  })

  it('reset clears everything', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    useLevelStore.getState().reset()
    expect(useLevelStore.getState().currentLevel).toBeNull()
    expect(useLevelStore.getState().currentCSS).toBe('')
  })
})
