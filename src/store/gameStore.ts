import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameState {
  money: number
  completedLevels: string[]
  skippedLevels: string[]
  ownedTools: string[]
  disabledTools: string[]
  inProgressCSS: Record<string, string>
  bestTimes: Record<string, number>
}

interface GameActions {
  completeLevel: (levelId: string, payout: number, time: number) => void
  buyTool: (toolId: string, price: number) => void
  toggleTool: (toolId: string) => void
  saveProgress: (levelId: string, css: string) => void
  skipLevel: (levelId: string, cost: number) => void
  resetGame: () => void
}

const initialState: GameState = {
  money: 0,
  completedLevels: [],
  skippedLevels: [],
  ownedTools: [],
  disabledTools: [],
  inProgressCSS: {},
  bestTimes: {},
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeLevel: (levelId, payout, time) => {
        const state = get()
        const wasSkipped = state.skippedLevels.includes(levelId)
        const alreadyCompleted = state.completedLevels.includes(levelId)

        if (wasSkipped) {
          // Solving a previously skipped level: award payout, remove from skipped
          set({
            money: state.money + payout,
            skippedLevels: state.skippedLevels.filter((id) => id !== levelId),
            bestTimes: {
              ...state.bestTimes,
              [levelId]:
                state.bestTimes[levelId] !== undefined
                  ? Math.min(state.bestTimes[levelId], time)
                  : time,
            },
          })
          return
        }

        set({
          money: alreadyCompleted ? state.money : state.money + payout,
          completedLevels: alreadyCompleted
            ? state.completedLevels
            : [...state.completedLevels, levelId],
          bestTimes: {
            ...state.bestTimes,
            [levelId]:
              state.bestTimes[levelId] !== undefined
                ? Math.min(state.bestTimes[levelId], time)
                : time,
          },
        })
      },

      buyTool: (toolId, price) => {
        const state = get()
        if (state.money < price) return
        if (state.ownedTools.includes(toolId)) return
        set({
          money: state.money - price,
          ownedTools: [...state.ownedTools, toolId],
        })
      },

      toggleTool: (toolId) => {
        const state = get()
        if (!state.ownedTools.includes(toolId)) return
        const isDisabled = state.disabledTools.includes(toolId)
        set({
          disabledTools: isDisabled
            ? state.disabledTools.filter((id) => id !== toolId)
            : [...state.disabledTools, toolId],
        })
      },

      saveProgress: (levelId, css) => {
        set({
          inProgressCSS: { ...get().inProgressCSS, [levelId]: css },
        })
      },

      skipLevel: (levelId, cost) => {
        const state = get()
        if (state.money < cost) return
        if (state.completedLevels.includes(levelId)) return
        set({
          money: state.money - cost,
          completedLevels: [...state.completedLevels, levelId],
          skippedLevels: [...state.skippedLevels, levelId],
        })
      },

      resetGame: () => set(initialState),
    }),
    {
      name: 'debugger-game-save',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        if (version === 0 || !state.skippedLevels) {
          state.skippedLevels = []
        }
        return state
      },
    }
  )
)
