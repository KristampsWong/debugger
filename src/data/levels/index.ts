import type { Level } from '../../types'
import level01 from './level-01'
import level02 from './level-02'
import level03 from './level-03'
import level04 from './level-04'
import level05 from './level-05'
import level06 from './level-06'
import level07 from './level-07'
import level08 from './level-08'

export const levels: Level[] = [
  level01,
  level02,
  level03,
  level04,
  level05,
  level06,
  level07,
  level08,
]

export function getLevelById(id: string): Level | undefined {
  return levels.find((l) => l.id === id)
}
