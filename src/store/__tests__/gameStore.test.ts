import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  describe('initial state', () => {
    it('starts with zero money', () => {
      expect(useGameStore.getState().money).toBe(0)
    })

    it('starts with no completed levels', () => {
      expect(useGameStore.getState().completedLevels).toEqual([])
    })

    it('starts with no owned tools', () => {
      expect(useGameStore.getState().ownedTools).toEqual([])
    })
  })

  describe('completeLevel', () => {
    it('adds payout to money on first completion', () => {
      useGameStore.getState().completeLevel('level-01', 100, 30)
      expect(useGameStore.getState().money).toBe(100)
    })

    it('adds level to completedLevels', () => {
      useGameStore.getState().completeLevel('level-01', 100, 30)
      expect(useGameStore.getState().completedLevels).toContain('level-01')
    })

    it('does NOT add payout on repeated completion', () => {
      useGameStore.getState().completeLevel('level-01', 100, 30)
      useGameStore.getState().completeLevel('level-01', 100, 25)
      expect(useGameStore.getState().money).toBe(100)
    })

    it('does NOT duplicate level in completedLevels', () => {
      useGameStore.getState().completeLevel('level-01', 100, 30)
      useGameStore.getState().completeLevel('level-01', 100, 25)
      expect(useGameStore.getState().completedLevels).toEqual(['level-01'])
    })

    it('records best time on first completion', () => {
      useGameStore.getState().completeLevel('level-01', 100, 45)
      expect(useGameStore.getState().bestTimes['level-01']).toBe(45)
    })

    it('updates best time when new time is faster', () => {
      useGameStore.getState().completeLevel('level-01', 100, 45)
      useGameStore.getState().completeLevel('level-01', 100, 30)
      expect(useGameStore.getState().bestTimes['level-01']).toBe(30)
    })

    it('keeps best time when new time is slower', () => {
      useGameStore.getState().completeLevel('level-01', 100, 30)
      useGameStore.getState().completeLevel('level-01', 100, 60)
      expect(useGameStore.getState().bestTimes['level-01']).toBe(30)
    })

    it('accumulates money across different levels', () => {
      useGameStore.getState().completeLevel('level-01', 100, 30)
      useGameStore.getState().completeLevel('level-02', 200, 45)
      expect(useGameStore.getState().money).toBe(300)
    })
  })

  describe('buyTool', () => {
    beforeEach(() => {
      useGameStore.getState().completeLevel('level-01', 500, 30)
    })

    it('deducts price and adds tool', () => {
      useGameStore.getState().buyTool('syntax-highlighter', 50)
      expect(useGameStore.getState().money).toBe(450)
      expect(useGameStore.getState().ownedTools).toContain('syntax-highlighter')
    })

    it('does nothing when money is insufficient', () => {
      useGameStore.getState().buyTool('expensive-tool', 9999)
      expect(useGameStore.getState().money).toBe(500)
      expect(useGameStore.getState().ownedTools).toEqual([])
    })

    it('does nothing when tool is already owned', () => {
      useGameStore.getState().buyTool('syntax-highlighter', 50)
      useGameStore.getState().buyTool('syntax-highlighter', 50)
      expect(useGameStore.getState().money).toBe(450)
      expect(useGameStore.getState().ownedTools).toEqual(['syntax-highlighter'])
    })
  })

  describe('saveProgress', () => {
    it('saves CSS for a level', () => {
      useGameStore.getState().saveProgress('level-01', 'body { color: red; }')
      expect(useGameStore.getState().inProgressCSS['level-01']).toBe('body { color: red; }')
    })

    it('overwrites previous saved CSS', () => {
      useGameStore.getState().saveProgress('level-01', 'old css')
      useGameStore.getState().saveProgress('level-01', 'new css')
      expect(useGameStore.getState().inProgressCSS['level-01']).toBe('new css')
    })

    it('saves independently per level', () => {
      useGameStore.getState().saveProgress('level-01', 'css-1')
      useGameStore.getState().saveProgress('level-02', 'css-2')
      expect(useGameStore.getState().inProgressCSS['level-01']).toBe('css-1')
      expect(useGameStore.getState().inProgressCSS['level-02']).toBe('css-2')
    })
  })

  describe('resetGame', () => {
    it('resets all state to initial values', () => {
      useGameStore.getState().completeLevel('level-01', 100, 30)
      useGameStore.getState().buyTool('syntax-highlighter', 50)
      useGameStore.getState().saveProgress('level-01', 'some css')
      useGameStore.getState().resetGame()

      const state = useGameStore.getState()
      expect(state.money).toBe(0)
      expect(state.completedLevels).toEqual([])
      expect(state.ownedTools).toEqual([])
      expect(state.inProgressCSS).toEqual({})
      expect(state.bestTimes).toEqual({})
    })
  })
})
