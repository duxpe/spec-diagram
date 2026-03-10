import { Icon } from '@iconify/react'
import { useEditor, useValue } from 'tldraw'
import { GenericNodeIcon } from '@/components/icons/semantic-icons'
import { getNodeShapeId } from '@/board/tldraw/semantic-adapter'
import { getPayloadIssuesForNodeType } from '@/domain/schemas/semantic-node-payload.schema'
import {
  getCloudServiceById,
  getProviderLabel,
  resolveNodeVisual
} from '@/domain/semantics/node-visual-catalog'
import { SemanticNode } from '@/domain/models/semantic-node'

interface SemanticOverlayProps {
  nodes: SemanticNode[]
  selectedNodeId?: string
}

interface ScreenNodeBounds {
  id: string
  left: number
  top: number
  width: number
  height: number
}

function useCameraTick(): string {
  const editor = useEditor()

  return useValue(
    'semantic-overlay-camera',
    () => {
      const camera = editor.getCamera()
      return `${camera.x}:${camera.y}:${editor.getZoomLevel()}`
    },
    [editor]
  )
}

function getScreenBounds(
  editor: ReturnType<typeof useEditor>,
  node: SemanticNode
): ScreenNodeBounds | undefined {
  const shape = editor.getShape(getNodeShapeId(node.id) as Parameters<typeof editor.getShape>[0])
  if (!shape) return undefined

  const bounds = editor.getShapePageBounds(shape)
  if (!bounds) return undefined

  const topLeft = editor.pageToScreen({ x: bounds.minX, y: bounds.minY })
  const bottomRight = editor.pageToScreen({ x: bounds.maxX, y: bounds.maxY })

  return {
    id: node.id,
    left: topLeft.x,
    top: topLeft.y,
    width: Math.max(bottomRight.x - topLeft.x, 0),
    height: Math.max(bottomRight.y - topLeft.y, 0)
  }
}

export function SemanticOverlay({ nodes, selectedNodeId }: SemanticOverlayProps): JSX.Element {
  const editor = useEditor()
  useCameraTick()

  return (
    <div className="semantic-overlay semantic-overlay--canvas" aria-hidden="true">
      {nodes.map((node) => {
        const screenBounds = getScreenBounds(editor, node)
        if (!screenBounds) return null

        const visual = resolveNodeVisual(node)
        const providerService = getCloudServiceById(visual.providerService)
        const hasErrors = getPayloadIssuesForNodeType(node.type, node.data).length > 0

        return (
          <div
            key={node.id}
            className={`semantic-overlay__node ${selectedNodeId === node.id ? 'is-selected' : ''}`}
            style={{
              left: `${screenBounds.left}px`,
              top: `${screenBounds.top}px`,
              width: `${screenBounds.width}px`,
              height: `${screenBounds.height}px`
            }}
          >
            <div className="semantic-overlay__chip semantic-overlay__chip--icon">
              {providerService ? (
                <Icon icon={providerService.icon} width={16} height={16} />
              ) : (
                <GenericNodeIcon iconId={visual.icon} size={16} />
              )}
            </div>

            {visual.showProviderBadge && visual.provider !== 'none' ? (
              <div className="semantic-overlay__chip semantic-overlay__chip--provider">
                {getProviderLabel(visual.provider)}
              </div>
            ) : null}

            {node.childBoardId ? (
              <div className="semantic-overlay__chip semantic-overlay__chip--detail">N</div>
            ) : null}

            {hasErrors ? (
              <div className="semantic-overlay__chip semantic-overlay__chip--warning">!</div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
