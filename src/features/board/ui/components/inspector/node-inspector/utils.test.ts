import { describe, expect, it } from 'vitest'
import { asStringList, getBehaviorPrompts, parseListText } from '@/features/board/ui/components/inspector/node-inspector/utils'

describe('node-inspector utils', () => {
  it('parses multi-line list text into normalized entries', () => {
    expect(parseListText(' first\n\nsecond \n')).toEqual(['first', 'second'])
  })

  it('filters non-string list values', () => {
    expect(asStringList(['a', 1, 'b', null])).toEqual(['a', 'b'])
  })

  it('returns missing behavior prompts for class/api_contract only', () => {
    expect(getBehaviorPrompts('class', {})).toEqual(['invariants'])
    expect(getBehaviorPrompts('api_contract', { constraints: ['x'] })).toEqual(['errorCases'])
    expect(getBehaviorPrompts('system', {})).toEqual([])
  })
})
