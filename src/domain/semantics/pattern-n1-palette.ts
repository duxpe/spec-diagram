import type { NodeAppearance } from '@/domain/models/node-appearance'
import type { ArchitecturePattern } from '@/domain/models/project'
import { PATTERN_CATALOG } from '@/domain/semantics/pattern-catalog'
import { N1_NODE_PALETTE, type N1NodePaletteItem } from '@/domain/semantics/n1-node-palette'

export interface PatternPaletteItem extends Omit<N1NodePaletteItem, 'group'> {
  group: string
  patternRole?: string
  defaultAppearance?: Partial<NodeAppearance>
}

function paletteDedupeKey(type: string, label: string): string {
  return `${type.toLowerCase()}::${label.trim().toLowerCase()}`
}

function getFreeModeN1Palette(): PatternPaletteItem[] {
  const genericItems: PatternPaletteItem[] = N1_NODE_PALETTE.map((item) => ({ ...item }))
  const genericKeys = new Set(
    genericItems.map((item) => paletteDedupeKey(item.type, item.label))
  )

  const specializedItems: PatternPaletteItem[] = []

  for (const [patternId, definition] of Object.entries(PATTERN_CATALOG)) {
    if (patternId === 'free_mode') continue

    for (const entry of definition.n1Nodes) {
      if (genericKeys.has(paletteDedupeKey(entry.type, entry.label))) {
        continue
      }

      specializedItems.push({
        type: entry.type,
        label: entry.label,
        marker: entry.marker,
        group: definition.name,
        patternRole: entry.patternRole,
        defaultAppearance: entry.defaultAppearance
      })
    }
  }

  return [...genericItems, ...specializedItems]
}

export function getPatternN1Palette(
  pattern?: ArchitecturePattern
): PatternPaletteItem[] {
  if (!pattern) {
    return N1_NODE_PALETTE.map((item) => ({ ...item }))
  }
  if (pattern === 'free_mode') return getFreeModeN1Palette()

  const definition = PATTERN_CATALOG[pattern]
  if (!definition) {
    return N1_NODE_PALETTE.map((item) => ({ ...item }))
  }

  return definition.n1Nodes.map((entry) => ({
    type: entry.type,
    label: entry.label,
    marker: entry.marker,
    group: entry.patternRole.includes('note') ? 'Notes' as const : 'Core' as const,
    patternRole: entry.patternRole,
    defaultAppearance: entry.defaultAppearance,
  }))
}
