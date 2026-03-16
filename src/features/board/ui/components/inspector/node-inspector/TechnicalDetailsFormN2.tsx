import { ListInput } from '@/shared/ui/inputs/ListInput'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { FieldError } from '@/features/board/ui/components/inspector/node-inspector/InspectorPrimitives'
import { asString, asStringList } from '@/features/board/ui/components/inspector/node-inspector/utils'

interface TechnicalDetailsFormN2Props {
  nodeType: SemanticNode['type']
  draftData: Record<string, unknown>
  fieldErrorByName: Map<string, string>
  syncNodeData: (patch: Record<string, unknown>) => void
}

export function TechnicalDetailsFormN2({
  nodeType,
  draftData,
  fieldErrorByName,
  syncNodeData
}: TechnicalDetailsFormN2Props): JSX.Element | null {
  switch (nodeType) {
    case 'class':
      return (
        <>
          <ListInput
            id="node-class-stereotypes"
            label="Stereotypes"
            items={asStringList(draftData.stereotypes)}
            onChange={(items) => syncNodeData({ stereotypes: items })}
          />

          <ListInput
            id="node-class-exposes-methods"
            label="Exposes methods summary"
            items={asStringList(draftData.exposesMethodsSummary)}
            onChange={(items) => syncNodeData({ exposesMethodsSummary: items })}
          />

          <ListInput
            id="node-class-owns-attributes"
            label="Owns attributes summary"
            items={asStringList(draftData.ownsAttributesSummary)}
            onChange={(items) => syncNodeData({ ownsAttributesSummary: items })}
          />

          <ListInput
            id="node-class-invariants"
            label="Invariants"
            items={asStringList(draftData.invariants)}
            onChange={(items) => syncNodeData({ invariants: items })}
          />
        </>
      )
    case 'interface':
      return (
        <>
          <ListInput
            id="node-interface-operations"
            label="Exposed operations summary"
            items={asStringList(draftData.exposedOperationsSummary)}
            onChange={(items) => syncNodeData({ exposedOperationsSummary: items })}
          />
        </>
      )
    case 'api_contract':
      return (
        <>
          <label htmlFor="node-contract-kind">Contract kind</label>
          <select
            id="node-contract-kind"
            value={asString(draftData.kind, 'http')}
            onChange={(event) => syncNodeData({ kind: event.target.value })}
          >
            <option value="http">http</option>
            <option value="event">event</option>
            <option value="message">message</option>
            <option value="rpc">rpc</option>
            <option value="other">other</option>
          </select>
          <FieldError message={fieldErrorByName.get('kind')} />

          <label htmlFor="node-contract-consumer">Consumer</label>
          <input
            id="node-contract-consumer"
            type="text"
            value={asString(draftData.consumer)}
            onChange={(event) =>
              syncNodeData({ consumer: event.target.value.trim() ? event.target.value : undefined })
            }
          />

          <label htmlFor="node-contract-provider">Provider</label>
          <input
            id="node-contract-provider"
            type="text"
            value={asString(draftData.provider)}
            onChange={(event) =>
              syncNodeData({ provider: event.target.value.trim() ? event.target.value : undefined })
            }
          />

          <ListInput
            id="node-contract-error-cases"
            label="Error cases"
            items={asStringList(draftData.errorCases)}
            onChange={(items) => syncNodeData({ errorCases: items })}
          />
        </>
      )
    default:
      return null
  }
}
