interface ClientBriefProps {
  clientName: string
  brief: string
  hintMessage?: string
  showHint: boolean
}

export function ClientBrief({ clientName, brief, hintMessage, showHint }: ClientBriefProps) {
  return (
    <div className="flex-1" data-testid="client-brief">
      <strong className="text-primary">{clientName}</strong>
      <p className="text-sm text-muted-foreground">{brief}</p>
      {showHint && hintMessage && (
        <p data-testid="hint-text" className="mt-1 text-sm text-yellow-500">
          {hintMessage}
        </p>
      )}
    </div>
  )
}
