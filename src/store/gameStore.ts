import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameState {
  money: number
  completedLevels: string[]
  ownedTools: string[]
  inProgressCSS: Record<string, string>
  bestTimes: Record<string, number>
}

interface GameActions {
  completeLevel: (levelId: string, payout: number, time: number) => void
  buyTool: (toolId: string, price: number) => void
  saveProgress: (levelId: string, css: string) => void
  resetGame: () => void
}

const initialState: GameState = {
  money: 0,
  completedLevels: [],
  ownedTools: [],
  inProgressCSS: {},
  bestTimes: {},
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeLevel: (levelId, payout, time) => {
        const state = get()
        const alreadyCompleted = state.completedLevels.includes(levelId)

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

      saveProgress: (levelId, css) => {
        set({
          inProgressCSS: { ...get().inProgressCSS, [levelId]: css },
        })
      },

      resetGame: () => set(initialState),
    }),
    {
      name: 'debugger-game-save',
    }
  )
)
