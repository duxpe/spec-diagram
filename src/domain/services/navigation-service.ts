import { SemanticLevel } from '@/domain/models/board'

export class NavigationService {
  static inferChildLevel(level: SemanticLevel): SemanticLevel | null {
    if (level === 'N1') return 'N2'
    if (level === 'N2') return 'N3'
    return null
  }
}
