import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StyleDetailsPanel } from '../StyleDetailsPanel'

describe('StyleDetailsPanel', () => {
  const sampleStyles = {
    'color': 'rgb(0, 0, 0)',
    'background-color': 'rgb(255, 255, 255)',
    'display': 'block',
    'position': 'static',
    'padding': '0px',
    'margin': '0px',
    'font-size': '16px',
    'font-weight': '400',
    'width': 'auto',
    'height': 'auto',
    'flex-direction': 'row',
    'justify-content': 'normal',
    'align-items': 'normal',
    'z-index': 'auto',
    'overflow': 'visible',
    'border-radius': '0px',
    'gap': 'normal',
    'grid-template-columns': 'none',
    'object-fit': 'fill',
    'transform': 'none',
  }

  it('renders nothing when no styles provided', () => {
    render(<StyleDetailsPanel selector={null} styles={null} onClose={vi.fn()} />)
    expect(screen.queryByTestId('style-details-panel')).not.toBeInTheDocument()
  })

  it('renders selector and styles when provided', () => {
    render(<StyleDetailsPanel selector="h1" styles={sampleStyles} onClose={vi.fn()} />)
    expect(screen.getByTestId('style-details-panel')).toBeInTheDocument()
    expect(screen.getByText('h1')).toBeInTheDocument()
    expect(screen.getByText('rgb(0, 0, 0)')).toBeInTheDocument()
  })

  it('groups styles by category', () => {
    render(<StyleDetailsPanel selector="h1" styles={sampleStyles} onClose={vi.fn()} />)
    expect(screen.getByText('Layout')).toBeInTheDocument()
    expect(screen.getByText('Box Model')).toBeInTheDocument()
    expect(screen.getByText('Typography')).toBeInTheDocument()
    expect(screen.getByText('Colors')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<StyleDetailsPanel selector="h1" styles={sampleStyles} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close inspector'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
