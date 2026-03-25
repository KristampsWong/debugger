import { useState, useEffect } from 'react'
import { cssReference } from '../data/cssReference'

interface CSSReferencePanelProps {
  open: boolean
  onClose: () => void
}

export function CSSReferencePanel({ open, onClose }: CSSReferencePanelProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const filtered = query
    ? cssReference.filter((ref) => ref.property.includes(query.toLowerCase()))
    : cssReference

  return (
    <>
      <div
        className="absolute inset-0 z-10 bg-black/20"
        onClick={onClose}
        data-testid="css-reference-backdrop"
      />
      <div
        className="absolute inset-y-0 right-0 z-20 flex w-[300px] flex-col border-l border-border bg-background shadow-lg"
        data-testid="css-reference-panel"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h3 className="text-sm font-medium">CSS Reference</h3>
          <button
            onClick={onClose}
            aria-label="Close reference panel"
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="border-b border-border px-3 py-2">
          <input
            type="text"
            placeholder="Search properties..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded border border-border bg-muted px-2 py-1 text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-3">
            {filtered.map((ref) => (
              <li key={ref.property} className="text-sm">
                <div className="font-mono font-bold text-blue-400">{ref.property}</div>
                <div className="text-muted-foreground">{ref.description}</div>
                <div className="mt-1 font-mono text-xs text-green-400">{ref.example}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Values: {ref.values.join(', ')}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
