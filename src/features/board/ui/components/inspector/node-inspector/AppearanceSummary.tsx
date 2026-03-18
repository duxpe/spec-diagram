import { Palette } from 'lucide-react'
import type { GenericIconId } from '@/domain/models/node-appearance'
import { GenericNodeIcon } from '@/shared/ui/icons/semantic-icons'

interface AppearanceSummaryProps {
  iconId: GenericIconId
  appearanceProviderSummary: string
  onOpenAppearanceDialog: () => void
}

export function AppearanceSummary({
  iconId,
  appearanceProviderSummary,
  onOpenAppearanceDialog
}: AppearanceSummaryProps): JSX.Element {
  return (
    <div className="node-appearance-summary">
      <div className="node-appearance-summary__preview" aria-hidden="true">
        <span className="node-appearance-summary__preview-icon">
          <GenericNodeIcon iconId={iconId} size={18} />
        </span>
      </div>
      <div className="node-appearance-summary__details">
        <p className="node-appearance-summary__title">Appearance</p>
        <p className="node-appearance-summary__provider">{appearanceProviderSummary}</p>
      </div>
      <button
        type="button"
        className="node-appearance-summary__button node-appearance-summary__trigger"
        onClick={onOpenAppearanceDialog}
        aria-label="Edit appearance"
        data-ui-log="Inspector – Open appearance dialog"
      >
        <Palette size={18} />
      </button>
    </div>
  )
}
