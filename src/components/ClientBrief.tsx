interface ClientBriefProps {
  clientName: string
  brief: string
  hintMessage?: string
  showHint: boolean
}

export function ClientBrief({ clientName, brief, hintMessage, showHint }: ClientBriefProps) {
  return (
    <div className="client-brief">
      <strong className="client-name">{clientName}</strong>
      <p className="brief-text">{brief}</p>
      {showHint && hintMessage && (
        <p className="hint-text">{hintMessage}</p>
      )}
    </div>
  )
}
