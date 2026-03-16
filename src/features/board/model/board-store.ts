import { create } from 'zustand'
import { createApplyCanvasStateAction } from '@/features/board/model/board-store/actions/canvas-actions'
import { createOpenOrCreateChildBoardAction } from '@/features/board/model/board-store/actions/child-board-actions'
import { createLoadBoardAction, createSaveCurrentBoardAction } from '@/features/board/model/board-store/actions/load-save-actions'
import {
  createCreateNodeAction,
  createDeleteNodeAction,
  createMoveNodeAction,
  createUpdateNodeAction
} from '@/features/board/model/board-store/actions/node-actions'
import {
  createCreateRelationAction,
  createDeleteRelationAction,
  createReverseRelationAction,
  createUpdateRelationAction
} from '@/features/board/model/board-store/actions/relation-actions'
import type { BoardState } from '@/features/board/model/board-store/types'

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

  loadBoard: createLoadBoardAction(set, get),
  saveCurrentBoard: createSaveCurrentBoardAction(set, get),

  createNode: createCreateNodeAction(set, get),
  updateNode: createUpdateNodeAction(set, get),
  moveNode: createMoveNodeAction(get),
  deleteNode: createDeleteNodeAction(set, get),

  createRelation: createCreateRelationAction(set, get),
  updateRelation: createUpdateRelationAction(set, get),
  reverseRelation: createReverseRelationAction(set, get),
  deleteRelation: createDeleteRelationAction(set, get),

  applyCanvasState: createApplyCanvasStateAction(set, get),
  openOrCreateChildBoard: createOpenOrCreateChildBoardAction(set, get)
}))
