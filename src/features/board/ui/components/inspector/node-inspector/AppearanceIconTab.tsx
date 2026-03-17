import { Icon } from '@iconify/react'
import type { NodeAppearance, VisualProvider } from '@/domain/models/node-appearance'
import {
  getCloudServiceOptions,
  getGenericIconOptions
} from '@/domain/semantics/node-visual-catalog'
import { GenericNodeIcon } from '@/shared/ui/icons/semantic-icons'

interface AppearanceIconTabProps {
  visible: boolean
  iconSearch: string
  setIconSearch: (value: string) => void
  iconProviderTab: VisualProvider
  setIconProviderTab: (provider: VisualProvider) => void
  resolvedVisual: ReturnType<
    typeof import('@/domain/semantics/node-visual-catalog').resolveNodeVisual
  >
  syncNodeAppearance: (patch: NodeAppearance) => void
}

export function AppearanceIconTab({
  visible,
  iconSearch,
  setIconSearch,
  iconProviderTab,
  setIconProviderTab,
  resolvedVisual,
  syncNodeAppearance
}: AppearanceIconTabProps): JSX.Element {
  const genericIconOptions = getGenericIconOptions()
  const cloudIconOptions = iconProviderTab === 'none' ? [] : getCloudServiceOptions(iconProviderTab)

  const filteredGenericIcons = genericIconOptions.filter((item) =>
    item.label.toLowerCase().includes(iconSearch.trim().toLowerCase())
  )
  const filteredCloudIcons = cloudIconOptions.filter((item) =>
    item.label.toLowerCase().includes(iconSearch.trim().toLowerCase())
  )

  return (
    <section role="tabpanel" aria-hidden={!visible} hidden={!visible} className="node-appearance-tabpanel">
      <label htmlFor="node-icon-search">Icon search</label>
      <input
        id="node-icon-search"
        type="search"
        value={iconSearch}
        placeholder="Search icons"
        onChange={(event) => setIconSearch(event.target.value)}
      />

      <div className="icon-picker-tabs" role="tablist" aria-label="Icon providers">
        <button
          type="button"
          className={iconProviderTab === 'none' ? 'active' : undefined}
          onClick={() => setIconProviderTab('none')}
          data-ui-log="Inspector appearance – Icon provider Generic"
        >
          Generic
        </button>
        <button
          type="button"
          className={iconProviderTab === 'aws' ? 'active' : undefined}
          onClick={() => setIconProviderTab('aws')}
          data-ui-log="Inspector appearance – Icon provider AWS"
        >
          AWS
        </button>
        <button
          type="button"
          className={iconProviderTab === 'azure' ? 'active' : undefined}
          onClick={() => setIconProviderTab('azure')}
          data-ui-log="Inspector appearance – Icon provider Azure"
        >
          Azure
        </button>
        <button
          type="button"
          className={iconProviderTab === 'gcp' ? 'active' : undefined}
          onClick={() => setIconProviderTab('gcp')}
          data-ui-log="Inspector appearance – Icon provider GCP"
        >
          GCP
        </button>
      </div>

      {iconProviderTab === 'none' ? (
        <div className="icon-picker-grid">
          {filteredGenericIcons.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`icon-picker-card ${resolvedVisual.icon === option.id ? 'selected' : ''}`}
              onClick={() => syncNodeAppearance({ icon: option.id })}
              data-ui-log={`Inspector appearance – Choose icon ${option.label}`}
            >
              <span className="icon-picker-card__icon" aria-hidden="true">
                <GenericNodeIcon iconId={option.id} size={18} />
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="icon-picker-grid">
          {filteredCloudIcons.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`icon-picker-card ${
                resolvedVisual.providerService === option.id ? 'selected' : ''
              }`}
              onClick={() =>
                syncNodeAppearance({
                  provider: option.provider,
                  providerService: option.id
                })
              }
              data-ui-log={`Inspector appearance – Choose icon ${option.label}`}
            >
              <span className="icon-picker-card__icon icon-picker-card__icon--cloud" aria-hidden="true">
                <Icon
                  icon={option.icon}
                  width={20}
                  height={20}
                  style={{
                    display: 'block'
                  }}
                />
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
