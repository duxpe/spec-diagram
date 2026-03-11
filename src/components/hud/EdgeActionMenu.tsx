import { useEffect, useRef } from 'react'
import { Pencil, ArrowLeftRight, Trash2 } from 'lucide-react'

interface EdgeActionMenuProps {
  position: { x: number; y: number }
  onEdit: () => void
  onReverse: () => void
  onDelete: () => void
  onClose: () => void
}

export function EdgeActionMenu({
  position,
  onEdit,
  onReverse,
  onDelete,
  onClose
}: EdgeActionMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="edge-action-menu"
      style={{ left: position.x, top: position.y }}
    >
      <button type="button" className="edge-action-menu__btn" onClick={onEdit}>
        <Pencil size={14} />
        Edit
      </button>
      <button type="button" className="edge-action-menu__btn" onClick={onReverse}>
        <ArrowLeftRight size={14} />
        Reverse direction
      </button>
      <button type="button" className="edge-action-menu__btn edge-action-menu__btn--danger" onClick={onDelete}>
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  )
}
