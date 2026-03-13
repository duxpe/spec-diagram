import { fireEvent, render, screen, within } from '@testing-library/react'
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
  data: {
    goal: 'Define system goal',
    primaryResponsibilities: ['Provide orchestration']
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

describe('NodeInspector', () => {
  it('renders empty state when node is not selected', () => {
    render(<NodeInspector node={undefined} onUpdateNode={vi.fn()} onOpenDetail={vi.fn()} />)

    expect(screen.getByText(/Select a node to edit properties/i)).toBeInTheDocument()
  })

  it('emits title updates', () => {
    const onUpdateNode = vi.fn()

    render(<NodeInspector node={baseNode} onUpdateNode={onUpdateNode} onOpenDetail={vi.fn()} />)

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

  it('syncs N1 meaning edits into the technical payload without duplicate fields', () => {
    const onUpdateNode = vi.fn()

    render(<NodeInspector node={baseNode} onUpdateNode={onUpdateNode} onOpenDetail={vi.fn()} />)

    expect(screen.queryByLabelText('Goal')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Primary responsibilities')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Purpose / why it exists'), {
      target: { value: 'Clarify the business goal' }
    })

    expect(onUpdateNode).toHaveBeenCalledWith('node_1', {
      meaning: {
        purpose: 'Clarify the business goal',
        primaryResponsibility: undefined,
        role: undefined,
        summary: undefined,
        inputs: undefined,
        outputs: undefined,
        constraints: undefined,
        decisionNote: undefined,
        errorNote: undefined
      },
      description: 'Clarify the business goal',
      data: {
        goal: 'Clarify the business goal',
        primaryResponsibilities: ['Provide orchestration']
      }
    })
  })

  it('hides open detail for non-eligible N1 node types', () => {
    render(
      <NodeInspector
        node={{
          ...baseNode,
          type: 'decision',
          data: { decision: 'Use queue-based integration' }
        }}
        onUpdateNode={vi.fn()}
        onOpenDetail={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: 'Open detail' })).not.toBeInTheDocument()
  })

  it('renders N2 class fields and persists valid class payload', () => {
    const onUpdateNode = vi.fn()
    const onEditInternals = vi.fn()

    render(
      <NodeInspector
        node={{
          ...baseNode,
          level: 'N2',
          type: 'class',
          data: { responsibility: 'Manage state transitions' }
        }}
        parentContext={{
          immediate: { level: 'N1', boardName: 'Root Board', nodeTitle: 'Billing Service' }
        }}
        onUpdateNode={onUpdateNode}
        onOpenDetail={vi.fn()}
        onEditInternals={onEditInternals}
      />
    )

    expect(screen.getByText(/Parent \(N1\): Root Board \/ Billing Service/i)).toBeInTheDocument()

    expect(screen.queryByLabelText('Responsibility')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Stereotypes (one per line)'), {
      target: { value: 'Aggregate root' }
    })

    expect(onUpdateNode).toHaveBeenCalledWith('node_1', {
      data: {
        responsibility: 'Manage state transitions',
        stereotypes: ['Aggregate root']
      }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit internals' }))
    expect(onEditInternals).toHaveBeenCalledWith('node_1')
    expect(screen.queryByRole('button', { name: 'Open detail' })).not.toBeInTheDocument()
  })

  it('keeps contract inputs and outputs in meaning instead of duplicating them in technical details', () => {
    render(
      <NodeInspector
        node={{
          ...baseNode,
          level: 'N2',
          type: 'api_contract',
          data: {
            kind: 'http',
            inputSummary: ['account id'],
            outputSummary: ['account']
          }
        }}
        onUpdateNode={vi.fn()}
        onOpenDetail={vi.fn()}
      />
    )

    expect(screen.getByLabelText('High-level inputs')).toBeInTheDocument()
    expect(screen.getByLabelText('High-level outputs')).toBeInTheDocument()
    expect(screen.queryByLabelText('Input summary (one per line)')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Output summary (one per line)')).not.toBeInTheDocument()
  })

  it('hides open detail for non-eligible N2 notes', () => {
    render(
      <NodeInspector
        node={{
          ...baseNode,
          level: 'N2',
          type: 'free_note_input',
          data: { expectedInputsText: 'incoming payload shape' }
        }}
        onUpdateNode={vi.fn()}
        onOpenDetail={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: 'Open detail' })).not.toBeInTheDocument()
  })

  it('renders N3 method fields, parent chain, and persists valid payload', () => {
    const onUpdateNode = vi.fn()

    render(
      <NodeInspector
        node={{
          ...baseNode,
          level: 'N3',
          type: 'method',
          data: {
            signature: 'execute(input): output',
            purpose: 'Process command'
          }
        }}
        parentContext={{
          immediate: { level: 'N2', boardName: 'Billing detail', nodeTitle: 'AccountService' },
          ancestor: { level: 'N1', boardName: 'Root Board', nodeTitle: 'Billing' }
        }}
        onUpdateNode={onUpdateNode}
        onOpenDetail={vi.fn()}
      />
    )

    expect(screen.getByText(/Parent \(N2\): Billing detail \/ AccountService/i)).toBeInTheDocument()
    expect(screen.getByText(/Ancestor \(N1\): Root Board \/ Billing/i)).toBeInTheDocument()

    expect(screen.queryByLabelText('Signature')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Purpose / why it exists'), {
      target: { value: 'Handle account lifecycle command' }
    })

    expect(onUpdateNode).toHaveBeenCalledWith('node_1', {
      meaning: {
        purpose: 'Handle account lifecycle command',
        primaryResponsibility: undefined,
        role: undefined,
        summary: undefined,
        inputs: undefined,
        outputs: undefined,
        constraints: undefined,
        decisionNote: undefined,
        errorNote: undefined
      },
      description: 'Handle account lifecycle command',
      data: {
        signature: 'execute(input): output',
        purpose: 'Handle account lifecycle command'
      }
    })
    expect(screen.queryByRole('button', { name: 'Open detail' })).not.toBeInTheDocument()
  })

  it('keeps free notes lightweight in the meaning section', () => {
    render(
      <NodeInspector
        node={{
          ...baseNode,
          level: 'N2',
          type: 'free_note_input',
          data: {
            expectedInputsText: 'Incoming payload'
          }
        }}
        onUpdateNode={vi.fn()}
        onOpenDetail={vi.fn()}
      />
    )

    expect(screen.getByText('This node stays lightweight. Add the actual note text in technical details.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Purpose / why it exists')).not.toBeInTheDocument()
  })

  it('renders appearance controls and persists valid appearance changes', () => {
    const onUpdateNode = vi.fn()

    render(<NodeInspector node={baseNode} onUpdateNode={onUpdateNode} onOpenDetail={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Editar Aparência' }))
    const appearanceDialog = screen.getByRole('dialog', { name: 'Aparência' })

    fireEvent.change(within(appearanceDialog).getByLabelText('Provider visual'), { target: { value: 'aws' } })
    expect(onUpdateNode).toHaveBeenCalledWith('node_1', {
      appearance: {
        provider: 'aws',
        providerService: undefined
      }
    })

    const iconTab = within(appearanceDialog).getByRole('tab', { name: 'Icon' })
    fireEvent.click(iconTab)
    expect(iconTab).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(within(appearanceDialog).getByRole('button', { name: 'Lambda' }))
    expect(onUpdateNode).toHaveBeenCalledWith('node_1', {
      appearance: {
        provider: 'aws',
        providerService: 'aws_lambda'
      }
    })
  })

  it('resets node appearance to defaults', () => {
    const onUpdateNode = vi.fn()

    render(
      <NodeInspector
        node={{
          ...baseNode,
          appearance: {
            provider: 'aws',
            providerService: 'aws_lambda',
            showProviderBadge: true
          }
        }}
        onUpdateNode={onUpdateNode}
        onOpenDetail={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Editar Aparência' }))
    const appearanceDialog = screen.getByRole('dialog', { name: 'Aparência' })
    fireEvent.click(within(appearanceDialog).getByRole('button', { name: 'Reset visual' }))
    expect(onUpdateNode).toHaveBeenCalledWith('node_1', { appearance: undefined })
  })
})
