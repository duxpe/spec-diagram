import { FormEvent, useState } from 'react'

interface WorkspaceToolbarProps {
  onCreateWorkspace: (name: string, description?: string) => Promise<void>
}

export function WorkspaceToolbar({ onCreateWorkspace }: WorkspaceToolbarProps): JSX.Element {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    await onCreateWorkspace(trimmedName, description.trim() || undefined)
    setName('')
    setDescription('')
  }

  return (
    <form className="workspace-toolbar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Project name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <button type="submit" data-ui-log="Workspace toolbar – Create project">
        Create project
      </button>
    </form>
  )
}
