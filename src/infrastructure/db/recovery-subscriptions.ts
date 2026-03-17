import { useBoardStore } from '@/features/board/model/board-store'
import { useProjectStore } from '@/features/project/model/project-store'
import { pruneRecovery, writeBoardSnapshot, writeProjectSnapshot } from '@/infrastructure/db/recovery'

let subscriptionsInitialized = false

export function initializeRecoverySubscriptions(): void {
  if (subscriptionsInitialized) return
  subscriptionsInitialized = true

  useBoardStore.subscribe((state, previousState) => {
    if (!state.currentBoard) return

    const shouldSnapshot =
      state.currentBoard !== previousState.currentBoard ||
      state.nodes !== previousState.nodes ||
      state.relations !== previousState.relations ||
      state.dirty !== previousState.dirty

    if (!shouldSnapshot) return

    writeBoardSnapshot({
      board: state.currentBoard,
      nodes: state.nodes,
      relations: state.relations
    })
  })

  useProjectStore.subscribe((state, previousState) => {
    if (state.currentProject && state.currentProject !== previousState.currentProject) {
      writeProjectSnapshot(state.currentProject)
    }

    if (state.projects !== previousState.projects) {
      for (const project of state.projects) {
        writeProjectSnapshot(project)
      }
    }

    pruneRecovery()
  })
}

export function flushCurrentBoardSnapshot(): void {
  const state = useBoardStore.getState()
  if (!state.currentBoard) return

  writeBoardSnapshot({
    board: state.currentBoard,
    nodes: state.nodes,
    relations: state.relations
  })
}
