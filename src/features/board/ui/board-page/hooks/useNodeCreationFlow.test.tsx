import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useNodeCreationFlow } from '@/features/board/ui/board-page/hooks/useNodeCreationFlow'

const baseMeaningDraft = {
  title: 'Node',
  purpose: 'Purpose',
  role: 'Role',
  summary: 'Summary',
  inputs: 'input',
  outputs: 'output',
  constraints: 'constraint',
  decisionNote: '',
  errorNote: ''
}

describe('useNodeCreationFlow', () => {
  it('persists board after immediate note-node creation', () => {
    const createNode = vi.fn(() => ({ id: 'node_1' }))
    const createRelation = vi.fn()
    const onNodeSelect = vi.fn()
    const setConnectionSuggestionState = vi.fn()
    const persistCurrentBoard = vi.fn()

    const { result } = renderHook(() =>
      useNodeCreationFlow({
        currentBoardId: 'board_1',
        boardId: 'board_1',
        createNode: createNode as never,
        createRelation: createRelation as never,
        persistCurrentBoard,
        onNodeSelect,
        setConnectionSuggestionState
      })
    )

    act(() => {
      result.current.handleCreateNode({ type: 'free_note_input' })
    })

    expect(createNode).toHaveBeenCalledTimes(1)
    expect(onNodeSelect).toHaveBeenCalledWith('node_1')
    expect(persistCurrentBoard).toHaveBeenCalledTimes(1)
  })

  it('persists board after completed dialog-driven node creation', () => {
    const createNode = vi.fn(() => ({ id: 'node_2' }))
    const createRelation = vi.fn()
    const onNodeSelect = vi.fn()
    const setConnectionSuggestionState = vi.fn()
    const persistCurrentBoard = vi.fn()

    const { result } = renderHook(() =>
      useNodeCreationFlow({
        currentBoardId: 'board_1',
        boardId: 'board_1',
        createNode: createNode as never,
        createRelation: createRelation as never,
        persistCurrentBoard,
        onNodeSelect,
        setConnectionSuggestionState
      })
    )

    act(() => {
      result.current.handleCreateNode({ type: 'system' })
    })

    act(() => {
      result.current.completeNodeCreation({
        title: 'System node',
        description: 'Node description',
        meaning: { purpose: 'Purpose' },
        meaningDraft: baseMeaningDraft
      })
    })

    expect(createNode).toHaveBeenCalledTimes(1)
    expect(onNodeSelect).toHaveBeenCalledWith('node_2')
    expect(persistCurrentBoard).toHaveBeenCalledTimes(1)
  })
})
