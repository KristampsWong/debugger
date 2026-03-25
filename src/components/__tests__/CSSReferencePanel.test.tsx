import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CSSReferencePanel } from '../CSSReferencePanel'

describe('CSSReferencePanel', () => {
  const defaultProps = { open: true, onClose: vi.fn() }

  it('renders property entries when open', () => {
    render(<CSSReferencePanel {...defaultProps} />)
    expect(screen.getByText('display')).toBeInTheDocument()
    expect(screen.getByText('color')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(<CSSReferencePanel open={false} onClose={vi.fn()} />)
    expect(screen.queryByText('display')).not.toBeInTheDocument()
  })

  it('filters properties by search query', () => {
    render(<CSSReferencePanel {...defaultProps} />)
    const search = screen.getByPlaceholderText('Search properties...')
    fireEvent.change(search, { target: { value: 'flex' } })
    expect(screen.getByText('flex')).toBeInTheDocument()
    expect(screen.getByText('flex-direction')).toBeInTheDocument()
    expect(screen.queryByText('color')).not.toBeInTheDocument()
  })

  it('shows description and example for each property', () => {
    render(<CSSReferencePanel {...defaultProps} />)
    expect(screen.getByText('Sets the display behavior of an element.')).toBeInTheDocument()
    expect(screen.getByText('display: flex;')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<CSSReferencePanel open={true} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close reference panel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<CSSReferencePanel open={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<CSSReferencePanel open={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('css-reference-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
