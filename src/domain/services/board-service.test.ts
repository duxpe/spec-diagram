import { describe, expect, it } from 'vitest'
import { BoardService } from '@/domain/services/board-service'

describe('BoardService', () => {
  it('creates root board in N1', () => {
    const board = BoardService.createRootBoard('ws_1')

    expect(board.level).toBe('N1')
    expect(board.workspaceId).toBe('ws_1')
    expect(board.nodeIds).toEqual([])
    expect(board.relationIds).toEqual([])
  })

  it('creates child board from parent level', () => {
    const childBoard = BoardService.createChildBoard({
      workspaceId: 'ws_1',
      parentBoardId: 'board_1',
      parentNodeId: 'node_1',
      parentLevel: 'N1'
    })

    expect(childBoard.level).toBe('N2')
    expect(childBoard.parentBoardId).toBe('board_1')
    expect(childBoard.parentNodeId).toBe('node_1')
  })

  it('throws when creating child board from N3', () => {
    expect(() =>
      BoardService.createChildBoard({
        workspaceId: 'ws_1',
        parentBoardId: 'board_1',
        parentNodeId: 'node_1',
        parentLevel: 'N3'
      })
    ).toThrowError('N3 nodes cannot open deeper boards in MVP')
  })

  it('throws when relation attempts cross-board nodes', () => {
    expect(() =>
      BoardService.createRelation({
        workspaceId: 'ws_1',
        boardId: 'board_1',
        sourceNodeId: 'node_1',
        targetNodeId: 'node_2',
        sourceBoardId: 'board_1',
        targetBoardId: 'board_2'
      })
    ).toThrowError('Relations are only valid between nodes in the same board')
  })
})
