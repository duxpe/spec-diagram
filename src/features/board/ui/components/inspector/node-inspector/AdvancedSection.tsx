import { InspectorSection } from '@/features/board/ui/components/inspector/node-inspector/InspectorPrimitives'

interface AdvancedSectionProps {
  nodeId: string
  roundedWidth: number
  roundedHeight: number
  onUpdateNode: (id: string, patch: { width?: number; height?: number }) => void
}

export function AdvancedSection({
  nodeId,
  roundedWidth,
  roundedHeight,
  onUpdateNode
}: AdvancedSectionProps): JSX.Element {
  return (
    <InspectorSection title="Advanced / notes" summary={`${roundedWidth} × ${roundedHeight} px`}>
      <label htmlFor="node-width">Width</label>
      <input
        id="node-width"
        type="number"
        value={roundedWidth}
        min={120}
        onChange={(event) => {
          const rawWidth = Number(event.target.value)
          if (!Number.isFinite(rawWidth) || rawWidth <= 0) return

          const width = Math.round(rawWidth)
          if (width === roundedWidth) return

          onUpdateNode(nodeId, { width })
        }}
      />

      <label htmlFor="node-height">Height</label>
      <input
        id="node-height"
        type="number"
        value={roundedHeight}
        min={70}
        onChange={(event) => {
          const rawHeight = Number(event.target.value)
          if (!Number.isFinite(rawHeight) || rawHeight <= 0) return

          const height = Math.round(rawHeight)
          if (height === roundedHeight) return

          onUpdateNode(nodeId, { height })
        }}
      />
    </InspectorSection>
  )
}
