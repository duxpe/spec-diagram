import { ListInput } from '@/shared/ui/inputs/ListInput'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { FieldError } from '@/features/board/ui/components/inspector/node-inspector/InspectorPrimitives'
import { TechnicalDetailsFormN2 } from '@/features/board/ui/components/inspector/node-inspector/TechnicalDetailsFormN2'
import { asString, asStringList } from '@/features/board/ui/components/inspector/node-inspector/utils'

interface TechnicalDetailsFormProps {
  nodeType: SemanticNode['type']
  draftData: Record<string, unknown>
  fieldErrorByName: Map<string, string>
  syncNodeData: (patch: Record<string, unknown>) => void
}

export function TechnicalDetailsForm({
  nodeType,
  draftData,
  fieldErrorByName,
  syncNodeData
}: TechnicalDetailsFormProps): JSX.Element | null {
  switch (nodeType) {
    case 'system':
      return (
        <ListInput
          id="node-assumptions"
          label="Assumptions"
          items={asStringList(draftData.assumptions)}
          onChange={(items) => syncNodeData({ assumptions: items })}
        />
      )
    case 'container_service':
      return (
        <>
          <ListInput
            id="node-technologies"
            label="Technologies"
            items={asStringList(draftData.technologies)}
            onChange={(items) => syncNodeData({ technologies: items })}
          />
          <label htmlFor="node-owned-by">Owned by</label>
          <input
            id="node-owned-by"
            type="text"
            value={asString(draftData.ownedBy)}
            onChange={(event) =>
              syncNodeData({ ownedBy: event.target.value.trim() ? event.target.value : undefined })
            }
          />
        </>
      )
    case 'database':
      return (
        <>
          <label htmlFor="node-storage-model">Storage model</label>
          <select
            id="node-storage-model"
            value={asString(draftData.storageModel, 'relational')}
            onChange={(event) => syncNodeData({ storageModel: event.target.value })}
          >
            <option value="relational">relational</option>
            <option value="document">document</option>
            <option value="key_value">key_value</option>
            <option value="graph">graph</option>
            <option value="event_store">event_store</option>
            <option value="other">other</option>
          </select>
        </>
      )
    case 'external_system':
      return (
        <>
          <label htmlFor="node-interaction-type">Interaction type</label>
          <select
            id="node-interaction-type"
            value={asString(draftData.interactionType, 'unknown')}
            onChange={(event) => syncNodeData({ interactionType: event.target.value })}
          >
            <option value="sync">sync</option>
            <option value="async">async</option>
            <option value="batch">batch</option>
            <option value="manual">manual</option>
            <option value="unknown">unknown</option>
          </select>
        </>
      )
    case 'port':
      return (
        <>
          <label htmlFor="node-direction">Direction</label>
          <select
            id="node-direction"
            value={asString(draftData.direction, 'inbound')}
            onChange={(event) => syncNodeData({ direction: event.target.value })}
          >
            <option value="inbound">inbound</option>
            <option value="outbound">outbound</option>
          </select>
          <FieldError message={fieldErrorByName.get('direction')} />
          <label htmlFor="node-protocol">Protocol</label>
          <input
            id="node-protocol"
            type="text"
            value={asString(draftData.protocol)}
            onChange={(event) =>
              syncNodeData({ protocol: event.target.value.trim() ? event.target.value : undefined })
            }
          />
        </>
      )
    case 'adapter':
      return (
        <>
          <label htmlFor="node-technology">Technology</label>
          <input
            id="node-technology"
            type="text"
            value={asString(draftData.technology)}
            onChange={(event) =>
              syncNodeData({ technology: event.target.value.trim() ? event.target.value : undefined })
            }
          />
          <label htmlFor="node-external-dependency">External dependency</label>
          <input
            id="node-external-dependency"
            type="text"
            value={asString(draftData.externalDependency)}
            onChange={(event) =>
              syncNodeData({
                externalDependency: event.target.value.trim() ? event.target.value : undefined
              })
            }
          />
        </>
      )
    case 'decision':
      return (
        <>
          <label htmlFor="node-status">Status</label>
          <select
            id="node-status"
            value={asString(draftData.status, 'proposed')}
            onChange={(event) => syncNodeData({ status: event.target.value })}
          >
            <option value="proposed">proposed</option>
            <option value="accepted">accepted</option>
            <option value="deprecated">deprecated</option>
          </select>
        </>
      )
    case 'free_note_input':
      return (
        <>
          <label htmlFor="node-expected-inputs">Expected inputs text</label>
          <textarea
            id="node-expected-inputs"
            rows={3}
            value={asString(draftData.expectedInputsText)}
            onChange={(event) => syncNodeData({ expectedInputsText: event.target.value })}
          />
          <FieldError message={fieldErrorByName.get('expectedInputsText')} />
        </>
      )
    case 'free_note_output':
      return (
        <>
          <label htmlFor="node-expected-outputs">Expected outputs text</label>
          <textarea
            id="node-expected-outputs"
            rows={3}
            value={asString(draftData.expectedOutputsText)}
            onChange={(event) => syncNodeData({ expectedOutputsText: event.target.value })}
          />
          <FieldError message={fieldErrorByName.get('expectedOutputsText')} />
        </>
      )
    default:
      return (
        <TechnicalDetailsFormN2
          nodeType={nodeType}
          draftData={draftData}
          fieldErrorByName={fieldErrorByName}
          syncNodeData={syncNodeData}
        />
      )
  }
}
