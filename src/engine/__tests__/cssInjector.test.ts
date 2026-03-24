import { describe, it, expect } from 'vitest'
import { buildSrcdoc } from '../cssInjector'

describe('buildSrcdoc', () => {
  it('wraps html and css in a complete document', () => {
    const result = buildSrcdoc('<div>Hello</div>', 'body { color: red; }')

    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<style>body { color: red; }</style>')
    expect(result).toContain('<div>Hello</div>')
  })

  it('includes charset meta tag', () => {
    const result = buildSrcdoc('', '')
    expect(result).toContain('<meta charset="utf-8">')
  })

  it('handles empty html and css', () => {
    const result = buildSrcdoc('', '')
    expect(result).toContain('<style></style>')
    expect(result).toContain('<body>')
  })

  it('preserves special characters in css', () => {
    const css = '.box::before { content: ">"; }'
    const result = buildSrcdoc('', css)
    expect(result).toContain(css)
  })
})
