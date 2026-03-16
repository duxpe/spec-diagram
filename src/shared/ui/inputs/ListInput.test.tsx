import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ListInput } from '@/shared/ui/inputs/ListInput'

describe('ListInput', () => {
  it('renders one empty row by default', () => {
    render(<ListInput id="items" label="Items" onChange={vi.fn()} />)

    const input = screen.getByLabelText('Items') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.value).toBe('')
  })

  it('adds a row when clicking add', () => {
    render(<ListInput id="items" label="Items" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))

    expect(screen.getAllByRole('textbox', { name: /Items/ })).toHaveLength(2)
  })

  it('removes a row or clears the last row', () => {
    const onChange = vi.fn()

    const { rerender } = render(
      <ListInput id="items" label="Items" items={['First', 'Second']} onChange={onChange} />
    )

    const removeButtons = screen.getAllByRole('button', { name: /Remove Items/ })
    expect(removeButtons).toHaveLength(2)
    fireEvent.click(removeButtons[1] as HTMLElement)
    expect(onChange).toHaveBeenLastCalledWith(['First'])

    rerender(<ListInput id="items" label="Items" items={['Only']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /Remove Items/ }))

    const input = screen.getByLabelText('Items') as HTMLInputElement
    expect(input.value).toBe('')
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })

  it('emits trimmed non-empty items', () => {
    const onChange = vi.fn()

    render(<ListInput id="items" label="Items" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Items'), {
      target: { value: '  Alpha  ' }
    })

    expect(onChange).toHaveBeenLastCalledWith(['Alpha'])
  })
})
