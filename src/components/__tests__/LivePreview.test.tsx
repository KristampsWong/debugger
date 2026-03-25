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
})
