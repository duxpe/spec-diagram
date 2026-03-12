import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { N3InternalsEditorDialog } from '@/components/dialogs/N3InternalsEditorDialog'

const now = new Date().toISOString()

function baseNode() {
  return {
    id: 'node_1',
    workspaceId: 'ws_1',
    boardId: 'board_1',
    level: 'N2' as const,
    x: 10,
    y: 10,
    width: 220,
    height: 110,
    createdAt: now,
    updatedAt: now
  }
}

describe('N3InternalsEditorDialog', () => {
  it('creates and saves class method internals with row note', () => {
    const onSave = vi.fn()

    render(
      <N3InternalsEditorDialog
        open
        node={{
          ...baseNode(),
          type: 'class',
          title: 'AccountService',
          data: { responsibility: 'Handle account lifecycle' }
        }}
        onClose={vi.fn()}
        onSave={onSave}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add method' }))

    const rows = screen.getAllByRole('row')
    const firstBodyRow = rows[1]
    const inputs = within(firstBodyRow as HTMLElement).getAllByRole('textbox')

    fireEvent.change(inputs[0] as HTMLElement, { target: { value: 'Result<Account>' } })
    fireEvent.change(inputs[1] as HTMLElement, { target: { value: 'execute' } })
    fireEvent.change(inputs[2] as HTMLElement, { target: { value: 'input: ExecuteCommand' } })

    fireEvent.click(within(firstBodyRow as HTMLElement).getByRole('button', { name: 'Add note' }))
    fireEvent.change(screen.getByPlaceholderText('Add implementation notes for this row'), {
      target: { value: 'Validates command before execution.' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }))

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        responsibility: 'Handle account lifecycle',
        internals: {
          methods: [
            {
              returnType: 'Result<Account>',
              name: 'execute',
              parameters: 'input: ExecuteCommand',
              note: 'Validates command before execution.'
            }
          ],
          attributes: []
        }
      })
    )
  })

  it('reorders class methods before save', () => {
    const onSave = vi.fn()

    render(
      <N3InternalsEditorDialog
        open
        node={{
          ...baseNode(),
          type: 'class',
          title: 'AccountService',
          data: {
            responsibility: 'Handle account lifecycle',
            internals: {
              methods: [
                { returnType: 'void', name: 'second', parameters: 'id: UUID' },
                { returnType: 'void', name: 'first', parameters: 'id: UUID' }
              ]
            }
          }
        }}
        onClose={vi.fn()}
        onSave={onSave}
      />
    )

    const moveButtons = screen.getAllByRole('button', { name: 'Move method up' })
    fireEvent.click(moveButtons[1] as HTMLElement)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        internals: expect.objectContaining({
          methods: [
            expect.objectContaining({ name: 'first' }),
            expect.objectContaining({ name: 'second' })
          ]
        })
      })
    )
  })

  it('saves api contract endpoint internals and preserves contract fields', () => {
    const onSave = vi.fn()

    render(
      <N3InternalsEditorDialog
        open
        node={{
          ...baseNode(),
          type: 'api_contract',
          title: 'Account API',
          data: {
            kind: 'http',
            inputSummary: ['account id'],
            outputSummary: ['account data']
          }
        }}
        onClose={vi.fn()}
        onSave={onSave}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add endpoint' }))

    const endpointRows = screen.getAllByRole('row')
    const endpointRow = endpointRows[1]
    const endpointInputs = within(endpointRow as HTMLElement).getAllByRole('textbox')
    fireEvent.change(endpointInputs[0] as HTMLElement, { target: { value: '/accounts/{id}' } })
    fireEvent.change(endpointInputs[1] as HTMLElement, { target: { value: 'path param + json body' } })
    fireEvent.change(endpointInputs[2] as HTMLElement, { target: { value: 'application/json' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'http',
        inputSummary: ['account id'],
        outputSummary: ['account data'],
        internals: {
          endpoints: [
            expect.objectContaining({
              httpMethod: 'GET',
              url: '/accounts/{id}',
              requestFormat: 'path param + json body',
              responseFormat: 'application/json'
            })
          ]
        }
      })
    )
  })
})
