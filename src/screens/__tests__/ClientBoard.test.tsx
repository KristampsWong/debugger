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
})
