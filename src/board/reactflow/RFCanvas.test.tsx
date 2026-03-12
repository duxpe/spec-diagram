import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RFCanvas } from '@/board/reactflow/RFCanvas'
import { SemanticNode } from '@/domain/models/semantic-node'
import { Relation } from '@/domain/models/relation'

let lastReactFlowProps: Record<string, unknown> | null = null

vi.mock('@xyflow/react', async () => {
  const React = await import('react')
  return {
    ReactFlow: (props: Record<string, unknown>) => {
      lastReactFlowProps = props
      return <div data-testid="react-flow" />
    },
    Background: () => null,
    MiniMap: () => null,
    useNodesState: (initial: unknown) => {
      const [nodes, setNodes] = React.useState(initial)
      const onNodesChange = () => {}
      return [nodes, setNodes, onNodesChange]
    },
    useEdgesState: (initial: unknown) => {
      const [edges, setEdges] = React.useState(initial)
      const onEdgesChange = () => {}
      return [edges, setEdges, onEdgesChange]
    },
    useReactFlow: () => ({
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      fitView: vi.fn()
    }),
    ConnectionMode: { Loose: 'loose' },
    MarkerType: { ArrowClosed: 'ArrowClosed' }
  }
})

const now = new Date().toISOString()

function makeNode(id: string): SemanticNode {
  return {
    id,
    workspaceId: 'ws_1',
    boardId: 'board_1',
    level: 'N1',
    type: 'system',
    title: 'Node',
    x: 0,
    y: 0,
    width: 220,
    height: 110,
    data: {},
    createdAt: now,
    updatedAt: now
  }
}

describe('RFCanvas domain sync', () => {
  it('syncs updated domain nodes into React Flow', async () => {
    const onCanvasChange = vi.fn()

    const { rerender } = render(
      <RFCanvas
        persistenceKey="test"
        workspaceId="ws_1"
        boardId="board_1"
        level="N1"
        theme="light"
        nodes={[]}
        relations={[] as Relation[]}
        onSelectNode={vi.fn()}
        onCanvasChange={onCanvasChange}
      />
    )

    expect((lastReactFlowProps?.nodes as unknown[] | undefined)?.length ?? 0).toBe(0)

    rerender(
      <RFCanvas
        persistenceKey="test"
        workspaceId="ws_1"
        boardId="board_1"
        level="N1"
        theme="light"
        nodes={[makeNode('node_1')]}
        relations={[] as Relation[]}
        onSelectNode={vi.fn()}
        onCanvasChange={onCanvasChange}
      />
    )

    await waitFor(() => {
      const nodes = lastReactFlowProps?.nodes as { id?: string }[] | undefined
      expect(nodes?.length).toBe(1)
      expect(nodes?.[0]?.id).toBe('node_1')
    })
  })

  it('does not skip domain sync after a no-op canvas callback', async () => {
    const onCanvasChange = vi.fn(() => false)

    const { rerender } = render(
      <RFCanvas
        persistenceKey="test"
        workspaceId="ws_1"
        boardId="board_1"
        level="N1"
        theme="light"
        nodes={[]}
        relations={[] as Relation[]}
        onSelectNode={vi.fn()}
        onCanvasChange={onCanvasChange}
      />
    )

    const onNodesChange = lastReactFlowProps?.onNodesChange as
      | ((changes: Array<Record<string, unknown>>) => void)
      | undefined

    onNodesChange?.([
      {
        id: 'node_nonexistent',
        type: 'dimensions',
        dimensions: { width: 220, height: 110 }
      }
    ])

    await waitFor(() => {
      expect(onCanvasChange).toHaveBeenCalledTimes(1)
    })

    rerender(
      <RFCanvas
        persistenceKey="test"
        workspaceId="ws_1"
        boardId="board_1"
        level="N1"
        theme="light"
        nodes={[makeNode('node_1')]}
        relations={[] as Relation[]}
        onSelectNode={vi.fn()}
        onCanvasChange={onCanvasChange}
      />
    )

    await waitFor(() => {
      const nodes = lastReactFlowProps?.nodes as { id?: string }[] | undefined
      expect(nodes?.length).toBe(1)
      expect(nodes?.[0]?.id).toBe('node_1')
    })
  })

  it('only forwards node clicks for the primary button', () => {
    const onNodeClick = vi.fn()

    render(
      <RFCanvas
        persistenceKey="test"
        workspaceId="ws_1"
        boardId="board_1"
        level="N1"
        theme="light"
        nodes={[makeNode('node_primary')]}
        relations={[] as Relation[]}
        onSelectNode={vi.fn()}
        onCanvasChange={vi.fn()}
        onNodeClick={onNodeClick}
      />
    )

    const fireNodeClick = lastReactFlowProps?.onNodeClick as
      | ((event: { button: number; clientX: number; clientY: number }, node: { data: { semanticId: string } }) => void)
      | undefined

    const rfNode = { id: 'node_primary', type: 'semantic-node', data: { semanticId: 'node_primary' } }

    fireNodeClick?.({ button: 2, clientX: 1, clientY: 2 }, rfNode)
    expect(onNodeClick).not.toHaveBeenCalled()

    fireNodeClick?.({ button: 0, clientX: 10, clientY: 20 }, rfNode)
    expect(onNodeClick).toHaveBeenCalledTimes(1)
    expect(onNodeClick).toHaveBeenCalledWith('node_primary', 10, 20)
  })
})
