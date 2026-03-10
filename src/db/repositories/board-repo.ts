import { db } from '@/db/dexie'
import { Board } from '@/domain/models/board'
import { boardSchema } from '@/domain/schemas/board.schema'
import { ValidationService } from '@/domain/services/validation-service'

export const boardRepo = {
  async listByWorkspace(workspaceId: string): Promise<Board[]> {
    const boards = await db.boards.where('workspaceId').equals(workspaceId).toArray()
    return ValidationService.parseArray(boardSchema, boards)
  },

  async getById(id: string): Promise<Board | undefined> {
    const board = await db.boards.get(id)
    if (!board) return undefined

    return ValidationService.parse(boardSchema, board)
  },

  async upsert(board: Board): Promise<void> {
    ValidationService.parse(boardSchema, board)
    await db.boards.put(board)
  },

  async bulkUpsert(boards: Board[]): Promise<void> {
    boards.forEach((board) => ValidationService.parse(boardSchema, board))
    await db.boards.bulkPut(boards)
  }
}
