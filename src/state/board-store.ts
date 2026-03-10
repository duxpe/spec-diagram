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
import { boardSchema } from '@/domain/schemas/board.schema'
import { relationSchema } from '@/domain/schemas/relation.schema'
import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'
import { BoardService } from '@/domain/services/board-service'
import { ValidationService } from '@/domain/services/validation-service'
import { useAppStore } from '@/state/app-store'
import { nowIso } from '@/utils/dates'

interface ParentContext {
  boardId: string
  boardName: string
  nodeId: string
  nodeTitle: string
}

interface BoardState {
  loading: boolean
  saving: boolean
  dirty: boolean
  error?: string
  loadRequestKey?: string
  currentBoard?: Board
  parentContext?: ParentContext
  nodes: SemanticNode[]
  relations: Relation[]
  loadBoard: (workspaceId: string, boardId: string) => Promise<void>
  createNode: (type?: SemanticNodeType) => void
  updateNode: (id: string, patch: Partial<Omit<SemanticNode, 'id' | 'workspaceId' | 'boardId'>>) => void
  moveNode: (id: string, x: number, y: number) => void
  createRelation: (sourceNodeId: string, targetNodeId: string, type?: RelationType, label?: string) => void
  deleteNode: (nodeId: string) => void
  deleteRelation: (relationId: string) => void
  applyCanvasState: (sourceBoardId: string, nodes: SemanticNode[], relations: Relation[]) => void
  saveCurrentBoard: () => Promise<void>
  openOrCreateChildBoard: (nodeId: string) => Promise<Board>
}

const FLOAT_TOLERANCE = 0.05

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= FLOAT_TOLERANCE
}

function isNodeSemanticallyEqual(a: SemanticNode, b: SemanticNode): boolean {
  return (
    a.id === b.id &&
    a.workspaceId === b.workspaceId &&
    a.boardId === b.boardId &&
    a.parentNodeId === b.parentNodeId &&
    a.level === b.level &&
    a.type === b.type &&
    a.title === b.title &&
    a.description === b.description &&
    nearlyEqual(a.x, b.x) &&
    nearlyEqual(a.y, b.y) &&
    nearlyEqual(a.width, b.width) &&
    nearlyEqual(a.height, b.height) &&
    a.childBoardId === b.childBoardId &&
    JSON.stringify(a.data) === JSON.stringify(b.data)
  )
}

function isRelationSemanticallyEqual(a: Relation, b: Relation): boolean {
  return (
    a.id === b.id &&
    a.workspaceId === b.workspaceId &&
    a.boardId === b.boardId &&
    a.sourceNodeId === b.sourceNodeId &&
    a.targetNodeId === b.targetNodeId &&
    a.label === b.label &&
    a.type === b.type
  )
}

function hasCanvasDiff(
  currentNodes: SemanticNode[],
  nextNodes: SemanticNode[],
  currentRelations: Relation[],
  nextRelations: Relation[]
): boolean {
  if (currentNodes.length !== nextNodes.length) return true
  if (currentRelations.length !== nextRelations.length) return true

  const currentNodesById = new Map(currentNodes.map((node) => [node.id, node]))
  const currentRelationsById = new Map(currentRelations.map((relation) => [relation.id, relation]))

  for (const nextNode of nextNodes) {
    const currentNode = currentNodesById.get(nextNode.id)
    if (!currentNode || !isNodeSemanticallyEqual(currentNode, nextNode)) {
      return true
    }
  }

  for (const nextRelation of nextRelations) {
    const currentRelation = currentRelationsById.get(nextRelation.id)
    if (!currentRelation || !isRelationSemanticallyEqual(currentRelation, nextRelation)) {
      return true
    }
  }

  return false
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
  loadRequestKey: undefined,
  currentBoard: undefined,
  parentContext: undefined,
  nodes: [],
  relations: [],

  async loadBoard(workspaceId, boardId) {
    const loadRequestKey = `${workspaceId}:${boardId}:${nowIso()}`
    set({ loading: true, error: undefined, loadRequestKey })

    try {
      const [board, nodes, relations] = await Promise.all([
        boardRepo.getById(boardId),
        semanticNodeRepo.listByBoard(boardId),
        relationRepo.listByBoard(boardId)
      ])

      if (get().loadRequestKey !== loadRequestKey) {
        return
      }

      if (!board || board.workspaceId !== workspaceId) {
        set({ loading: false, error: 'Board not found for workspace', loadRequestKey: undefined })
        return
      }

      let parentContext: ParentContext | undefined
      if (board.parentBoardId && board.parentNodeId) {
        const [parentBoard, parentNodes] = await Promise.all([
          boardRepo.getById(board.parentBoardId),
          semanticNodeRepo.listByBoard(board.parentBoardId)
        ])
        const parentNode = parentNodes.find((node) => node.id === board.parentNodeId)

        if (parentBoard && parentNode) {
          parentContext = {
            boardId: parentBoard.id,
            boardName: parentBoard.name,
            nodeId: parentNode.id,
            nodeTitle: parentNode.title
          }
        }
      }

      if (get().loadRequestKey !== loadRequestKey) {
        return
      }

      set({
        loading: false,
        currentBoard: board,
        parentContext,
        nodes,
        relations,
        dirty: false,
        error: undefined,
        loadRequestKey: undefined
      })

      useAppStore.getState().setLastContext(workspaceId, boardId)
    } catch (error) {
      if (get().loadRequestKey !== loadRequestKey) {
        return
      }

      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load board',
        loadRequestKey: undefined
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
      let hasChanges = false
      const nodes = state.nodes.map((node) => {
        if (node.id !== id) return node

        const patchEntries = Object.entries(patch) as Array<[keyof SemanticNode, unknown]>
        const isChanged = patchEntries.some(([key, value]) => node[key] !== value)
        if (!isChanged) return node

        hasChanges = true
        return { ...node, ...patch, updatedAt: nowIso() }
      })

      if (!hasChanges) return state

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

  deleteNode(nodeId) {
    set((state) => {
      const nodes = state.nodes.filter((node) => node.id !== nodeId)
      const relations = state.relations.filter(
        (relation) => relation.sourceNodeId !== nodeId && relation.targetNodeId !== nodeId
      )

      return {
        nodes,
        relations,
        currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
        dirty: true
      }
    })

    void get().saveCurrentBoard()
  },

  deleteRelation(relationId) {
    set((state) => ({
      relations: state.relations.filter((relation) => relation.id !== relationId),
      currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
      dirty: true
    }))

    void get().saveCurrentBoard()
  },

  applyCanvasState(sourceBoardId, nodes, relations) {
    const currentBoardId = get().currentBoard?.id
    if (!currentBoardId || currentBoardId !== sourceBoardId) return

    const currentNodes = get().nodes
    const currentRelations = get().relations
    const hasChanges = hasCanvasDiff(currentNodes, nodes, currentRelations, relations)
    if (!hasChanges) return

    const hasDeletedNode = nodes.length < currentNodes.length
    const hasDeletedRelation = relations.length < currentRelations.length

    set((state) => {
      if (!state.currentBoard || state.currentBoard.id !== sourceBoardId) {
        return state
      }

      return {
        nodes,
        relations,
        currentBoard: updateBoardTimestamps(state.currentBoard),
        dirty: true
      }
    })

    if (hasDeletedNode || hasDeletedRelation) {
      void get().saveCurrentBoard()
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

      ValidationService.parse(boardSchema, updatedBoard)
      ValidationService.parseArray(semanticNodeSchema, nodes)
      ValidationService.parseArray(relationSchema, relations)

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
