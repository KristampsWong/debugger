import type { Level } from '../../types'
import level01 from './level-01'
import level02 from './level-02'
import level03 from './level-03'

export const levels: Level[] = [level01, level02, level03]

export function getLevelById(id: string): Level | undefined {
  return levels.find((l) => l.id === id)
}
