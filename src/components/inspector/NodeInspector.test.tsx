import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NodeInspector } from '@/components/inspector/NodeInspector'

const baseNode = {
  id: 'node_1',
  workspaceId: 'ws_1',
  boardId: 'board_1',
  level: 'N1' as const,
  type: 'system' as const,
  title: 'Catalog',
  x: 10,
  y: 10,
  width: 200,
  height: 100,
  data: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

describe('NodeInspector', () => {
  it('renders empty state when node is not selected', () => {
    render(
      <NodeInspector
        node={undefined}
        onUpdateNode={vi.fn()}
        onOpenDetail={vi.fn()}
      />
    )

    expect(screen.getByText(/Select a node to edit properties/i)).toBeInTheDocument()
  })

  it('emits title updates', () => {
    const onUpdateNode = vi.fn()

    render(
      <NodeInspector node={baseNode} onUpdateNode={onUpdateNode} onOpenDetail={vi.fn()} />
    )

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Billing Service' } })

    expect(onUpdateNode).toHaveBeenCalledWith('node_1', { title: 'Billing Service' })
  })
})
