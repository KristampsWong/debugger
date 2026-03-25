import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type { TestResult } from '../types'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  bugLines?: number[]
  showBugDetector: boolean
  enableAutocomplete: boolean
  testResults?: TestResult[]
  hasEnhancedErrors?: boolean
}

function findPropertyLine(css: string, property: string, selector: string): number | null {
  const lines = css.split('\n')
  let currentSelector = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.endsWith('{')) {
      currentSelector = line.replace(/\s*\{$/, '').trim()
    }
    if (line.startsWith(property + ':') || line.startsWith(property + ' :')) {
      if (!selector || currentSelector.includes(selector.replace(/"/g, ''))) {
        return i + 1
      }
    }
  }
  // Fallback: find any line with the property
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith(property + ':') || trimmed.startsWith(property + ' :')) {
      return i + 1
    }
  }
  return null
}

export function CodeEditor({
  value,
  onChange,
  bugLines = [],
  showBugDetector,
  enableAutocomplete,
  testResults = [],
  hasEnhancedErrors = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const errorDecorationsRef = useRef<string[]>([])

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    if (showBugDetector && bugLines.length > 0) {
      const decorations = bugLines.map((line) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: 'bug-gutter-icon',
          glyphMarginHoverMessage: { value: 'Bug detected on this line' },
        },
      }))
      editor.deltaDecorations([], decorations)
    }
  }

  // Live-update squiggly underlines when testResults change
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco || !hasEnhancedErrors) {
      if (editor && errorDecorationsRef.current.length > 0) {
        errorDecorationsRef.current = editor.deltaDecorations(errorDecorationsRef.current, [])
      }
      return
    }

    const errorDecorations: any[] = []
    for (const result of testResults) {
      if (result.passed || !result.failureDetail) continue
      if (result.failureDetail.type !== 'mismatch') continue
      const { property, selector, expected, actual } = result.failureDetail
      const line = findPropertyLine(value, property, selector)
      if (line === null) continue
      errorDecorations.push({
        range: new monaco.Range(line, 1, line, 1000),
        options: {
          inlineClassName: 'squiggly-error-inline',
          hoverMessage: {
            value: `Expected \`${property}\` to be \`${expected}\` but got \`${actual}\``,
          },
        },
      })
    }
    errorDecorationsRef.current = editor.deltaDecorations(errorDecorationsRef.current, errorDecorations)
  }, [testResults, hasEnhancedErrors, value])

  return (
    <div className="h-full">
      <Editor
        height="100%"
        language="css"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val ?? '')}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          suggest: {
            showProperties: enableAutocomplete,
          },
          hover: {
            enabled: enableAutocomplete || hasEnhancedErrors,
          },
        }}
      />
    </div>
  )
}
