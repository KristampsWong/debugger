interface HoverData {
  selector: string
  styles: Record<string, string>
  x: number
  y: number
}

interface StyleInspectorOverlayProps {
  hoverData: HoverData | null
}

export function StyleInspectorOverlay({ hoverData }: StyleInspectorOverlayProps) {
  if (!hoverData) return null

  const PREVIEW_PROPS = ['display', 'color', 'background-color', 'padding', 'margin', 'font-size', 'position']

  return (
    <div
      data-testid="inspector-tooltip"
      className="pointer-events-none absolute z-30 rounded border border-border bg-background p-2 shadow-lg"
      style={{ left: hoverData.x + 12, top: hoverData.y + 12, maxWidth: 260 }}
    >
      <div className="mb-1 font-mono text-xs font-bold text-blue-400">{hoverData.selector}</div>
      <ul className="flex flex-col gap-0.5">
        {PREVIEW_PROPS.map((prop) => (
          <li key={prop} className="flex justify-between gap-3 text-xs">
            <span className="font-mono text-muted-foreground">{prop}</span>
            <span className="font-mono">{hoverData.styles[prop] ?? ''}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
