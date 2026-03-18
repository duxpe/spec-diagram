import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import * as reactFlowAdapter from '@/features/board/canvas/reactflow-adapter'
import { useRFDomainSync } from '@/features/board/canvas/hooks/useRFDomainSync'

const now = new Date().toISOString()

function makeNode(id: string, patch?: Partial<SemanticNode>): SemanticNode {
  return {
    id,
    projectId: 'ws_1',
    boardId: 'board_1',
    level: 'N2',
    type: 'class',
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

function makeRelation(id: string, sourceNodeId: string, targetNodeId: string): Relation {
  return {
    id,
    projectId: 'ws_1',
    boardId: 'board_1',
    sourceNodeId,
    targetNodeId,
    type: 'implements',
    createdAt: now,
    updatedAt: now
  }
}

describe('useRFDomainSync edge reconciliation', () => {
  function mockAnimationFrame(): void {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not skip real domain relation updates after a canvas-originated change', async () => {
    mockAnimationFrame()

    const nodeA = makeNode('node_a')
    const nodeB = makeNode('node_b', { type: 'interface' })
    const onCanvasChange = vi.fn(() => true)

    const { result, rerender } = renderHook(
      ({
        semanticNodes,
        relations
      }: {
        semanticNodes: SemanticNode[]
        relations: Relation[]
      }) =>
        useRFDomainSync({
          projectId: 'ws_1',
          boardId: 'board_1',
          level: 'N2',
          semanticNodes,
          relations,
          onCanvasChange
        }),
      {
        initialProps: {
          semanticNodes: [nodeA, nodeB],
          relations: [] as Relation[]
        }
      }
    )

    expect(result.current.edges).toHaveLength(0)

    act(() => {
      result.current.handleNodesChange([
        {
          id: 'node_a',
          type: 'position',
          position: { x: 20, y: 10 },
          dragging: false
        } as never
      ])
    })

    await waitFor(() => {
      expect(onCanvasChange).toHaveBeenCalled()
    })

    rerender({
      semanticNodes: [nodeA, nodeB],
      relations: [makeRelation('rel_ab', 'node_a', 'node_b')]
    })

    await waitFor(() => {
      expect(result.current.edges).toHaveLength(1)
    })
  })

  it('does not emit canvas persistence while node drag is still active', async () => {
    mockAnimationFrame()

    const onCanvasChange = vi.fn(() => true)
    const semanticNodes = [makeNode('node_a')]
    const relations: Relation[] = []

    const { result } = renderHook(() =>
      useRFDomainSync({
        projectId: 'ws_1',
        boardId: 'board_1',
        level: 'N2',
        semanticNodes,
        relations,
        onCanvasChange
      })
    )

    act(() => {
      result.current.handleNodesChange([
        {
          id: 'node_a',
          type: 'position',
          position: { x: 20, y: 10 },
          dragging: true
        } as never
      ])
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(onCanvasChange).not.toHaveBeenCalled()
  })

  it('emits canvas persistence when drag ends', async () => {
    mockAnimationFrame()

    const onCanvasChange = vi.fn(() => true)
    const semanticNodes = [makeNode('node_a')]
    const relations: Relation[] = []

    const { result } = renderHook(() =>
      useRFDomainSync({
        projectId: 'ws_1',
        boardId: 'board_1',
        level: 'N2',
        semanticNodes,
        relations,
        onCanvasChange
      })
    )

    act(() => {
      result.current.handleNodesChange([
        {
          id: 'node_a',
          type: 'position',
          position: { x: 20, y: 10 },
          dragging: false
        } as never
      ])
    })

    await waitFor(() => {
      expect(onCanvasChange).toHaveBeenCalledTimes(1)
    })
  })

  it('defers domain-edge reconciliation until drag end when updates arrive mid-drag', async () => {
    mockAnimationFrame()

    const nodeA = makeNode('node_a')
    const nodeB = makeNode('node_b', { type: 'interface' })
    const onCanvasChange = vi.fn(() => true)

    const { result, rerender } = renderHook(
      ({
        semanticNodes,
        relations
      }: {
        semanticNodes: SemanticNode[]
        relations: Relation[]
      }) =>
        useRFDomainSync({
          projectId: 'ws_1',
          boardId: 'board_1',
          level: 'N2',
          semanticNodes,
          relations,
          onCanvasChange
        }),
      {
        initialProps: {
          semanticNodes: [nodeA, nodeB],
          relations: [] as Relation[]
        }
      }
    )

    act(() => {
      result.current.handleNodesChange([
        {
          id: 'node_a',
          type: 'position',
          position: { x: 50, y: 10 },
          dragging: true
        } as never
      ])
    })

    rerender({
      semanticNodes: [nodeA, nodeB],
      relations: [makeRelation('rel_ab', 'node_a', 'node_b')]
    })

    expect(result.current.edges).toHaveLength(0)

    act(() => {
      result.current.handleNodesChange([
        {
          id: 'node_a',
          type: 'position',
          position: { x: 55, y: 12 },
          dragging: false
        } as never
      ])
    })

    await waitFor(() => {
      expect(result.current.edges).toHaveLength(1)
    })
  })

  it('does not remap domain nodes when only context-menu callback identity changes', async () => {
    mockAnimationFrame()

    const nodeA = makeNode('node_a')
    const toRFNodesSpy = vi.spyOn(reactFlowAdapter, 'toRFNodes')
    const onCanvasChange = vi.fn(() => true)
    const semanticNodes = [nodeA]
    const relations: Relation[] = []

    const { rerender } = renderHook(
      ({
        onNodeContextMenu
      }: {
        onNodeContextMenu?: (nodeId: string, screenX: number, screenY: number) => void
      }) =>
        useRFDomainSync({
          projectId: 'ws_1',
          boardId: 'board_1',
          level: 'N2',
          semanticNodes,
          relations,
          onCanvasChange,
          onNodeContextMenu
        }),
      {
        initialProps: {
          onNodeContextMenu: vi.fn()
        }
      }
    )

    await act(async () => {
      await Promise.resolve()
    })
    toRFNodesSpy.mockClear()

    rerender({
      onNodeContextMenu: vi.fn()
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(toRFNodesSpy).not.toHaveBeenCalled()
  })
})
