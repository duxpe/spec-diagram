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

  it('renders width/height as integers and normalizes numeric edits', () => {
    const onUpdateNode = vi.fn()

    render(
      <NodeInspector
        node={{ ...baseNode, width: 214.83984375, height: 109.6 }}
        onUpdateNode={onUpdateNode}
        onOpenDetail={vi.fn()}
      />
    )

    const widthInput = screen.getByLabelText('Width')
    const heightInput = screen.getByLabelText('Height')

    expect(widthInput).toHaveValue(215)
    expect(heightInput).toHaveValue(110)

    fireEvent.change(widthInput, { target: { value: '215' } })
    fireEvent.change(heightInput, { target: { value: '110' } })
    expect(onUpdateNode).not.toHaveBeenCalled()

    fireEvent.change(widthInput, { target: { value: '216.2' } })
    fireEvent.change(heightInput, { target: { value: '111.4' } })

    expect(onUpdateNode).toHaveBeenCalledWith('node_1', { width: 216 })
    expect(onUpdateNode).toHaveBeenCalledWith('node_1', { height: 111 })
  })
})
