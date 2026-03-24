import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  bugLines?: number[]
  showBugDetector: boolean
  enableAutocomplete: boolean
}

export function CodeEditor({
  value,
  onChange,
  bugLines = [],
  showBugDetector,
  enableAutocomplete,
}: CodeEditorProps) {
  const handleEditorMount = (editor: any, monaco: any) => {
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

  return (
    <div className="code-editor">
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
            enabled: enableAutocomplete,
          },
        }}
      />
    </div>
  )
}
