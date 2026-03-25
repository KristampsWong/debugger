import { useRef, useEffect, useCallback } from 'react'
import { buildSrcdoc } from '../engine/cssInjector'

interface LivePreviewProps {
  html: string
  css: string
  onIframeReady: (doc: Document) => void
  label?: string
  hasStyleInspector?: boolean
  iframeRef?: React.RefObject<HTMLIFrameElement | null>
}

export function LivePreview({ html, css, onIframeReady, label = 'Preview', hasStyleInspector = false, iframeRef }: LivePreviewProps) {
  const localRef = useRef<HTMLIFrameElement>(null)
  const ref = iframeRef ?? localRef

  const handleLoad = useCallback(() => {
    const doc = ref.current?.contentDocument
    if (doc) {
      onIframeReady(doc)
    }
  }, [onIframeReady, ref])

  useEffect(() => {
    if (ref.current) {
      ref.current.srcdoc = buildSrcdoc(html, css, hasStyleInspector)
    }
  }, [html, css, hasStyleInspector, ref])

  const sandbox = hasStyleInspector ? 'allow-same-origin allow-scripts' : 'allow-same-origin'

  return (
    <div className="flex flex-1 flex-col border-b border-border">
      <h3 className="bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{label}</h3>
      <iframe
        ref={ref}
        sandbox={sandbox}
        title="Live Preview"
        onLoad={handleLoad}
        className="w-full flex-1 border-none bg-white"
      />
    </div>
  )
}
