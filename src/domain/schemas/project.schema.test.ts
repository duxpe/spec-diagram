import { describe, expect, it } from 'vitest'
import { projectSchema } from '@/domain/schemas/project.schema'

const now = new Date().toISOString()

describe('project.schema', () => {
  it('accepts free mode as architecture pattern', () => {
    const parsed = projectSchema.parse({
      id: 'project_1',
      name: 'Sandbox',
      rootBoardId: 'board_1',
      boardIds: ['board_1'],
      architecturePattern: 'free_mode',
      createdAt: now,
      updatedAt: now
    })

    expect(parsed.architecturePattern).toBe('free_mode')
  })
})
