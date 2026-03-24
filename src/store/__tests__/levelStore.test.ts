import { describe, it, expect, beforeEach } from 'vitest'
import { useLevelStore } from '../levelStore'
import type { Level, TestResult } from '../../types'

const mockLevel: Level = {
  id: 'test-level',
  title: 'Test Level',
  client: {
    name: 'Test Client',
    avatar: '',
    brief: 'Fix it',
    completionMessage: 'Done!',
  },
  difficulty: 1,
  payout: 100,
  prerequisites: [],
  html: '<div>Test</div>',
  buggyCSS: 'body { color: red; }',
  solutionCSS: 'body { color: blue; }',
  bugLines: [1],
  tests: [],
}

describe('levelStore', () => {
  beforeEach(() => {
    useLevelStore.getState().reset()
  })

  describe('initial state', () => {
    it('starts with null level', () => {
      expect(useLevelStore.getState().currentLevel).toBeNull()
    })

    it('starts with empty CSS', () => {
      expect(useLevelStore.getState().currentCSS).toBe('')
    })

    it('starts with allPassed false', () => {
      expect(useLevelStore.getState().allPassed).toBe(false)
    })

    it('starts with zero elapsed time', () => {
      expect(useLevelStore.getState().elapsedTime).toBe(0)
    })
  })

  describe('loadLevel', () => {
    it('sets current level and defaults to buggyCSS', () => {
      useLevelStore.getState().loadLevel(mockLevel)
      const state = useLevelStore.getState()

      expect(state.currentLevel).toEqual(mockLevel)
      expect(state.currentCSS).toBe('body { color: red; }')
    })

    it('uses saved CSS when provided', () => {
      useLevelStore.getState().loadLevel(mockLevel, 'saved { color: green; }')
      expect(useLevelStore.getState().currentCSS).toBe('saved { color: green; }')
    })

    it('resets test results and timer', () => {
      useLevelStore.getState().tick()
      useLevelStore.getState().tick()
      useLevelStore.getState().loadLevel(mockLevel)

      expect(useLevelStore.getState().testResults).toEqual([])
      expect(useLevelStore.getState().allPassed).toBe(false)
      expect(useLevelStore.getState().elapsedTime).toBe(0)
    })
  })

  describe('updateCSS', () => {
    it('updates current CSS', () => {
      useLevelStore.getState().updateCSS('new { css: here; }')
      expect(useLevelStore.getState().currentCSS).toBe('new { css: here; }')
    })
  })

  describe('updateTestResults', () => {
    it('sets allPassed to true when all tests pass', () => {
      const results: TestResult[] = [
        { testId: 't1', passed: true },
        { testId: 't2', passed: true },
      ]
      useLevelStore.getState().updateTestResults(results)

      expect(useLevelStore.getState().allPassed).toBe(true)
      expect(useLevelStore.getState().testResults).toEqual(results)
    })

    it('sets allPassed to false when any test fails', () => {
      const results: TestResult[] = [
        { testId: 't1', passed: true },
        { testId: 't2', passed: false, failedAssertion: 'mismatch' },
      ]
      useLevelStore.getState().updateTestResults(results)

      expect(useLevelStore.getState().allPassed).toBe(false)
    })

    it('sets allPassed to false for empty results', () => {
      useLevelStore.getState().updateTestResults([])
      expect(useLevelStore.getState().allPassed).toBe(false)
    })

    it('sets allPassed to false when all tests fail', () => {
      const results: TestResult[] = [
        { testId: 't1', passed: false, failedAssertion: 'fail' },
      ]
      useLevelStore.getState().updateTestResults(results)

      expect(useLevelStore.getState().allPassed).toBe(false)
    })
  })

  describe('tick', () => {
    it('increments elapsed time by 1', () => {
      useLevelStore.getState().tick()
      expect(useLevelStore.getState().elapsedTime).toBe(1)
    })

    it('accumulates over multiple ticks', () => {
      useLevelStore.getState().tick()
      useLevelStore.getState().tick()
      useLevelStore.getState().tick()
      expect(useLevelStore.getState().elapsedTime).toBe(3)
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useLevelStore.getState().loadLevel(mockLevel)
      useLevelStore.getState().tick()
      useLevelStore.getState().updateTestResults([{ testId: 't1', passed: true }])
      useLevelStore.getState().reset()

      const state = useLevelStore.getState()
      expect(state.currentLevel).toBeNull()
      expect(state.currentCSS).toBe('')
      expect(state.testResults).toEqual([])
      expect(state.allPassed).toBe(false)
      expect(state.elapsedTime).toBe(0)
    })
  })
})
