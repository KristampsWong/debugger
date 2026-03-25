import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Shop } from '../Shop'
import { useGameStore } from '../../store/gameStore'

describe('Shop', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('renders shop items', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('Syntax Highlighter+')).toBeInTheDocument()
    expect(screen.getByText('Bug Detector')).toBeInTheDocument()
  })

  it('shows player money', () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('$200')).toBeInTheDocument()
  })

  it('disables buy button when not enough money', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    const buyButtons = screen.getAllByRole('button', { name: /buy/i })
    buyButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('allows buying when enough money', async () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    const buyButtons = screen.getAllByRole('button', { name: /buy/i })
    await userEvent.click(buyButtons[0])
    expect(useGameStore.getState().ownedTools).toContain('syntax-highlighter')
    expect(useGameStore.getState().money).toBe(150)
  })

  it('shows "Owned" for purchased tools', () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('Owned')).toBeInTheDocument()
  })

  it('shows "each" for consumable items', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText(/each/)).toBeInTheDocument()
  })

  it('renders back to board link', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /back to board/i })).toBeInTheDocument()
  })

  it('deducts money after purchase', async () => {
    useGameStore.getState().completeLevel('level-01', 500, 30)
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    const buyButtons = screen.getAllByRole('button', { name: /buy/i })
    await userEvent.click(buyButtons[0])
    expect(useGameStore.getState().money).toBeLessThan(500)
  })

  it('renders Solution Preview item in shop', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('Solution Preview')).toBeInTheDocument()
    expect(screen.getByText(/side-by-side/)).toBeInTheDocument()
  })

  it('renders all 6 shop items', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    const cards = screen.getAllByTestId('shop-card')
    expect(cards).toHaveLength(7)
  })

  it('renders CSS Reference item in shop', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('CSS Reference')).toBeInTheDocument()
    expect(screen.getByText(/Look up CSS property docs/)).toBeInTheDocument()
  })
})
