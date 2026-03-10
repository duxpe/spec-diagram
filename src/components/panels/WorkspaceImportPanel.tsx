import { ChangeEvent, useState } from 'react'

interface WorkspaceImportPanelProps {
  onImport: (jsonInput: string) => Promise<void>
}

export function WorkspaceImportPanel({ onImport }: WorkspaceImportPanelProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const content = await file.text()
      await onImport(content)
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  return (
    <label className="workspace-import">
      <input type="file" accept="application/json" onChange={handleChange} disabled={isLoading} />
      <span>{isLoading ? 'Importing...' : 'Import workspace JSON'}</span>
    </label>
  )
}
