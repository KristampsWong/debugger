import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientBrief } from '../ClientBrief'

describe('ClientBrief', () => {
  it('renders client name and brief', () => {
    render(
      <ClientBrief clientName="Bob's Bakery" brief="Fix the colors" showHint={false} />
    )
    expect(screen.getByText("Bob's Bakery")).toBeInTheDocument()
    expect(screen.getByText('Fix the colors')).toBeInTheDocument()
  })

  it('shows hint when showHint is true and hintMessage is provided', () => {
    render(
      <ClientBrief
        clientName="Bob"
        brief="Brief"
        hintMessage="Try changing the background"
        showHint={true}
      />
    )
    expect(screen.getByText('Try changing the background')).toBeInTheDocument()
  })

  it('hides hint when showHint is false', () => {
    render(
      <ClientBrief
        clientName="Bob"
        brief="Brief"
        hintMessage="Hidden hint"
        showHint={false}
      />
    )
    expect(screen.queryByText('Hidden hint')).not.toBeInTheDocument()
  })

  it('hides hint when hintMessage is undefined even with showHint true', () => {
    render(
      <ClientBrief clientName="Bob" brief="Brief" showHint={true} />
    )
    expect(screen.queryByTestId('hint-text')).not.toBeInTheDocument()
  })
})
