import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MainMenu } from '../MainMenu'
import { useGameStore } from '../../store/gameStore'

describe('MainMenu', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('renders game title', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    )
    expect(screen.getByText('Debugger')).toBeInTheDocument()
  })

  it('renders new game and continue buttons', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /new game/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /continue/i })).toBeInTheDocument()
  })

  it('shows continue as disabled when no save exists', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    )
    const continueBtn = screen.getByRole('link', { name: /continue/i })
    expect(continueBtn).toHaveClass('disabled')
  })

  it('shows continue as enabled when save exists', () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    )
    const continueBtn = screen.getByRole('link', { name: /continue/i })
    expect(continueBtn).not.toHaveClass('disabled')
  })

  it('resets game state when New Game is clicked', async () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('link', { name: /new game/i }))
    expect(useGameStore.getState().completedLevels).toEqual([])
    expect(useGameStore.getState().money).toBe(0)
  })

  it('renders subtitle text', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    )
    expect(screen.getByText('Fix bugs. Get paid. Buy better tools.')).toBeInTheDocument()
  })
})
