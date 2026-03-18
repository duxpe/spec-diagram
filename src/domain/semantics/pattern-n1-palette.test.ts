import { describe, expect, it } from 'vitest'
import { N1_NODE_PALETTE } from '@/domain/semantics/n1-node-palette'
import { getPatternN1Palette } from '@/domain/semantics/pattern-n1-palette'
import { PATTERN_CATALOG } from '@/domain/semantics/pattern-catalog'

function paletteDedupeKey(type: string, label: string): string {
  return `${type.toLowerCase()}::${label.trim().toLowerCase()}`
}

function getExpectedFreeModeSpecializedItems(): Array<{
  type: string
  label: string
  marker: string
  patternRole: string
  group: string
}> {
  const genericKeys = new Set(
    N1_NODE_PALETTE.map((item) => paletteDedupeKey(item.type, item.label))
  )

  return Object.entries(PATTERN_CATALOG)
    .filter(([patternId]) => patternId !== 'free_mode')
    .flatMap(([, definition]) =>
      definition.n1Nodes
        .filter((entry) => !genericKeys.has(paletteDedupeKey(entry.type, entry.label)))
        .map((entry) => ({
          type: entry.type,
          label: entry.label,
          marker: entry.marker,
          patternRole: entry.patternRole,
          group: definition.name
        }))
    )
}

describe('pattern-n1-palette', () => {
  it('keeps generic nodes first and in the same order for free mode', () => {
    const palette = getPatternN1Palette('free_mode')
    const genericSlice = palette.slice(0, N1_NODE_PALETTE.length)

    expect(genericSlice.map((item) => ({
      type: item.type,
      label: item.label,
      marker: item.marker,
      group: item.group
    }))).toEqual(
      N1_NODE_PALETTE.map((item) => ({
        type: item.type,
        label: item.label,
        marker: item.marker,
        group: item.group
      }))
    )
  })

  it('includes all specialized nodes from every non-free pattern grouped by pattern name', () => {
    const palette = getPatternN1Palette('free_mode')
    const specializedSlice = palette.slice(N1_NODE_PALETTE.length)
    const expectedSpecializedItems = getExpectedFreeModeSpecializedItems()

    expect(specializedSlice.map((item) => ({
      type: item.type,
      label: item.label,
      marker: item.marker,
      patternRole: item.patternRole,
      group: item.group
    }))).toEqual(expectedSpecializedItems)
  })

  it('does not duplicate generic-equivalent entries in specialized sections', () => {
    const palette = getPatternN1Palette('free_mode')
    const specializedSlice = palette.slice(N1_NODE_PALETTE.length)
    const genericKeys = new Set(
      N1_NODE_PALETTE.map((item) => paletteDedupeKey(item.type, item.label))
    )

    for (const item of specializedSlice) {
      expect(genericKeys.has(paletteDedupeKey(item.type, item.label))).toBe(false)
    }
  })

  it('keeps groups ordered as generic first, then pattern-name sections', () => {
    const palette = getPatternN1Palette('free_mode')
    const groupOrder = [...new Set(palette.map((item) => item.group))]
    const genericGroups = [...new Set(N1_NODE_PALETTE.map((item) => item.group))]

    const genericKeys = new Set(
      N1_NODE_PALETTE.map((item) => paletteDedupeKey(item.type, item.label))
    )
    const expectedPatternGroups = Object.entries(PATTERN_CATALOG)
      .filter(([patternId]) => patternId !== 'free_mode')
      .filter(([, definition]) =>
        definition.n1Nodes.some((entry) => !genericKeys.has(paletteDedupeKey(entry.type, entry.label)))
      )
      .map(([, definition]) => definition.name)

    expect(groupOrder).toEqual([...genericGroups, ...expectedPatternGroups])
  })
})
