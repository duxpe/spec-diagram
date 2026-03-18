import type { NodeAppearance } from '@/domain/models/node-appearance'

interface AppearanceExtrasTabProps {
  visible: boolean
  checked: boolean
  syncNodeAppearance: (patch: NodeAppearance) => void
}

export function AppearanceExtrasTab({
  visible,
  checked,
  syncNodeAppearance
}: AppearanceExtrasTabProps): JSX.Element {
  return (
    <section role="tabpanel" aria-hidden={!visible} hidden={!visible} className="node-appearance-tabpanel">
      <label htmlFor="node-show-provider-badge">
        <input
          id="node-show-provider-badge"
          type="checkbox"
          checked={checked}
          onChange={(event) => syncNodeAppearance({ showProviderBadge: event.target.checked })}
        />
        {' '}Show provider badge
      </label>
    </section>
  )
}
