import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

interface ListInputProps {
  id: string
  label: string
  items?: string[]
  onChange: (items?: string[]) => void
  placeholder?: string
  addLabel?: string
}

function normalizeItems(items?: string[]): string[] {
  return items && items.length > 0 ? [...items] : ['']
}

function buildItems(rows: string[]): string[] {
  return rows
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function ListInput({
  id,
  label,
  items,
  onChange,
  placeholder,
  addLabel
}: ListInputProps): JSX.Element {
  const [rows, setRows] = useState<string[]>(() => normalizeItems(items))
  const lastEmittedRef = useRef<string | null>(null)
  const itemsKey = useMemo(() => JSON.stringify(items ?? []), [items])

  useEffect(() => {
    if (lastEmittedRef.current === itemsKey) return
    setRows(normalizeItems(items))
  }, [itemsKey, items])

  const emitChange = (nextRows: string[]): void => {
    const nextItems = buildItems(nextRows)
    lastEmittedRef.current = JSON.stringify(nextItems)
    onChange(nextItems.length > 0 ? nextItems : undefined)
  }

  const handleRowChange = (index: number, value: string): void => {
    const nextRows = [...rows]
    nextRows[index] = value
    setRows(nextRows)
    emitChange(nextRows)
  }

  const focusRow = (index: number): void => {
    const schedule =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (callback: () => void) => window.setTimeout(callback, 0)
    schedule(() => {
      const target = document.getElementById(index === 0 ? id : `${id}-${index}`)
      if (target instanceof HTMLInputElement) {
        target.focus()
        target.select()
      }
    })
  }

  const handleAddRow = (insertAfter?: number): void => {
    if (insertAfter === undefined) {
      setRows((prev) => [...prev, ''])
      focusRow(rows.length)
      return
    }

    const nextRows = [...rows]
    nextRows.splice(insertAfter + 1, 0, '')
    setRows(nextRows)
    focusRow(insertAfter + 1)
  }

  const handleRemoveRow = (index: number): void => {
    if (rows.length === 1) {
      const nextRows = ['']
      setRows(nextRows)
      emitChange(nextRows)
      return
    }

    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index)
    setRows(nextRows)
    emitChange(nextRows)
  }

  return (
    <div className="list-input">
      <span className="list-input__label">{label}</span>
      <div className="list-input__rows">
        {rows.map((value, index) => (
          <div className="list-input__row" key={`${id}-${index}`}>
            <input
              id={index === 0 ? id : `${id}-${index}`}
              type="text"
              value={value}
              placeholder={placeholder}
              aria-label={index === 0 ? label : `${label} ${index + 1}`}
              onChange={(event) => handleRowChange(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAddRow(index)
                }
              }}
            />
            <button
              type="button"
              className="list-input__remove"
              onClick={() => handleRemoveRow(index)}
              aria-label={`Remove ${label} ${index + 1}`}
              title={`Remove ${label} ${index + 1}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="list-input__add"
        onClick={() => handleAddRow()}
      >
        <Plus size={14} />
        Add {addLabel ?? 'item'}
      </button>
    </div>
  )
}
