import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PromptExportBundle } from '@/domain/models/export'
import { ExportDialog } from '@/components/dialogs/ExportDialog'

const promptBundle: PromptExportBundle = {
  workspaceId: 'ws_1',
  workspaceName: 'Workspace',
  exportType: 'spec_prompt',
  exportedAt: '2026-03-10T00:00:00.000Z',
  items: [
    {
      rootNodeId: 'node_1',
      rootNodeTitle: 'Payments Service',
      rootNodeType: 'system',
      filename: '01-payments-service-spec_prompt.md',
      markdown: '# Prompt content'
    }
  ]
}

describe('ExportDialog', () => {
  it('requests JSON payload on open when JSON tab is active', async () => {
    const onRequestJson = vi.fn()

    render(
      <ExportDialog
        open
        jsonPayload=""
        jsonLoading={false}
        promptLoading={false}
        onClose={vi.fn()}
        onRequestJson={onRequestJson}
        onGeneratePrompts={vi.fn()}
        onDownloadPromptZip={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(onRequestJson).toHaveBeenCalledTimes(1)
    })
  })

  it('generates prompts for selected export type', () => {
    const onGeneratePrompts = vi.fn()

    render(
      <ExportDialog
        open
        jsonPayload="{}"
        jsonLoading={false}
        promptLoading={false}
        onClose={vi.fn()}
        onRequestJson={vi.fn()}
        onGeneratePrompts={onGeneratePrompts}
        onDownloadPromptZip={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Prompts (Markdown)' }))
    fireEvent.change(screen.getByLabelText('Prompt type'), {
      target: { value: 'task_prompt' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Generate prompts' }))

    expect(onGeneratePrompts).toHaveBeenCalledWith('task_prompt')
  })

  it('renders prompt previews and enables zip download when bundle is available', () => {
    const onDownloadPromptZip = vi.fn()

    render(
      <ExportDialog
        open
        jsonPayload="{}"
        jsonLoading={false}
        promptBundle={promptBundle}
        promptLoading={false}
        onClose={vi.fn()}
        onRequestJson={vi.fn()}
        onGeneratePrompts={vi.fn()}
        onDownloadPromptZip={onDownloadPromptZip}
      />
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Prompts (Markdown)' }))

    expect(screen.getByText('Payments Service')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Download ZIP' }))

    expect(onDownloadPromptZip).toHaveBeenCalledTimes(1)
  })
})
