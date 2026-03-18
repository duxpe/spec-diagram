import type { ChangeEvent } from 'react'
import { ListInput } from '@/shared/ui/inputs/ListInput'
import type { MeaningFieldConfig, NodeMeaningDraft } from '@/domain/semantics/meaning-capture'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { FieldError, InspectorSection } from '@/features/board/ui/components/inspector/node-inspector/InspectorPrimitives'
import { parseListText } from '@/features/board/ui/components/inspector/node-inspector/utils'
import type { InspectorParentContext } from '@/features/board/ui/components/inspector/node-inspector/types'

interface MeaningSectionProps {
  node: SemanticNode
  parentContext?: InspectorParentContext
  draftTitle: string
  titleError?: string
  onTitleChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  meaningFields: MeaningFieldConfig[]
  meaningCompletion: number
  draftMeaning: NodeMeaningDraft
  syncNodeMeaning: (patch: Partial<NodeMeaningDraft>) => void
}

export function MeaningSection({
  node,
  parentContext,
  draftTitle,
  titleError,
  onTitleChange,
  meaningFields,
  meaningCompletion,
  draftMeaning,
  syncNodeMeaning
}: MeaningSectionProps): JSX.Element {
  return (
    <InspectorSection
      title="Meaning"
      summary={meaningFields.length > 0 ? `${meaningCompletion}/${meaningFields.length} captured` : 'Title only'}
      defaultOpen
    >
      <p className="node-inspector__type">Type: {node.level} · {node.type}</p>
      {parentContext ? (
        <>
          <p className="node-inspector__parent">
            Parent ({parentContext.immediate.level}): {parentContext.immediate.boardName} /{' '}
            {parentContext.immediate.nodeTitle}
          </p>
          {parentContext.ancestor ? (
            <p className="node-inspector__parent">
              Ancestor ({parentContext.ancestor.level}): {parentContext.ancestor.boardName} /{' '}
              {parentContext.ancestor.nodeTitle}
            </p>
          ) : null}
        </>
      ) : null}

      <label htmlFor="node-title">Title</label>
      <input id="node-title" type="text" value={draftTitle} onChange={onTitleChange} />
      <FieldError message={titleError} />

      {meaningFields.length > 0 ? (
        meaningFields.map((field) => {
          if (field.kind === 'list') {
            return (
              <ListInput
                key={field.key}
                id={`node-meaning-${field.key}`}
                label={field.label}
                items={parseListText(draftMeaning[field.key])}
                placeholder={field.placeholder}
                onChange={(items) =>
                  syncNodeMeaning({ [field.key]: (items ?? []).join('\n') } as Partial<NodeMeaningDraft>)
                }
              />
            )
          }

          return (
            <div key={field.key}>
              <label htmlFor={`node-meaning-${field.key}`}>{field.label}</label>
              {field.kind === 'textarea' ? (
                <textarea
                  id={`node-meaning-${field.key}`}
                  rows={field.key === 'purpose' ? 3 : 2}
                  value={draftMeaning[field.key]}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    syncNodeMeaning({ [field.key]: event.target.value } as Partial<NodeMeaningDraft>)
                  }
                />
              ) : (
                <input
                  id={`node-meaning-${field.key}`}
                  type="text"
                  value={draftMeaning[field.key]}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    syncNodeMeaning({ [field.key]: event.target.value } as Partial<NodeMeaningDraft>)
                  }
                />
              )}
            </div>
          )
        })
      ) : (
        <p className="node-inspector__helper">
          This node stays lightweight. Add the actual note text in technical details.
        </p>
      )}
    </InspectorSection>
  )
}
