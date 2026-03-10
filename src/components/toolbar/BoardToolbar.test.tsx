import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BoardToolbar } from '@/components/toolbar/BoardToolbar'

describe('BoardToolbar', () => {
  it('renders searchable N1 picker and creates node by click', () => {
    const onCreateNode = vi.fn()

    render(
      <BoardToolbar
        level="N1"
        onCreateNode={onCreateNode}
        onSave={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenImport={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Search semantic blocks'), {
      target: { value: 'database' }
    })

    expect(screen.getByRole('button', { name: 'Add Database' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add System' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add Database' }))

    expect(onCreateNode).toHaveBeenCalledWith('database')
  })

  it('renders searchable N2 picker and creates node by click', () => {
    const onCreateNode = vi.fn()

    render(
      <BoardToolbar
        level="N2"
        onCreateNode={onCreateNode}
        onSave={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenImport={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Search semantic blocks'), {
      target: { value: 'interface' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add Interface' }))
    expect(onCreateNode).toHaveBeenCalledWith('interface')
    expect(screen.queryByRole('button', { name: 'Add System' })).not.toBeInTheDocument()
  })

  it('renders searchable N3 picker and creates node by click', () => {
    const onCreateNode = vi.fn()

    render(
      <BoardToolbar
        level="N3"
        onCreateNode={onCreateNode}
        onSave={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenImport={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Search semantic blocks'), {
      target: { value: 'method' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add Method' }))
    expect(onCreateNode).toHaveBeenCalledWith('method')
    expect(screen.queryByRole('button', { name: 'Add System' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Node type')).not.toBeInTheDocument()
  })
})
