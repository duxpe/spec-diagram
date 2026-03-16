import { useState } from 'react'
import type { ExportPromptType, PromptExportBundle } from '@/domain/models/export'
import { buildPromptZipFileName, createPromptZipBlob } from '@/features/transfer/model/prompt-export-service'

interface UseTransferActionsInput {
  projectId: string
  exportProject: (projectId: string) => Promise<string>
  generateProjectPromptBundle: (
    projectId: string,
    exportType: ExportPromptType
  ) => Promise<PromptExportBundle>
  importProject: (jsonInput: string) => Promise<{ id: string; rootBoardId: string }>
  onImportSuccess: (projectId: string, rootBoardId: string) => void
  setImportDialogOpen: (open: boolean) => void
  setExportDialogOpen: (open: boolean) => void
}

export function useTransferActions({
  projectId,
  exportProject,
  generateProjectPromptBundle,
  importProject,
  onImportSuccess,
  setImportDialogOpen,
  setExportDialogOpen
}: UseTransferActionsInput) {
  const [exportJsonPayload, setExportJsonPayload] = useState('')
  const [isExportJsonLoading, setIsExportJsonLoading] = useState(false)
  const [promptBundle, setPromptBundle] = useState<PromptExportBundle>()
  const [isPromptExportLoading, setIsPromptExportLoading] = useState(false)

  const handleOpenExport = (): void => {
    setExportJsonPayload('')
    setPromptBundle(undefined)
    setIsExportJsonLoading(false)
    setIsPromptExportLoading(false)
    setExportDialogOpen(true)
  }

  const handleRequestJsonExport = async (): Promise<void> => {
    if (isExportJsonLoading || exportJsonPayload) return

    setIsExportJsonLoading(true)
    try {
      const payload = await exportProject(projectId)
      setExportJsonPayload(payload)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to export project')
    } finally {
      setIsExportJsonLoading(false)
    }
  }

  const handleGeneratePromptBundle = async (exportType: ExportPromptType): Promise<void> => {
    setIsPromptExportLoading(true)
    try {
      const bundle = await generateProjectPromptBundle(projectId, exportType)
      setPromptBundle(bundle)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to generate prompt export')
    } finally {
      setIsPromptExportLoading(false)
    }
  }

  const handleDownloadPromptZip = async (): Promise<void> => {
    if (!promptBundle) return

    try {
      const blob = await createPromptZipBlob(promptBundle)
      const fileName = buildPromptZipFileName(promptBundle)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to download prompt ZIP')
    }
  }

  const handleImportProject = async (jsonInput: string): Promise<void> => {
    try {
      const importedProject = await importProject(jsonInput)
      setImportDialogOpen(false)
      onImportSuccess(importedProject.id, importedProject.rootBoardId)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to import project')
    }
  }

  return {
    exportJsonPayload,
    isExportJsonLoading,
    promptBundle,
    isPromptExportLoading,
    handleOpenExport,
    handleRequestJsonExport,
    handleGeneratePromptBundle,
    handleDownloadPromptZip,
    handleImportProject
  }
}
