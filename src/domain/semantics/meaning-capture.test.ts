import { describe, expect, it } from 'vitest'
import { getNodeMeaningFields, shouldSkipNodeMeaningCapture } from '@/domain/semantics/meaning-capture'

describe('meaning-capture', () => {
  it('skips creation-time semantic capture for free-note nodes', () => {
    expect(shouldSkipNodeMeaningCapture('free_note_input')).toBe(true)
    expect(shouldSkipNodeMeaningCapture('free_note_output')).toBe(true)
    expect(shouldSkipNodeMeaningCapture('system')).toBe(false)
  })

  it('returns no meaning fields for free-note nodes', () => {
    expect(getNodeMeaningFields('N2', 'free_note_input')).toEqual([])
    expect(getNodeMeaningFields('N2', 'free_note_output')).toEqual([])
  })
})
