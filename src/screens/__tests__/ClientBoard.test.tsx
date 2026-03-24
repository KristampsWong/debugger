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
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.getByText("Bob's Bakery")).toBeInTheDocument()
    expect(screen.getByText("Fix the Menu Colors")).toBeInTheDocument()
  })

  it('shows first level as unlocked', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const firstCard = screen.getByText("Bob's Bakery").closest('.level-card')
    expect(firstCard).not.toHaveClass('locked')
  })

  it('shows levels with unmet prerequisites as locked', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const secondCard = screen.getByText("Flex Fitness").closest('.level-card')
    expect(secondCard).toHaveClass('locked')
  })

  it('shows player money balance', () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const moneyEl = document.querySelector('.money')
    expect(moneyEl).toHaveTextContent('$100')
  })

  it('renders shop link', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /shop/i })).toBeInTheDocument()
  })

  it('shows completed class for completed levels', () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const firstCard = screen.getByText("Bob's Bakery").closest('.level-card')
    expect(firstCard).toHaveClass('completed')
  })

  it('shows "Replay" for completed levels', () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const firstCard = screen.getByText("Bob's Bakery").closest('.level-card')
    const link = firstCard!.querySelector('.start-btn')
    expect(link).toHaveTextContent('Replay')
  })

  it('shows "Accept Contract" for unlocked incomplete levels', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const firstCard = screen.getByText("Bob's Bakery").closest('.level-card')
    const link = firstCard!.querySelector('.start-btn')
    expect(link).toHaveTextContent('Accept Contract')
  })

  it('shows "Locked" label for locked levels', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const secondCard = screen.getByText("Flex Fitness").closest('.level-card')
    const lockedLabel = secondCard!.querySelector('.locked-label')
    expect(lockedLabel).toHaveTextContent('Locked')
  })

  it('displays difficulty stars', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const stars = document.querySelectorAll('.difficulty')
    expect(stars.length).toBeGreaterThan(0)
    expect(stars[0].textContent).toMatch(/★+/)
  })

  it('displays payout amounts', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const payouts = document.querySelectorAll('.payout')
    expect(payouts.length).toBeGreaterThan(0)
    expect(payouts[0].textContent).toMatch(/\$\d+/)
  })

  it('renders menu link', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /menu/i })).toBeInTheDocument()
  })
})
