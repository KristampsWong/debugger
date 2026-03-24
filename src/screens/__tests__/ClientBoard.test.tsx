import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClientBoard } from '../ClientBoard'
import { useGameStore } from '../../store/gameStore'

describe('ClientBoard', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('renders level cards', () => {
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    expect(screen.getByText("Bob's Bakery")).toBeInTheDocument()
    expect(screen.getByText("Fix the Menu Colors")).toBeInTheDocument()
  })

  it('shows first level as unlocked', () => {
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    const cards = screen.getAllByTestId('level-card')
    expect(cards[0].className).not.toMatch(/opacity-50/)
  })

  it('shows levels with unmet prerequisites as locked', () => {
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    const cards = screen.getAllByTestId('level-card')
    expect(cards[1].className).toMatch(/opacity-50/)
  })

  it('shows player money balance', () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    expect(screen.getByTestId('money')).toHaveTextContent('$100')
  })

  it('renders shop link', () => {
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /shop/i })).toBeInTheDocument()
  })

  it('shows completed border for completed levels', () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    const cards = screen.getAllByTestId('level-card')
    expect(cards[0].className).toMatch(/border-green-500/)
  })

  it('shows "Replay" for completed levels', () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    const cards = screen.getAllByTestId('level-card')
    const replayLink = cards[0].querySelector('a')
    expect(replayLink).toHaveTextContent('Replay')
  })

  it('shows "Accept Contract" for unlocked incomplete levels', () => {
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    const cards = screen.getAllByTestId('level-card')
    const link = cards[0].querySelector('a')
    expect(link).toHaveTextContent('Accept Contract')
  })

  it('shows "Locked" label for locked levels', () => {
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    const cards = screen.getAllByTestId('level-card')
    expect(cards[1].querySelector('[data-testid="locked-label"]')).toHaveTextContent('Locked')
  })

  it('displays difficulty stars', () => {
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    const stars = screen.getAllByTestId('difficulty')
    expect(stars.length).toBeGreaterThan(0)
    expect(stars[0].textContent).toMatch(/★+/)
  })

  it('displays payout amounts', () => {
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    const payouts = screen.getAllByTestId('payout')
    expect(payouts.length).toBeGreaterThan(0)
    expect(payouts[0].textContent).toMatch(/\$\d+/)
  })

  it('renders menu link', () => {
    render(<MemoryRouter><ClientBoard /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /menu/i })).toBeInTheDocument()
  })
})
