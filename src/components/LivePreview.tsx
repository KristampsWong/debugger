import { useRef, useEffect, useCallback } from 'react'
import { buildSrcdoc } from '../engine/cssInjector'

interface LivePreviewProps {
  html: string
  css: string
  onIframeReady: (doc: Document) => void
  label?: string
}

export function LivePreview({ html, css, onIframeReady, label = 'Preview' }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (doc) {
      onIframeReady(doc)
    }
  }, [onIframeReady])

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = buildSrcdoc(html, css)
    }
  }, [html, css])

  return (
    <div className="flex flex-1 flex-col border-b border-border">
      <h3 className="bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{label}</h3>
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin"
        title="Live Preview"
        onLoad={handleLoad}
        className="w-full flex-1 border-none bg-white"
      />
    </div>
  )
}
