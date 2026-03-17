import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PatternSelectionDialog } from '@/features/project/ui/components/PatternSelectionDialog'
import type { Project } from '@/domain/models/project'

const now = new Date().toISOString()

const baseProject: Project = {
  id: 'project_1',
  name: 'Payments',
  rootBoardId: 'board_1',
  boardIds: ['board_1'],
  architecturePattern: 'microservices',
  createdAt: now,
  updatedAt: now
}

describe('PatternSelectionDialog', () => {
  it('hides pattern selection controls in edit mode and keeps project type read-only', () => {
    const onSubmit = vi.fn()

    render(
      <PatternSelectionDialog
        open
        mode="edit"
        initialProject={baseProject}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    )

    expect(screen.getByLabelText('Project type')).toHaveValue('Microservices')
    expect(screen.getByLabelText('Project type')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    expect(screen.queryByText('Hexagonal Architecture')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save project' }))

    expect(onSubmit).toHaveBeenCalledWith(
      'Payments',
      undefined,
      'microservices',
      undefined
    )
  })
})
