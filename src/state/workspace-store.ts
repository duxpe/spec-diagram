import { create } from 'zustand'
import { db } from '@/db/dexie'
import { boardRepo } from '@/db/repositories/board-repo'
import { ExportPromptType, PromptExportBundle } from '@/domain/models/export'
import { workspaceRepo } from '@/db/repositories/workspace-repo'
import { Board } from '@/domain/models/board'
import { ArchitecturePattern, Workspace, WorkspaceBrief } from '@/domain/models/workspace'
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
  createWorkspace: (
    name: string,
    description?: string,
    pattern?: ArchitecturePattern,
    brief?: WorkspaceBrief
  ) => Promise<Workspace>
  updateWorkspace: (
    workspaceId: string,
    patch: Partial<Pick<Workspace, 'name' | 'description' | 'architecturePattern' | 'brief'>>
  ) => Promise<Workspace | undefined>
  openWorkspace: (workspaceId: string) => Promise<void>
  refreshCurrentWorkspace: () => Promise<void>
  exportWorkspace: (workspaceId: string) => Promise<string>
  generateWorkspacePromptBundle: (
    workspaceId: string,
    exportType: ExportPromptType
  ) => Promise<PromptExportBundle>
  importWorkspace: (jsonInput: string) => Promise<Workspace>
  deleteWorkspace: (workspaceId: string) => Promise<void>
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

  async createWorkspace(name, description, pattern, brief) {
    const now = nowIso()
    const workspaceId = createId('ws')
    const rootBoard = BoardService.createRootBoard(workspaceId)

    const workspace: Workspace = {
      id: workspaceId,
      name,
      description,
      brief,
      rootBoardId: rootBoard.id,
      boardIds: [rootBoard.id],
      architecturePattern: pattern,
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

  async updateWorkspace(workspaceId, patch) {
    const currentWorkspace = await workspaceRepo.getById(workspaceId)
    if (!currentWorkspace) {
      set({ error: 'Workspace not found' })
      return undefined
    }

    const nextWorkspace: Workspace = {
      ...currentWorkspace,
      ...patch,
      updatedAt: nowIso()
    }

    await workspaceRepo.upsert(nextWorkspace)

    const workspaces = await workspaceRepo.list()
    const boards = await boardRepo.listByWorkspace(workspaceId)
    set({
      workspaces,
      boards,
      currentWorkspace: nextWorkspace,
      error: undefined
    })

    return nextWorkspace
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
  },
  async deleteWorkspace(workspaceId) {
    set({ error: undefined })
    try {
      const workspace = await workspaceRepo.getById(workspaceId)
      if (!workspace) return

      await db.transaction(
        'rw',
        [db.workspaces, db.boards, db.nodes, db.relations, db.exports],
        async () => {
          await db.workspaces.delete(workspaceId)
          await db.boards.where('workspaceId').equals(workspaceId).delete()
          await db.nodes.where('workspaceId').equals(workspaceId).delete()
          await db.relations.where('workspaceId').equals(workspaceId).delete()
          await db.exports.where('workspaceId').equals(workspaceId).delete()
        }
      )

      const workspaces = await workspaceRepo.list()
      const nextWorkspace = workspaces[0]
      const boards = nextWorkspace ? await boardRepo.listByWorkspace(nextWorkspace.id) : []

      set({
        workspaces,
        currentWorkspace: nextWorkspace,
        boards,
        error: undefined
      })

      useAppStore.getState().setLastContext(nextWorkspace?.id, nextWorkspace?.rootBoardId)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete workspace'
      })
    }
  }
}))
