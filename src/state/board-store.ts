import { create } from 'zustand'
import { toSemanticSnapshot } from '@/board/semantic/semantic-shape-mappers'
import { db } from '@/db/dexie'
import { boardRepo } from '@/db/repositories/board-repo'
import { relationRepo } from '@/db/repositories/relation-repo'
import { semanticNodeRepo } from '@/db/repositories/semantic-node-repo'
import { workspaceRepo } from '@/db/repositories/workspace-repo'
import { Board } from '@/domain/models/board'
import { Relation, RelationType } from '@/domain/models/relation'
import { SemanticNode, SemanticNodeType } from '@/domain/models/semantic-node'
import { BoardService } from '@/domain/services/board-service'
import { useAppStore } from '@/state/app-store'
import { nowIso } from '@/utils/dates'

interface BoardState {
  loading: boolean
  saving: boolean
  dirty: boolean
  error?: string
  currentBoard?: Board
  nodes: SemanticNode[]
  relations: Relation[]
  loadBoard: (workspaceId: string, boardId: string) => Promise<void>
  createNode: (type?: SemanticNodeType) => void
  updateNode: (id: string, patch: Partial<Omit<SemanticNode, 'id' | 'workspaceId' | 'boardId'>>) => void
  moveNode: (id: string, x: number, y: number) => void
  createRelation: (sourceNodeId: string, targetNodeId: string, type?: RelationType, label?: string) => void
  saveCurrentBoard: () => Promise<void>
  openOrCreateChildBoard: (nodeId: string) => Promise<Board>
}

function updateBoardTimestamps(board: Board): Board {
  return {
    ...board,
    updatedAt: nowIso()
  }
}

export const useBoardStore = create<BoardState>((set, get) => ({
  loading: false,
  saving: false,
  dirty: false,
  error: undefined,
  currentBoard: undefined,
  nodes: [],
  relations: [],

  async loadBoard(workspaceId, boardId) {
    set({ loading: true, error: undefined })

    try {
      const [board, nodes, relations] = await Promise.all([
        boardRepo.getById(boardId),
        semanticNodeRepo.listByBoard(boardId),
        relationRepo.listByBoard(boardId)
      ])

      if (!board || board.workspaceId !== workspaceId) {
        set({ loading: false, error: 'Board not found for workspace' })
        return
      }

      set({
        loading: false,
        currentBoard: board,
        nodes,
        relations,
        dirty: false,
        error: undefined
      })

      useAppStore.getState().setLastContext(workspaceId, boardId)
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load board'
      })
    }
  },

  createNode(type) {
    const currentBoard = get().currentBoard

    if (!currentBoard) return

    const node = BoardService.createNode({
      workspaceId: currentBoard.workspaceId,
      boardId: currentBoard.id,
      level: currentBoard.level,
      type
    })

    set((state) => ({
      nodes: [...state.nodes, node],
      currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
      dirty: true
    }))
  },

  updateNode(id, patch) {
    set((state) => {
      const nodes = state.nodes.map((node) =>
        node.id === id ? { ...node, ...patch, updatedAt: nowIso() } : node
      )

      return {
        nodes,
        currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
        dirty: true
      }
    })
  },

  moveNode(id, x, y) {
    get().updateNode(id, { x, y })
  },

  createRelation(sourceNodeId, targetNodeId, type, label) {
    const { currentBoard, nodes } = get()

    if (!currentBoard) return

    const sourceNode = nodes.find((node) => node.id === sourceNodeId)
    const targetNode = nodes.find((node) => node.id === targetNodeId)

    if (!sourceNode || !targetNode) {
      set({ error: 'Source or target node does not exist' })
      return
    }

    try {
      const relation = BoardService.createRelation({
        workspaceId: currentBoard.workspaceId,
        boardId: currentBoard.id,
        sourceNodeId,
        targetNodeId,
        sourceBoardId: sourceNode.boardId,
        targetBoardId: targetNode.boardId,
        type,
        label
      })

      set((state) => ({
        relations: [...state.relations, relation],
        currentBoard: state.currentBoard
          ? updateBoardTimestamps(state.currentBoard)
          : state.currentBoard,
        dirty: true,
        error: undefined
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create relation' })
    }
  },

  async saveCurrentBoard() {
    const { currentBoard, nodes, relations } = get()

    if (!currentBoard || !get().dirty) return

    set({ saving: true, error: undefined })

    try {
      const updatedBoard: Board = {
        ...currentBoard,
        nodeIds: nodes.map((node) => node.id),
        relationIds: relations.map((relation) => relation.id),
        tlSnapshot: toSemanticSnapshot(nodes),
        updatedAt: nowIso()
      }

      await db.transaction('rw', db.boards, db.nodes, db.relations, async () => {
        await db.boards.put(updatedBoard)
        await db.nodes.bulkPut(nodes)
        await db.relations.bulkPut(relations)
      })

      set({ currentBoard: updatedBoard, dirty: false, saving: false })
    } catch (error) {
      set({
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to persist board'
      })
    }
  },

  async openOrCreateChildBoard(nodeId) {
    const { currentBoard, nodes } = get()

    if (!currentBoard) {
      throw new Error('No board loaded')
    }

    const node = nodes.find((item) => item.id === nodeId)

    if (!node) {
      throw new Error('Node not found')
    }

    if (node.childBoardId) {
      const existingChildBoard = await boardRepo.getById(node.childBoardId)
      if (existingChildBoard) {
        return existingChildBoard
      }
    }

    const childBoard = BoardService.createChildBoard({
      workspaceId: currentBoard.workspaceId,
      parentBoardId: currentBoard.id,
      parentNodeId: node.id,
      parentLevel: node.level,
      name: `${node.title} detail`
    })

    const updatedNode: SemanticNode = {
      ...node,
      childBoardId: childBoard.id,
      updatedAt: nowIso()
    }

    const updatedWorkspace = await workspaceRepo.getById(currentBoard.workspaceId)
    if (!updatedWorkspace) {
      throw new Error('Workspace not found while creating child board')
    }

    const nextWorkspaceBoardIds = updatedWorkspace.boardIds.includes(childBoard.id)
      ? updatedWorkspace.boardIds
      : [...updatedWorkspace.boardIds, childBoard.id]

    await db.transaction('rw', db.workspaces, db.boards, db.nodes, async () => {
      await db.boards.put(childBoard)
      await db.nodes.put(updatedNode)
      await db.workspaces.put({
        ...updatedWorkspace,
        boardIds: nextWorkspaceBoardIds,
        updatedAt: nowIso()
      })
    })

    set((state) => ({
      nodes: state.nodes.map((item) => (item.id === updatedNode.id ? updatedNode : item)),
      currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
      dirty: true
    }))

    return childBoard
  }
}))
