import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('shows skip button for unlocked, incomplete levels when player can afford', () => {
    useGameStore.setState({ money: 500 })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    // Level 1 is unlocked and not completed
    const skipButtons = screen.getAllByText(/Skip/)
    expect(skipButtons.length).toBeGreaterThan(0)
  })

  it('does not show skip button for completed levels', () => {
    useGameStore.setState({ money: 500, completedLevels: ['level-01'] })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const level1Card = screen.getAllByTestId('level-card')[0]
    expect(level1Card.querySelector('[data-testid="skip-button"]')).not.toBeInTheDocument()
  })

  it('does not show skip button when player cannot afford', () => {
    useGameStore.setState({ money: 0 })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('skip-button')).not.toBeInTheDocument()
  })

  it('shows orange border for skipped levels', () => {
    useGameStore.setState({
      completedLevels: ['level-01'],
      skippedLevels: ['level-01'],
    })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const cards = screen.getAllByTestId('level-card')
    expect(cards[0].className).toContain('border-orange-500')
  })

  it('shows Replay button for skipped levels (they are completedLevels too)', () => {
    useGameStore.setState({
      completedLevels: ['level-01'],
      skippedLevels: ['level-01'],
    })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.getByText('Replay')).toBeInTheDocument()
  })

  it('opens confirmation dialog and skips level on confirm', () => {
    useGameStore.setState({ money: 500 })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    fireEvent.click(screen.getAllByTestId('skip-button')[0])
    expect(screen.getByText('Skip Level?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Skip'))
    const state = useGameStore.getState()
    expect(state.skippedLevels).toContain('level-01')
    expect(state.money).toBe(300) // 500 - 200 (2x $100 payout)
  })

  it('closes confirmation dialog on cancel without skipping', () => {
    useGameStore.setState({ money: 500 })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    fireEvent.click(screen.getAllByTestId('skip-button')[0])
    fireEvent.click(screen.getByText('Cancel'))
    expect(useGameStore.getState().skippedLevels).not.toContain('level-01')
    expect(useGameStore.getState().money).toBe(500)
  })
})
