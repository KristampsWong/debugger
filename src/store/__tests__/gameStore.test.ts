import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('starts with default state', () => {
    const state = useGameStore.getState()
    expect(state.money).toBe(0)
    expect(state.completedLevels).toEqual([])
    expect(state.ownedTools).toEqual([])
    expect(state.inProgressCSS).toEqual({})
    expect(state.bestTimes).toEqual({})
  })

  it('completeLevel adds money and marks level complete', () => {
    useGameStore.getState().completeLevel('level-01', 100, 45)
    const state = useGameStore.getState()
    expect(state.money).toBe(100)
    expect(state.completedLevels).toContain('level-01')
    expect(state.bestTimes['level-01']).toBe(45)
  })

  it('completeLevel does not double-pay for already completed levels', () => {
    useGameStore.getState().completeLevel('level-01', 100, 45)
    useGameStore.getState().completeLevel('level-01', 100, 30)
    const state = useGameStore.getState()
    expect(state.money).toBe(100)
    expect(state.bestTimes['level-01']).toBe(30) // best time still updates
  })

  it('buyTool deducts money and adds tool', () => {
    useGameStore.getState().completeLevel('level-01', 200, 45)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    const state = useGameStore.getState()
    expect(state.money).toBe(150)
    expect(state.ownedTools).toContain('syntax-highlighter')
  })

  it('buyTool fails if not enough money', () => {
    useGameStore.getState().buyTool('bug-detector', 150)
    const state = useGameStore.getState()
    expect(state.money).toBe(0)
    expect(state.ownedTools).not.toContain('bug-detector')
  })

  it('buyTool prevents duplicate non-consumable purchases', () => {
    useGameStore.getState().completeLevel('level-01', 300, 45)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    const state = useGameStore.getState()
    expect(state.money).toBe(250) // only deducted once
    expect(state.ownedTools.filter((t) => t === 'syntax-highlighter')).toHaveLength(1)
  })

  it('saveProgress stores CSS for a level', () => {
    useGameStore.getState().saveProgress('level-01', '.header { color: red; }')
    const state = useGameStore.getState()
    expect(state.inProgressCSS['level-01']).toBe('.header { color: red; }')
  })

  it('resetGame clears all state', () => {
    useGameStore.getState().completeLevel('level-01', 100, 45)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    useGameStore.getState().resetGame()
    const state = useGameStore.getState()
    expect(state.money).toBe(0)
    expect(state.completedLevels).toEqual([])
    expect(state.ownedTools).toEqual([])
  })
})
