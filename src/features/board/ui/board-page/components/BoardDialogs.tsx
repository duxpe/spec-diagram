import { ExportDialog } from '@/features/transfer/ui/dialogs/ExportDialog'
import { ImportDialog } from '@/features/transfer/ui/dialogs/ImportDialog'
import { NodeCreationDialog } from '@/features/board/ui/components/dialogs/NodeCreationDialog'
import { N3InternalsEditorDialog } from '@/features/board/ui/components/dialogs/N3InternalsEditorDialog'
import { resolveDefaultNodeTitle } from '@/domain/services/board-service'
import type { ExportPromptType, PromptExportBundle } from '@/domain/models/export'
import type { SemanticLevel } from '@/domain/models/board'
import type { SemanticNode } from '@/domain/models/semantic-node'
import type { ConnectionSuggestionState, PendingNodeCreation } from '@/features/board/ui/board-page/types'

interface BoardDialogsProps {
  isExportDialogOpen: boolean
  exportJsonPayload: string
  isExportJsonLoading: boolean
  promptBundle?: PromptExportBundle
  isPromptExportLoading: boolean
  onRequestJsonExport: () => Promise<void>
  onGeneratePromptBundle: (type: ExportPromptType) => Promise<void>
  onDownloadPromptZip: () => Promise<void>
  setExportDialogOpen: (open: boolean) => void
  isImportDialogOpen: boolean
  setImportDialogOpen: (open: boolean) => void
  onImportProject: (jsonInput: string) => Promise<void>
  pendingNodeCreation: PendingNodeCreation | null
  setPendingNodeCreation: (value: PendingNodeCreation | null) => void
  currentBoardLevel?: SemanticLevel
  connectionSuggestionState: ConnectionSuggestionState | null
  setConnectionSuggestionState: (value: ConnectionSuggestionState | null) => void
  completeNodeCreation: (payload: {
    title: string
    description?: string
    meaning: {
      purpose?: string
      role?: string
      summary?: string
      inputs?: string[]
      outputs?: string[]
      constraints?: string[]
      decisionNote?: string
      errorNote?: string
    }
    meaningDraft: {
      title: string
      purpose: string
      role: string
      summary: string
      inputs: string
      outputs: string
      constraints: string
      decisionNote: string
      errorNote: string
    }
  }) => void
  editingInternalsNode?: SemanticNode
  setEditingInternalsNodeId: (value: string | null) => void
  onSaveInternals: (nodeId: string, dataPatch: Record<string, unknown>) => void
  onPersistBoardCommit: () => void
}

export function BoardDialogs({
  isExportDialogOpen,
  exportJsonPayload,
  isExportJsonLoading,
  promptBundle,
  isPromptExportLoading,
  onRequestJsonExport,
  onGeneratePromptBundle,
  onDownloadPromptZip,
  setExportDialogOpen,
  isImportDialogOpen,
  setImportDialogOpen,
  onImportProject,
  pendingNodeCreation,
  setPendingNodeCreation,
  currentBoardLevel,
  connectionSuggestionState,
  setConnectionSuggestionState,
  completeNodeCreation,
  editingInternalsNode,
  setEditingInternalsNodeId,
  onSaveInternals,
  onPersistBoardCommit
}: BoardDialogsProps): JSX.Element {
  return (
    <>
      <ExportDialog
        open={isExportDialogOpen}
        jsonPayload={exportJsonPayload}
        jsonLoading={isExportJsonLoading}
        promptBundle={promptBundle}
        promptLoading={isPromptExportLoading}
        onRequestJson={() => void onRequestJsonExport()}
        onGeneratePrompts={(type) => void onGeneratePromptBundle(type)}
        onDownloadPromptZip={() => void onDownloadPromptZip()}
        onClose={() => setExportDialogOpen(false)}
      />

      <ImportDialog
        open={isImportDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={onImportProject}
      />

      {pendingNodeCreation && currentBoardLevel ? (
        <NodeCreationDialog
          open
          level={currentBoardLevel}
          type={pendingNodeCreation.request.type ?? 'system'}
          defaultTitle={resolveDefaultNodeTitle(
            pendingNodeCreation.request.type ?? 'system',
            pendingNodeCreation.request.patternRole
          )}
          patternRole={pendingNodeCreation.request.patternRole}
          onClose={() => {
            setPendingNodeCreation(null)
            if (connectionSuggestionState) {
              setConnectionSuggestionState(null)
            }
          }}
          onCreate={completeNodeCreation}
        />
      ) : null}

      <N3InternalsEditorDialog
        open={!!editingInternalsNode}
        node={editingInternalsNode}
        onClose={() => setEditingInternalsNodeId(null)}
        onSave={(dataPatch) => {
          if (!editingInternalsNode) return
          onSaveInternals(editingInternalsNode.id, dataPatch)
          onPersistBoardCommit()
          setEditingInternalsNodeId(null)
        }}
      />
    </>
  )
}
