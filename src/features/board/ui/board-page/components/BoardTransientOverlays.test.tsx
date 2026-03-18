import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BoardTransientOverlays } from '@/features/board/ui/board-page/components/BoardTransientOverlays'
import type { SemanticNode } from '@/domain/models/semantic-node'

const now = new Date().toISOString()

function makeNode(id: string, patch?: Partial<SemanticNode>): SemanticNode {
  return {
    id,
    projectId: 'ws_1',
    boardId: 'board_1',
    level: 'N1',
    type: 'system',
    title: id,
    x: 10,
    y: 10,
    width: 220,
    height: 110,
    data: {},
    createdAt: now,
    updatedAt: now,
    ...patch
  }
}

function renderOverlay(
  node: SemanticNode,
  callbacks: {
    onOpen: ReturnType<typeof vi.fn>
    onEdit: ReturnType<typeof vi.fn>
    onClose: ReturnType<typeof vi.fn>
    onDuplicate?: ReturnType<typeof vi.fn>
    onSelect?: ReturnType<typeof vi.fn>
    onPersist?: ReturnType<typeof vi.fn>
  }
) {
  return render(
    <BoardTransientOverlays
      selectedNodeId={node.id}
      selectedNode={node}
      nodeMenuPos={{ x: 40, y: 40 }}
      appearanceDialogNodeId={undefined}
      onCloseNodeMenu={callbacks.onClose}
      onDeleteSelectedNode={vi.fn()}
      onDuplicateSelectedNode={callbacks.onDuplicate ?? vi.fn(async () => {})}
      onOpenSelectedDetail={callbacks.onOpen}
      onEditSelectedInternals={callbacks.onEdit}
      edgeMenuState={null}
      setEdgeMenuState={vi.fn()}
      editingRelationId={null}
      setEditingRelationId={vi.fn()}
      relations={[]}
      nodes={[node]}
      currentBoardLevel={node.level}
      architecturePattern={undefined}
      updateRelation={vi.fn()}
      reverseRelation={vi.fn()}
      deleteRelation={vi.fn()}
      connectionSuggestionState={null}
      setConnectionSuggestionState={vi.fn()}
      createNode={vi.fn()}
      createRelation={vi.fn()}
      handleNodeSelect={callbacks.onSelect ?? vi.fn()}
      setPendingNodeCreation={vi.fn()}
      pendingRelation={null}
      setPendingRelation={vi.fn()}
    />
  )
}

describe('BoardTransientOverlays node context menu', () => {
  it('uses Edit internals shortcut for eligible N2 nodes', () => {
    const onOpen = vi.fn()
    const onEdit = vi.fn()
    const onClose = vi.fn()

    renderOverlay(
      makeNode('node_n2', {
        level: 'N2',
        type: 'class'
      }),
      { onOpen, onEdit, onClose }
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit internals' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('keeps Open detail board shortcut for N1 nodes', () => {
    const onOpen = vi.fn()
    const onEdit = vi.fn()
    const onClose = vi.fn()

    renderOverlay(makeNode('node_n1'), { onOpen, onEdit, onClose })

    fireEvent.click(screen.getByRole('button', { name: 'Open detail board' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('invokes duplicate callback from context menu shortcut', async () => {
    const onOpen = vi.fn()
    const onEdit = vi.fn()
    const onClose = vi.fn()
    const onDuplicate = vi.fn(async () => {})

    renderOverlay(makeNode('node_n1'), { onOpen, onEdit, onClose, onDuplicate })

    fireEvent.click(screen.getByRole('button', { name: 'Duplicate node' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onDuplicate).toHaveBeenCalledTimes(1)
  })
})
