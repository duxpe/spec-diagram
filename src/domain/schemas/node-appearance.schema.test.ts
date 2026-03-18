import { describe, expect, it } from 'vitest'
import { nodeAppearanceSchema } from '@/domain/schemas/node-appearance.schema'
import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'

const now = new Date().toISOString()

describe('node-appearance.schema', () => {
  it('accepts valid node appearance payload', () => {
    const result = nodeAppearanceSchema.safeParse({
      shapeVariant: 'hexagon',
      icon: 'cube',
      provider: 'aws',
      providerService: 'aws_lambda',
      accentColor: 'teal',
      showProviderBadge: true
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid enums with readable issues', () => {
    const result = nodeAppearanceSchema.safeParse({
      shapeVariant: 'triangle',
      provider: 'digitalocean',
      accentColor: 'pink'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Invalid enum value')
    }
  })

  it('keeps semantic node backward compatible when appearance is absent', () => {
    const result = semanticNodeSchema.safeParse({
      id: 'node_1',
      projectId: 'ws_1',
      boardId: 'board_1',
      level: 'N1',
      type: 'system',
      title: 'System Node',
      x: 10,
      y: 20,
      width: 220,
      height: 110,
      data: {
        goal: 'Define goal',
        primaryResponsibilities: ['Provide service']
      },
      createdAt: now,
      updatedAt: now
    })

    expect(result.success).toBe(true)
  })
})
