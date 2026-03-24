import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MainMenu } from '../MainMenu'

describe('MainMenu', () => {
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
})
