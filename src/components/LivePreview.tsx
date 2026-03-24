import { useRef, useEffect, useCallback } from 'react'
import { buildSrcdoc } from '../engine/cssInjector'

interface LivePreviewProps {
  html: string
  css: string
  onIframeReady: (doc: Document) => void
}

export function LivePreview({ html, css, onIframeReady }: LivePreviewProps) {
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
    <div className="live-preview">
      <h3>Preview</h3>
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin"
        title="Live Preview"
        onLoad={handleLoad}
        className="preview-iframe"
      />
    </div>
  )
}
