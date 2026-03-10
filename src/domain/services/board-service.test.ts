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
        level: 'N1',
        sourceNodeId: 'node_1',
        targetNodeId: 'node_2',
        sourceBoardId: 'board_1',
        targetBoardId: 'board_2'
      })
    ).toThrowError('Relations are only valid between nodes in the same board')
  })

  it('creates N1 node with valid semantic defaults', () => {
    const node = BoardService.createNode({
      workspaceId: 'ws_1',
      boardId: 'board_1',
      level: 'N1',
      type: 'system'
    })

    expect(node.data).toEqual(
      expect.objectContaining({
        goal: expect.any(String),
        primaryResponsibilities: expect.any(Array)
      })
    )
  })

  it('blocks invalid node type for N1 level', () => {
    expect(() =>
      BoardService.createNode({
        workspaceId: 'ws_1',
        boardId: 'board_1',
        level: 'N1',
        type: 'class'
      })
    ).toThrowError('Node type "class" is not allowed in N1')
  })

  it('blocks invalid relation type for N1 level', () => {
    expect(() =>
      BoardService.createRelation({
        workspaceId: 'ws_1',
        boardId: 'board_1',
        level: 'N1',
        sourceNodeId: 'node_1',
        targetNodeId: 'node_2',
        sourceBoardId: 'board_1',
        targetBoardId: 'board_1',
        type: 'implements'
      })
    ).toThrowError('Relation type "implements" is not allowed in N1')
  })

  it('creates N2 node with valid semantic defaults', () => {
    const node = BoardService.createNode({
      workspaceId: 'ws_1',
      boardId: 'board_2',
      level: 'N2',
      type: 'class'
    })

    expect(node.data).toEqual(
      expect.objectContaining({
        responsibility: expect.any(String)
      })
    )
  })

  it('blocks invalid relation type for N2 level', () => {
    expect(() =>
      BoardService.createRelation({
        workspaceId: 'ws_1',
        boardId: 'board_2',
        level: 'N2',
        sourceNodeId: 'node_1',
        targetNodeId: 'node_2',
        sourceBoardId: 'board_2',
        targetBoardId: 'board_2',
        type: 'reads'
      })
    ).toThrowError('Relation type "reads" is not allowed in N2')
  })

  it('creates N3 node with valid semantic defaults', () => {
    const node = BoardService.createNode({
      workspaceId: 'ws_1',
      boardId: 'board_3',
      level: 'N3',
      type: 'method'
    })

    expect(node.data).toEqual(
      expect.objectContaining({
        signature: expect.any(String),
        purpose: expect.any(String)
      })
    )
  })

  it('blocks invalid relation type for N3 level', () => {
    expect(() =>
      BoardService.createRelation({
        workspaceId: 'ws_1',
        boardId: 'board_3',
        level: 'N3',
        sourceNodeId: 'node_1',
        targetNodeId: 'node_2',
        sourceBoardId: 'board_3',
        targetBoardId: 'board_3',
        type: 'reads'
      })
    ).toThrowError('Relation type "reads" is not allowed in N3')
  })
})
