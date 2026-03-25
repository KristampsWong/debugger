import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LivePreview } from '../LivePreview'

describe('LivePreview', () => {
  const defaultProps = {
    html: '<p>Hello</p>',
    css: 'p { color: red; }',
    onIframeReady: vi.fn(),
  }

  it('renders default "Preview" label when no label prop', () => {
    render(<LivePreview {...defaultProps} />)
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })

  it('renders custom label when label prop is provided', () => {
    render(<LivePreview {...defaultProps} label="My Result" />)
    expect(screen.getByText('My Result')).toBeInTheDocument()
    expect(screen.queryByText('Preview')).not.toBeInTheDocument()
  })

  it('uses allow-same-origin sandbox by default', () => {
    render(<LivePreview {...defaultProps} />)
    const iframe = document.querySelector('iframe')
    expect(iframe?.getAttribute('sandbox')).toBe('allow-same-origin')
  })

  it('adds allow-scripts to sandbox when hasStyleInspector is true', () => {
    render(<LivePreview {...defaultProps} hasStyleInspector={true} />)
    const iframe = document.querySelector('iframe')
    expect(iframe?.getAttribute('sandbox')).toBe('allow-same-origin allow-scripts')
  })
})
