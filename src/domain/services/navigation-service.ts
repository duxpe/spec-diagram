import { SemanticLevel } from '@/domain/models/board'

export class NavigationService {
  static inferChildLevel(level: SemanticLevel): SemanticLevel | null {
    if (level === 'N1') return 'N2'
    return null
  }
}
