import { create } from 'zustand'
import type { Level, TestResult } from '../types'

interface LevelState {
  currentLevel: Level | null
  currentCSS: string
  testResults: TestResult[]
  allPassed: boolean
  elapsedTime: number
}

interface LevelActions {
  loadLevel: (level: Level, savedCSS?: string) => void
  updateCSS: (css: string) => void
  updateTestResults: (results: TestResult[]) => void
  tick: () => void
  reset: () => void
}

const initialState: LevelState = {
  currentLevel: null,
  currentCSS: '',
  testResults: [],
  allPassed: false,
  elapsedTime: 0,
}

export const useLevelStore = create<LevelState & LevelActions>()((set) => ({
  ...initialState,

  loadLevel: (level, savedCSS) =>
    set({
      currentLevel: level,
      currentCSS: savedCSS ?? level.buggyCSS,
      testResults: [],
      allPassed: false,
      elapsedTime: 0,
    }),

  updateCSS: (css) => set({ currentCSS: css }),

  updateTestResults: (results) =>
    set({
      testResults: results,
      allPassed: results.length > 0 && results.every((r) => r.passed),
    }),

  tick: () => set((state) => ({ elapsedTime: state.elapsedTime + 1 })),

  reset: () => set(initialState),
}))
