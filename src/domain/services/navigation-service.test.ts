import { describe, expect, it } from 'vitest'
import { NavigationService } from '@/domain/services/navigation-service'

describe('NavigationService', () => {
  it('infers child level from N1 to N2', () => {
    expect(NavigationService.inferChildLevel('N1')).toBe('N2')
  })

  it('returns null for N2', () => {
    expect(NavigationService.inferChildLevel('N2')).toBeNull()
  })
})
