import type { Board } from '@/domain/models/board'
import { nowIso } from '@/shared/lib/dates'

export function updateBoardTimestamps(board: Board): Board {
  return {
    ...board,
    updatedAt: nowIso()
  }
}
