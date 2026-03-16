import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RelationPanel } from '@/features/board/ui/components/panels/RelationPanel'
import { SemanticNode } from '@/domain/models/semantic-node'

const now = new Date().toISOString()

const nodes: SemanticNode[] = [
  {
    id: 'node_db',
    projectId: 'ws_1',
    boardId: 'board_1',
    level: 'N1',
    type: 'database',
    title: 'Database',
    x: 0,
    y: 0,
    width: 220,
    height: 110,
    data: { purpose: 'Store data' },
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'node_api',
    projectId: 'ws_1',
    boardId: 'board_1',
    level: 'N1',
    type: 'container_service',
    title: 'API',
    x: 100,
    y: 100,
    width: 220,
    height: 110,
    data: { responsibility: 'Serve requests' },
    createdAt: now,
    updatedAt: now
  }
]

describe('RelationPanel', () => {
  it('shows only allowed relation types for N1', () => {
    render(<RelationPanel level="N1" nodes={nodes} onCreateRelation={vi.fn()} />)

    const relationTypeSelect = screen.getByLabelText('Type')
    expect(relationTypeSelect).toHaveTextContent('depends on')
    expect(relationTypeSelect).toHaveTextContent('decides')
    expect(relationTypeSelect).not.toHaveTextContent('implements')
  })

  it('shows non-blocking warning for suggested N1 relation restrictions', () => {
    render(<RelationPanel level="N1" nodes={nodes} onCreateRelation={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'node_db' } })
    fireEvent.change(screen.getByLabelText('Target'), { target: { value: 'node_api' } })
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'calls' } })

    expect(screen.getByText(/database usually should not originate/i)).toBeInTheDocument()
  })

  it('shows only N2 relation whitelist when level is N2', () => {
    render(<RelationPanel level="N2" nodes={nodes} onCreateRelation={vi.fn()} />)

    const relationTypeSelect = screen.getByLabelText('Type')
    expect(relationTypeSelect).toHaveTextContent('implements')
    expect(relationTypeSelect).toHaveTextContent('extends')
    expect(relationTypeSelect).not.toHaveTextContent('decides')
    expect(relationTypeSelect).not.toHaveTextContent('writes')
  })

})
