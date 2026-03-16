import { create } from 'zustand'
import { db } from '@/infrastructure/db/dexie'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'
import { ExportPromptType, PromptExportBundle } from '@/domain/models/export'
import { projectRepo } from '@/infrastructure/db/repositories/project-repo'
import { Board } from '@/domain/models/board'
import { ArchitecturePattern, Project, ProjectBrief } from '@/domain/models/project'
import { BoardService } from '@/domain/services/board-service'
import { ExportService } from '@/features/transfer/model/export-service'
import { useAppStore } from '@/features/project/model/app-store'
import { nowIso } from '@/shared/lib/dates'
import { createId } from '@/shared/lib/ids'

interface ProjectState {
  loading: boolean
  error?: string
  projects: Project[]
  boards: Board[]
  currentProject?: Project
  bootstrap: () => Promise<void>
  createProject: (
    name: string,
    description?: string,
    pattern?: ArchitecturePattern,
    brief?: ProjectBrief
  ) => Promise<Project>
  updateProject: (
    projectId: string,
    patch: Partial<Pick<Project, 'name' | 'description' | 'architecturePattern' | 'brief'>>
  ) => Promise<Project | undefined>
  openProject: (projectId: string) => Promise<void>
  refreshCurrentProject: () => Promise<void>
  exportProject: (projectId: string) => Promise<string>
  generateProjectPromptBundle: (
    projectId: string,
    exportType: ExportPromptType
  ) => Promise<PromptExportBundle>
  importProject: (jsonInput: string) => Promise<Project>
  deleteProject: (projectId: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  loading: true,
  error: undefined,
  projects: [],
  boards: [],
  currentProject: undefined,

  async bootstrap() {
    set({ loading: true, error: undefined })

    try {
      const projects = await projectRepo.list()
      const { lastProjectId } = useAppStore.getState()
      const fallbackProject = projects[0]
      const projectToOpen = projects.find((project) => project.id === lastProjectId) ?? fallbackProject

      if (!projectToOpen) {
        set({ loading: false, projects: [], boards: [], currentProject: undefined })
        return
      }

      const boards = await boardRepo.listByProject(projectToOpen.id)
      set({
        loading: false,
        projects,
        boards,
        currentProject: projectToOpen
      })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to bootstrap project state'
      })
    }
  },

  async createProject(name, description, pattern, brief) {
    const now = nowIso()
    const projectId = createId('project')
    const rootBoard = BoardService.createRootBoard(projectId)

    const project: Project = {
      id: projectId,
      name,
      description,
      brief,
      rootBoardId: rootBoard.id,
      boardIds: [rootBoard.id],
      architecturePattern: pattern,
      createdAt: now,
      updatedAt: now
    }

    await db.transaction('rw', db.projects, db.boards, async () => {
      await db.projects.put(project)
      await db.boards.put(rootBoard)
    })

    const projects = await projectRepo.list()
    set({ projects, currentProject: project, boards: [rootBoard], error: undefined })
    useAppStore.getState().setLastContext(project.id, rootBoard.id)

    return project
  },

  async updateProject(projectId, patch) {
    const currentProject = await projectRepo.getById(projectId)
    if (!currentProject) {
      set({ error: 'Project not found' })
      return undefined
    }

    const nextProject: Project = {
      ...currentProject,
      ...patch,
      updatedAt: nowIso()
    }

    await projectRepo.upsert(nextProject)

    const projects = await projectRepo.list()
    const boards = await boardRepo.listByProject(projectId)
    set({
      projects,
      boards,
      currentProject: nextProject,
      error: undefined
    })

    return nextProject
  },

  async openProject(projectId) {
    const [project, boards] = await Promise.all([
      projectRepo.getById(projectId),
      boardRepo.listByProject(projectId)
    ])

    if (!project) {
      set({ error: 'Project not found' })
      return
    }

    set({ currentProject: project, boards, error: undefined })
    const { lastBoardId } = useAppStore.getState()
    const boardExists = boards.some((board) => board.id === lastBoardId)

    useAppStore
      .getState()
      .setLastContext(project.id, boardExists ? lastBoardId : project.rootBoardId)
  },

  async refreshCurrentProject() {
    const projectId = get().currentProject?.id
    if (!projectId) return

    const [project, boards] = await Promise.all([
      projectRepo.getById(projectId),
      boardRepo.listByProject(projectId)
    ])

    if (!project) return

    set({ currentProject: project, boards })
  },

  async exportProject(projectId) {
    return ExportService.exportProject(projectId)
  },

  async generateProjectPromptBundle(projectId, exportType) {
    return ExportService.generateProjectPromptBundle(projectId, exportType)
  },

  async importProject(jsonInput) {
    const payload = await ExportService.importProject(jsonInput)
    const projects = await projectRepo.list()
    const boards = await boardRepo.listByProject(payload.project.id)

    set({
      projects,
      boards,
      currentProject: payload.project,
      error: undefined
    })

    useAppStore.getState().setLastContext(payload.project.id, payload.project.rootBoardId)

    return payload.project
  },
  async deleteProject(projectId) {
    set({ error: undefined })
    try {
      const project = await projectRepo.getById(projectId)
      if (!project) return

      await db.transaction(
        'rw',
        [db.projects, db.boards, db.nodes, db.relations, db.exports],
        async () => {
          await db.projects.delete(projectId)
          await db.boards.where('projectId').equals(projectId).delete()
          await db.nodes.where('projectId').equals(projectId).delete()
          await db.relations.where('projectId').equals(projectId).delete()
          await db.exports.where('projectId').equals(projectId).delete()
        }
      )

      const projects = await projectRepo.list()
      const nextProject = projects[0]
      const boards = nextProject ? await boardRepo.listByProject(nextProject.id) : []

      set({
        projects,
        currentProject: nextProject,
        boards,
        error: undefined
      })

      useAppStore.getState().setLastContext(nextProject?.id, nextProject?.rootBoardId)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete project'
      })
    }
  }
}))
