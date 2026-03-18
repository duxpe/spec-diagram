import type { NodeAppearance, VisualProvider } from '@/domain/models/node-appearance'
import {
  getAccentOptions,
  getCloudServiceOptions,
  getProviderOptions,
  getShapeOptions
} from '@/domain/semantics/node-visual-catalog'

interface AppearanceVisualTabProps {
  visible: boolean
  resolvedVisual: ReturnType<
    typeof import('@/domain/semantics/node-visual-catalog').resolveNodeVisual
  >
  setIconProviderTab: (provider: VisualProvider) => void
  syncNodeAppearance: (patch: NodeAppearance) => void
}

export function AppearanceVisualTab({
  visible,
  resolvedVisual,
  setIconProviderTab,
  syncNodeAppearance
}: AppearanceVisualTabProps): JSX.Element {
  const providerServiceOptions = getCloudServiceOptions(resolvedVisual.provider)

  return (
    <section role="tabpanel" aria-hidden={!visible} hidden={!visible} className="node-appearance-tabpanel">
      <label htmlFor="node-shape-variant">Shape</label>
      <select
        id="node-shape-variant"
        value={resolvedVisual.shapeVariant}
        onChange={(event) =>
          syncNodeAppearance({ shapeVariant: event.target.value as NodeAppearance['shapeVariant'] })
        }
      >
        {getShapeOptions().map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="node-accent-color">Accent</label>
      <select
        id="node-accent-color"
        value={resolvedVisual.accentColor}
        onChange={(event) =>
          syncNodeAppearance({ accentColor: event.target.value as NodeAppearance['accentColor'] })
        }
      >
        {getAccentOptions().map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="node-provider-visual">Provider visual</label>
      <select
        id="node-provider-visual"
        value={resolvedVisual.provider}
        onChange={(event) => {
          const provider = event.target.value as VisualProvider
          setIconProviderTab(provider)
          syncNodeAppearance({ provider, providerService: undefined })
        }}
      >
        {getProviderOptions().map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="node-provider-service">Cloud service</label>
      <select
        id="node-provider-service"
        value={resolvedVisual.providerService ?? ''}
        onChange={(event) =>
          syncNodeAppearance({
            providerService: event.target.value
              ? (event.target.value as NodeAppearance['providerService'])
              : undefined
          })
        }
        disabled={resolvedVisual.provider === 'none'}
      >
        <option value="">Generic icon</option>
        {providerServiceOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </section>
  )
}
