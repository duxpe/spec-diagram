import { Link } from 'react-router-dom'
import { LayoutGrid, ChevronLeft, Sun, Moon, Monitor } from 'lucide-react'
import { SemanticLevel } from '@/domain/models/board'
import { ActiveTheme } from '@/domain/models/node-appearance'

interface FloatingHeaderProps {
  workspaceName: string
  boardName: string
  level: SemanticLevel
  parentBoardId?: string
  themeMode: 'system' | 'light' | 'dark'
  activeTheme: ActiveTheme
  onBackToParent: () => void
  onThemeModeChange: (mode: 'system' | 'light' | 'dark') => void
}

export function FloatingHeader({
  workspaceName,
  boardName,
  level,
  parentBoardId,
  themeMode,
  activeTheme,
  onBackToParent,
  onThemeModeChange
}: FloatingHeaderProps): JSX.Element {
  const nextTheme = (): void => {
    const modes: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark']
    const currentIndex = modes.indexOf(themeMode)
    const nextIndex = (currentIndex + 1) % modes.length
    onThemeModeChange(modes[nextIndex])
  }

  const ThemeIcon = activeTheme === 'dark' ? Moon : themeMode === 'system' ? Monitor : Sun

  return (
    <header className="floating-header">
      <div className="floating-header__brand">
        <div className="floating-header__brand-icon">
          <LayoutGrid size={16} />
        </div>
        <span>SysDs-SG</span>
      </div>

      <div className="floating-header__divider" />

      <div className="floating-header__info">
        <span>{workspaceName}</span>
        <span>/</span>
        <span>{boardName}</span>
        <span className="floating-header__level">{level}</span>
      </div>

      <div className="floating-header__divider" />

      <div className="floating-header__actions">
        {parentBoardId ? (
          <button
            type="button"
            className="floating-header__btn floating-header__btn--text"
            onClick={onBackToParent}
            title="Back to parent board"
          >
            <ChevronLeft size={16} />
            Parent
          </button>
        ) : null}

        <Link
          to="/projects"
          className="floating-header__btn floating-header__btn--text"
          title="Go to projects"
        >
          Projects
        </Link>

        <button
          type="button"
          className="floating-header__btn"
          onClick={nextTheme}
          title={`Theme: ${themeMode}`}
        >
          <ThemeIcon size={18} />
        </button>
      </div>
    </header>
  )
}
