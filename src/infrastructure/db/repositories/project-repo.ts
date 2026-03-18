import { db } from '@/infrastructure/db/dexie'
import { Project } from '@/domain/models/project'
import { projectSchema } from '@/domain/schemas/project.schema'
import { ValidationService } from '@/domain/services/validation-service'

export const projectRepo = {
  async list(): Promise<Project[]> {
    const projects = await db.projects.orderBy('updatedAt').reverse().toArray()
    return ValidationService.parseArray(projectSchema, projects)
  },

  async getById(id: string): Promise<Project | undefined> {
    const project = await db.projects.get(id)
    if (!project) return undefined

    return ValidationService.parse(projectSchema, project)
  },

  async upsert(project: Project): Promise<void> {
    ValidationService.parse(projectSchema, project)
    await db.projects.put(project)
  },

  async delete(id: string): Promise<void> {
    await db.projects.delete(id)
  }
}
