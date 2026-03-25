interface StyleDetailsPanelProps {
  selector: string | null
  styles: Record<string, string> | null
  onClose: () => void
}

const CATEGORIES: Record<string, string[]> = {
  Layout: ['display', 'position', 'flex-direction', 'justify-content', 'align-items', 'grid-template-columns', 'gap', 'overflow', 'z-index'],
  'Box Model': ['width', 'height', 'padding', 'margin', 'border-radius', 'object-fit'],
  Typography: ['font-size', 'font-weight', 'transform'],
  Colors: ['color', 'background-color'],
}

export function StyleDetailsPanel({ selector, styles, onClose }: StyleDetailsPanelProps) {
  if (!selector || !styles) return null

  return (
    <div
      className="max-h-[200px] overflow-y-auto border-t border-border bg-muted/50 p-3"
      data-testid="style-details-panel"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-blue-400">{selector}</span>
        <button
          onClick={onClose}
          aria-label="Close inspector"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(CATEGORIES).map(([category, props]) => (
          <div key={category}>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">{category}</h4>
            <ul className="flex flex-col gap-0.5">
              {props.map((prop) => (
                <li key={prop} className="flex justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{prop}</span>
                  <span className="font-mono">{styles[prop] ?? ''}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
