import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NodeCreationDialog } from '@/components/dialogs/NodeCreationDialog'

describe('NodeCreationDialog', () => {
  it('lets users skip the semantic form and define details later', () => {
    const onCreate = vi.fn()

    render(
      <NodeCreationDialog
        open
        level="N1"
        type="system"
        defaultTitle="System"
        onClose={vi.fn()}
        onCreate={onCreate}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Define details later' }))

    expect(onCreate).toHaveBeenCalledWith({
      title: 'System',
      description: undefined,
      meaning: {
        purpose: undefined,
        primaryResponsibility: undefined,
        role: undefined,
        summary: undefined,
        inputs: undefined,
        outputs: undefined,
        constraints: undefined,
        decisionNote: undefined,
        errorNote: undefined
      },
      meaningDraft: expect.objectContaining({
        title: 'System'
      })
    })
  })
})
