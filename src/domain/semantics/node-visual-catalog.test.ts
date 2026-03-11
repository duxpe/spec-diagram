import { describe, expect, it } from 'vitest'
import { resolveNodeVisual } from '@/domain/semantics/node-visual-catalog'

describe('node-visual-catalog', () => {
  it('resolves semantic defaults by node type', () => {
    const visual = resolveNodeVisual({ type: 'database', appearance: undefined })

    expect(visual.shapeVariant).toBe('cylinder')
    expect(visual.icon).toBe('database')
    expect(visual.accentColor).toBe('amber')
    expect(visual.provider).toBe('none')
  })

  it('falls back to generic when provider service does not belong to provider', () => {
    const visual = resolveNodeVisual({
      type: 'container_service',
      appearance: {
        provider: 'aws',
        providerService: 'gcp_cloud_run'
      }
    })

    expect(visual.provider).toBe('aws')
    expect(visual.providerService).toBeUndefined()
  })
})
