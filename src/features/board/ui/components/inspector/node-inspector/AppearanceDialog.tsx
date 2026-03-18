import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { NodeAppearance, VisualProvider } from '@/domain/models/node-appearance'
import { getCloudServiceById, getProviderLabel } from '@/domain/semantics/node-visual-catalog'
import { GenericNodeIcon } from '@/shared/ui/icons/semantic-icons'
import { FieldError } from '@/features/board/ui/components/inspector/node-inspector/InspectorPrimitives'
import { AppearanceExtrasTab } from '@/features/board/ui/components/inspector/node-inspector/AppearanceExtrasTab'
import { AppearanceIconTab } from '@/features/board/ui/components/inspector/node-inspector/AppearanceIconTab'
import { AppearanceVisualTab } from '@/features/board/ui/components/inspector/node-inspector/AppearanceVisualTab'

interface AppearanceDialogProps {
  open: boolean
  portalContainer: HTMLElement | null
  resolvedVisual: ReturnType<
    typeof import('@/domain/semantics/node-visual-catalog').resolveNodeVisual
  >
  appearanceProviderSummary: string
  appearanceTab: 'visual' | 'icon' | 'extras'
  setAppearanceTab: (tab: 'visual' | 'icon' | 'extras') => void
  iconSearch: string
  setIconSearch: (value: string) => void
  iconProviderTab: VisualProvider
  setIconProviderTab: (provider: VisualProvider) => void
  appearanceError?: string
  onClose: () => void
  onReset: () => void
  syncNodeAppearance: (patch: NodeAppearance) => void
}

export function AppearanceDialog({
  open,
  portalContainer,
  resolvedVisual,
  appearanceProviderSummary,
  appearanceTab,
  setAppearanceTab,
  iconSearch,
  setIconSearch,
  iconProviderTab,
  setIconProviderTab,
  appearanceError,
  onClose,
  onReset,
  syncNodeAppearance
}: AppearanceDialogProps): JSX.Element | null {
  if (!portalContainer || !open) return null

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-card node-appearance-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Appearance"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-card__header node-appearance-dialog__header">
          <div className="node-appearance-dialog__header-main">
            <span className="node-appearance__preview" aria-hidden="true">
              <span className="node-appearance__preview-icon">
                <GenericNodeIcon iconId={resolvedVisual.icon} size={18} />
              </span>
              <span>
                {getProviderLabel(resolvedVisual.provider)}
                {resolvedVisual.providerService
                  ? ` / ${getCloudServiceById(resolvedVisual.providerService)?.label ?? 'Custom'}`
                  : ' / Generic'}
              </span>
            </span>
            <div>
              <h2>Appearance</h2>
              <p className="node-appearance__provider-summary">{appearanceProviderSummary}</p>
            </div>
          </div>
          <div className="node-appearance-dialog__header-actions">
            <button type="button" onClick={onReset} data-ui-log="Inspector – Reset appearance">
              Reset visual
            </button>
            <button
              type="button"
              className="node-appearance-dialog__close"
              onClick={onClose}
              aria-label="Close appearance dialog"
              data-ui-log="Inspector – Close appearance dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="node-appearance node-appearance--dialog">
          <nav className="node-appearance-tablist" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={appearanceTab === 'visual'}
              className={appearanceTab === 'visual' ? 'is-active' : undefined}
              onClick={() => setAppearanceTab('visual')}
              data-ui-log="Inspector appearance – Select Visual tab"
            >
              Visual
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={appearanceTab === 'icon'}
              className={appearanceTab === 'icon' ? 'is-active' : undefined}
              onClick={() => setAppearanceTab('icon')}
              data-ui-log="Inspector appearance – Select Icon tab"
            >
              Icon
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={appearanceTab === 'extras'}
              className={appearanceTab === 'extras' ? 'is-active' : undefined}
              onClick={() => setAppearanceTab('extras')}
              data-ui-log="Inspector appearance – Select Badge tab"
            >
              Badge
            </button>
          </nav>

          <div className="node-appearance-tabpanels">
            <AppearanceVisualTab
              visible={appearanceTab === 'visual'}
              resolvedVisual={resolvedVisual}
              setIconProviderTab={setIconProviderTab}
              syncNodeAppearance={syncNodeAppearance}
            />
            <AppearanceIconTab
              visible={appearanceTab === 'icon'}
              iconSearch={iconSearch}
              setIconSearch={setIconSearch}
              iconProviderTab={iconProviderTab}
              setIconProviderTab={setIconProviderTab}
              resolvedVisual={resolvedVisual}
              syncNodeAppearance={syncNodeAppearance}
            />
            <AppearanceExtrasTab
              visible={appearanceTab === 'extras'}
              checked={resolvedVisual.showProviderBadge}
              syncNodeAppearance={syncNodeAppearance}
            />
          </div>

          <FieldError message={appearanceError} />
        </div>
      </div>
    </div>,
    portalContainer
  )
}
