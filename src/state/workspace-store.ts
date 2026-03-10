import { create } from 'zustand'
import { db } from '@/db/dexie'
import { boardRepo } from '@/db/repositories/board-repo'
import { ExportPromptType, PromptExportBundle } from '@/domain/models/export'
import { workspaceRepo } from '@/db/repositories/workspace-repo'
import { Board } from '@/domain/models/board'
import { Workspace } from '@/domain/models/workspace'
import { BoardService } from '@/domain/services/board-service'
import { ExportService } from '@/domain/services/export-service'
import { useAppStore } from '@/state/app-store'
import { nowIso } from '@/utils/dates'
import { createId } from '@/utils/ids'

interface WorkspaceState {
  loading: boolean
  error?: string
  workspaces: Workspace[]
  boards: Board[]
  currentWorkspace?: Workspace
  bootstrap: () => Promise<void>
  createWorkspace: (name: string, description?: string) => Promise<Workspace>
  openWorkspace: (workspaceId: string) => Promise<void>
  refreshCurrentWorkspace: () => Promise<void>
  exportWorkspace: (workspaceId: string) => Promise<string>
  generateWorkspacePromptBundle: (
    workspaceId: string,
    exportType: ExportPromptType
  ) => Promise<PromptExportBundle>
  importWorkspace: (jsonInput: string) => Promise<Workspace>
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  loading: true,
  error: undefined,
  workspaces: [],
  boards: [],
  currentWorkspace: undefined,

  async bootstrap() {
    set({ loading: true, error: undefined })

    try {
      const workspaces = await workspaceRepo.list()
      const { lastWorkspaceId } = useAppStore.getState()
      const fallbackWorkspace = workspaces[0]
      const workspaceToOpen = workspaces.find((workspace) => workspace.id === lastWorkspaceId) ?? fallbackWorkspace

      if (!workspaceToOpen) {
        set({ loading: false, workspaces: [], boards: [], currentWorkspace: undefined })
        return
      }

      const boards = await boardRepo.listByWorkspace(workspaceToOpen.id)
      set({
        loading: false,
        workspaces,
        boards,
        currentWorkspace: workspaceToOpen
      })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to bootstrap workspace state'
      })
    }
  },

  async createWorkspace(name, description) {
    const now = nowIso()
    const workspaceId = createId('ws')
    const rootBoard = BoardService.createRootBoard(workspaceId)

    const workspace: Workspace = {
      id: workspaceId,
      name,
      description,
      rootBoardId: rootBoard.id,
      boardIds: [rootBoard.id],
      createdAt: now,
      updatedAt: now
    }

    await db.transaction('rw', db.workspaces, db.boards, async () => {
      await db.workspaces.put(workspace)
      await db.boards.put(rootBoard)
    })

    const workspaces = await workspaceRepo.list()
    set({ workspaces, currentWorkspace: workspace, boards: [rootBoard], error: undefined })
    useAppStore.getState().setLastContext(workspace.id, rootBoard.id)

    return workspace
  },

  async openWorkspace(workspaceId) {
    const [workspace, boards] = await Promise.all([
      workspaceRepo.getById(workspaceId),
      boardRepo.listByWorkspace(workspaceId)
    ])

    if (!workspace) {
      set({ error: 'Workspace not found' })
      return
    }

    set({ currentWorkspace: workspace, boards, error: undefined })
    const { lastBoardId } = useAppStore.getState()
    const boardExists = boards.some((board) => board.id === lastBoardId)

    useAppStore
      .getState()
      .setLastContext(workspace.id, boardExists ? lastBoardId : workspace.rootBoardId)
  },

  async refreshCurrentWorkspace() {
    const workspaceId = get().currentWorkspace?.id
    if (!workspaceId) return

    const [workspace, boards] = await Promise.all([
      workspaceRepo.getById(workspaceId),
      boardRepo.listByWorkspace(workspaceId)
    ])

    if (!workspace) return

    set({ currentWorkspace: workspace, boards })
  },

  async exportWorkspace(workspaceId) {
    return ExportService.exportWorkspace(workspaceId)
  },

  async generateWorkspacePromptBundle(workspaceId, exportType) {
    return ExportService.generateWorkspacePromptBundle(workspaceId, exportType)
  },

  async importWorkspace(jsonInput) {
    const payload = await ExportService.importWorkspace(jsonInput)
    const workspaces = await workspaceRepo.list()
    const boards = await boardRepo.listByWorkspace(payload.workspace.id)

    set({
      workspaces,
      boards,
      currentWorkspace: payload.workspace,
      error: undefined
    })

    useAppStore.getState().setLastContext(payload.workspace.id, payload.workspace.rootBoardId)

    return payload.workspace
  }
}))
