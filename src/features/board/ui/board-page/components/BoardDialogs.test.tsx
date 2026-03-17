import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BoardDialogs } from '@/features/board/ui/board-page/components/BoardDialogs'

const now = new Date().toISOString()

describe('BoardDialogs', () => {
  it('persists board after saving N3 internals', () => {
    const onSaveInternals = vi.fn()
    const onPersistBoardCommit = vi.fn()
    const setEditingInternalsNodeId = vi.fn()

    render(
      <BoardDialogs
        isExportDialogOpen={false}
        exportJsonPayload=""
        isExportJsonLoading={false}
        promptBundle={undefined}
        isPromptExportLoading={false}
        onRequestJsonExport={async () => {}}
        onGeneratePromptBundle={async () => {}}
        onDownloadPromptZip={async () => {}}
        setExportDialogOpen={vi.fn()}
        isImportDialogOpen={false}
        setImportDialogOpen={vi.fn()}
        onImportProject={async () => {}}
        pendingNodeCreation={null}
        setPendingNodeCreation={vi.fn()}
        currentBoardLevel="N2"
        connectionSuggestionState={null}
        setConnectionSuggestionState={vi.fn()}
        completeNodeCreation={vi.fn()}
        editingInternalsNode={{
          id: 'node_1',
          projectId: 'ws_1',
          boardId: 'board_1',
          level: 'N2',
          type: 'class',
          title: 'AccountService',
          x: 10,
          y: 10,
          width: 220,
          height: 110,
          data: { responsibility: 'Handle account lifecycle' },
          createdAt: now,
          updatedAt: now
        }}
        setEditingInternalsNodeId={setEditingInternalsNodeId}
        onSaveInternals={onSaveInternals}
        onPersistBoardCommit={onPersistBoardCommit}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSaveInternals).toHaveBeenCalledWith(
      'node_1',
      expect.objectContaining({
        responsibility: 'Handle account lifecycle',
        internals: expect.objectContaining({
          methods: [],
          attributes: []
        })
      })
    )
    expect(onPersistBoardCommit).toHaveBeenCalledTimes(1)
    expect(setEditingInternalsNodeId).toHaveBeenCalledWith(null)
  })
})
