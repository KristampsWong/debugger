import { describe, it, expect } from 'vitest'
import { buildSrcdoc } from '../cssInjector'

describe('buildSrcdoc', () => {
  it('wraps HTML and CSS into a complete document', () => {
    const result = buildSrcdoc('<div>Hello</div>', '.div { color: red; }')
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<div>Hello</div>')
    expect(result).toContain('.div { color: red; }')
  })

  it('puts CSS in a style tag inside the head', () => {
    const result = buildSrcdoc('<p>Test</p>', 'p { margin: 0; }')
    expect(result).toMatch(/<head>[\s\S]*<style>p \{ margin: 0; \}<\/style>[\s\S]*<\/head>/)
  })

  it('puts HTML in the body', () => {
    const result = buildSrcdoc('<p>Test</p>', 'p { margin: 0; }')
    expect(result).toMatch(/<body>[\s\S]*<p>Test<\/p>[\s\S]*<\/body>/)
  })

  it('handles empty CSS', () => {
    const result = buildSrcdoc('<div>Hi</div>', '')
    expect(result).toContain('<style></style>')
    expect(result).toContain('<div>Hi</div>')
  })
})
