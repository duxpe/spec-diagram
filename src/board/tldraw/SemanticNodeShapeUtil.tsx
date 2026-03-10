import { BaseBoxShapeUtil, HTMLContainer, Rectangle2d, T, TLBaseShape, TLDefaultColorStyle } from 'tldraw'
import { Icon } from '@iconify/react'
import { GenericNodeIcon } from '@/components/icons/semantic-icons'
import { getCloudServiceById, getProviderLabel } from '@/domain/semantics/node-visual-catalog'

// Define validators for our custom properties
const nodeShapeVariantValidator = T.literalEnum(
  'rectangle',
  'oval',
  'diamond',
  'rhombus',
  'trapezoid',
  'hexagon',
  'cloud'
)

const semanticNodeTypeValidator = T.literalEnum(
  'system',
  'container_service',
  'database',
  'external_system',
  'port',
  'adapter',
  'decision',
  'class',
  'interface',
  'api_contract',
  'method',
  'attribute',
  'free_note_input',
  'free_note_output'
)

const genericIconValidator = T.literalEnum(
  'grid',
  'cube',
  'database',
  'globe',
  'brackets',
  'git-branch',
  'box',
  'layers',
  'plug',
  'bridge',
  'function-square',
  'key-round',
  'arrow-down',
  'arrow-up'
)

const accentColorValidator = T.literalEnum(
  'cyan',
  'teal',
  'amber',
  'gray',
  'indigo',
  'orange',
  'blue',
  'purple',
  'green',
  'neutral'
)

const visualProviderValidator = T.literalEnum('none', 'aws', 'azure', 'gcp')

const providerServiceValidator = T.literalEnum(
  'aws_ec2',
  'aws_lambda',
  'aws_ecs',
  'aws_s3',
  'aws_rds',
  'aws_dynamodb',
  'aws_apigateway',
  'azure_app_service',
  'azure_functions',
  'azure_aks',
  'azure_blob_storage',
  'azure_sql_database',
  'azure_cosmos_db',
  'azure_api_management',
  'gcp_cloud_run',
  'gcp_gke',
  'gcp_cloud_functions',
  'gcp_cloud_storage',
  'gcp_cloud_sql',
  'gcp_firestore',
  'gcp_pubsub'
)

// Props validator for the shape
export const semanticNodeShapeProps = {
  w: T.number,
  h: T.number,
  text: T.string,
  color: T.string,
  semanticId: T.string,
  semanticType: semanticNodeTypeValidator,
  shapeVariant: nodeShapeVariantValidator,
  icon: genericIconValidator,
  accentColor: accentColorValidator,
  provider: visualProviderValidator,
  providerService: T.optional(providerServiceValidator),
  showProviderBadge: T.boolean,
  hasChildBoard: T.boolean,
  hasValidationErrors: T.boolean
}

// Type definition for our custom shape
export type SemanticNodeShape = TLBaseShape<
  'semantic-node',
  {
    w: number
    h: number
    text: string
    color: TLDefaultColorStyle
    semanticId: string
    semanticType: string
    shapeVariant: string
    icon: string
    accentColor: string
    provider: string
    providerService?: string
    showProviderBadge: boolean
    hasChildBoard: boolean
    hasValidationErrors: boolean
  }
>

// Mapping from shape variants to rendering
const SHAPE_VARIANT_TO_GEO: Record<string, string> = {
  rectangle: 'rectangle',
  oval: 'oval',
  diamond: 'diamond',
  rhombus: 'rhombus-2',
  trapezoid: 'trapezoid',
  hexagon: 'hexagon',
  cloud: 'cloud'
}

export class SemanticNodeShapeUtil extends BaseBoxShapeUtil<SemanticNodeShape> {
  static override type = 'semantic-node' as const

  static override props = semanticNodeShapeProps

  // Default properties for new shapes
  override getDefaultProps(): SemanticNodeShape['props'] {
    return {
      w: 220,
      h: 110,
      text: 'Untitled Node',
      color: 'light-blue',
      semanticId: '',
      semanticType: 'system',
      shapeVariant: 'rectangle',
      icon: 'grid',
      accentColor: 'cyan',
      provider: 'none',
      providerService: undefined,
      showProviderBadge: false,
      hasChildBoard: false,
      hasValidationErrors: false
    }
  }

  // Define the geometry for hit testing and bounds calculation
  override getGeometry(shape: SemanticNodeShape): Rectangle2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true
    })
  }

  // Render the shape component
  override component(shape: SemanticNodeShape) {
    const { w, h, text, shapeVariant, icon, provider, providerService, showProviderBadge, hasChildBoard, hasValidationErrors } = shape.props

    const providerServiceData = providerService ? getCloudServiceById(providerService as any) : null
    const geoType = SHAPE_VARIANT_TO_GEO[shapeVariant] || 'rectangle'

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: w,
          height: h,
          position: 'relative',
          pointerEvents: 'all'
        }}
      >
        {/* Background shape using SVG */}
        <svg
          width={w}
          height={h}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'visible'
          }}
        >
          {this.renderShapeBackground(shape, w, h, geoType)}
        </svg>

        {/* Text content */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            textAlign: 'center',
            fontSize: '14px',
            fontFamily: 'var(--tl-font-sans)',
            color: 'var(--color-text)',
            wordWrap: 'break-word',
            overflow: 'hidden',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          {text}
        </div>

        {/* Icon chip (top-left) */}
        <div
          className="semantic-node__chip semantic-node__chip--icon"
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(6, 14, 31, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.24)',
            borderRadius: '6px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.24)',
            pointerEvents: 'none'
          }}
        >
          {providerServiceData ? (
            <Icon icon={providerServiceData.icon} width={16} height={16} style={{ color: '#fff' }} />
          ) : (
            <GenericNodeIcon iconId={icon as any} size={16} color="#fff" />
          )}
        </div>

        {/* Provider badge (top-right) */}
        {showProviderBadge && provider !== 'none' && (
          <div
            className="semantic-node__chip semantic-node__chip--provider"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: 'rgba(6, 14, 31, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.24)',
              borderRadius: '4px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.24)',
              color: '#fff',
              pointerEvents: 'none'
            }}
          >
            {getProviderLabel(provider as any)}
          </div>
        )}

        {/* Detail indicator (bottom-right) - shows when node has child board */}
        {hasChildBoard && (
          <div
            className="semantic-node__chip semantic-node__chip--detail"
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(6, 14, 31, 0.88)',
              border: '1px solid rgba(99, 179, 237, 0.4)',
              borderRadius: '4px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 12px rgba(99, 179, 237, 0.3)',
              color: '#63b3ed',
              pointerEvents: 'none'
            }}
          >
            N
          </div>
        )}

        {/* Warning indicator (bottom-left) - shows when validation errors exist */}
        {hasValidationErrors && (
          <div
            className="semantic-node__chip semantic-node__chip--warning"
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              background: 'rgba(6, 14, 31, 0.88)',
              border: '1px solid rgba(245, 101, 101, 0.4)',
              borderRadius: '4px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 12px rgba(245, 101, 101, 0.3)',
              color: '#f56565',
              pointerEvents: 'none'
            }}
          >
            !
          </div>
        )}
      </HTMLContainer>
    )
  }

  // Helper method to render different shape backgrounds
  private renderShapeBackground(shape: SemanticNodeShape, w: number, h: number, geoType: string): JSX.Element {
    const { color, provider, hasValidationErrors, hasChildBoard } = shape.props

    // Determine fill and stroke styles
    const fillOpacity = provider === 'none' ? 0.5 : 1.0
    const strokeDasharray = hasValidationErrors ? '4,4' : hasChildBoard ? '8,4' : 'none'
    const fill = `var(--palette-${color})`
    const stroke = `var(--palette-${color}-semi)`

    switch (geoType) {
      case 'oval':
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2 - 2}
            ry={h / 2 - 2}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
          />
        )

      case 'diamond':
        return (
          <path
            d={`M ${w / 2} 2 L ${w - 2} ${h / 2} L ${w / 2} ${h - 2} L 2 ${h / 2} Z`}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
          />
        )

      case 'hexagon':
        const hexW = w / 4
        return (
          <path
            d={`M ${hexW} 2 L ${w - hexW} 2 L ${w - 2} ${h / 2} L ${w - hexW} ${h - 2} L ${hexW} ${h - 2} L 2 ${h / 2} Z`}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
          />
        )

      case 'cloud':
        // Simplified cloud shape
        const r = Math.min(w, h) / 8
        return (
          <path
            d={`
              M ${r * 2} ${h / 2}
              Q ${r} ${h / 3}, ${r * 2} ${r * 2}
              Q ${r * 2} ${r}, ${r * 4} ${r}
              Q ${w - r * 2} ${r}, ${w - r * 2} ${r * 2}
              Q ${w - r} ${h / 3}, ${w - r * 2} ${h / 2}
              Q ${w - r} ${h - r * 2}, ${w - r * 2} ${h - r * 2}
              Q ${w - r * 4} ${h - r}, ${r * 4} ${h - r}
              Q ${r * 2} ${h - r}, ${r * 2} ${h / 2}
            `}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
          />
        )

      case 'trapezoid':
        const inset = w / 6
        return (
          <path
            d={`M ${inset} 2 L ${w - inset} 2 L ${w - 2} ${h - 2} L 2 ${h - 2} Z`}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
          />
        )

      case 'rhombus-2':
        return (
          <path
            d={`M ${w / 2} 2 L ${w - 2} ${h / 2} L ${w / 2} ${h - 2} L 2 ${h / 2} Z`}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
          />
        )

      case 'rectangle':
      default:
        return (
          <rect
            x={2}
            y={2}
            width={w - 4}
            height={h - 4}
            rx={8}
            ry={8}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
          />
        )
    }
  }

  // Render the selection indicator
  override indicator(shape: SemanticNodeShape) {
    const { w, h, shapeVariant } = shape.props
    const geoType = SHAPE_VARIANT_TO_GEO[shapeVariant] || 'rectangle'

    switch (geoType) {
      case 'oval':
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2}
            ry={h / 2}
            fill="none"
            stroke="var(--color-selected)"
            strokeWidth={2}
          />
        )

      case 'diamond':
      case 'rhombus-2':
        return (
          <path
            d={`M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`}
            fill="none"
            stroke="var(--color-selected)"
            strokeWidth={2}
          />
        )

      case 'hexagon':
        const hexW = w / 4
        return (
          <path
            d={`M ${hexW} 0 L ${w - hexW} 0 L ${w} ${h / 2} L ${w - hexW} ${h} L ${hexW} ${h} L 0 ${h / 2} Z`}
            fill="none"
            stroke="var(--color-selected)"
            strokeWidth={2}
          />
        )

      case 'trapezoid':
        const inset = w / 6
        return (
          <path
            d={`M ${inset} 0 L ${w - inset} 0 L ${w} ${h} L 0 ${h} Z`}
            fill="none"
            stroke="var(--color-selected)"
            strokeWidth={2}
          />
        )

      case 'cloud':
        // Use bounding box for cloud indicator
        return (
          <rect
            width={w}
            height={h}
            rx={8}
            fill="none"
            stroke="var(--color-selected)"
            strokeWidth={2}
          />
        )

      case 'rectangle':
      default:
        return (
          <rect
            width={w}
            height={h}
            rx={8}
            fill="none"
            stroke="var(--color-selected)"
            strokeWidth={2}
          />
        )
    }
  }
}
