import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LevelCompleteModal } from '../LevelCompleteModal'

describe('LevelCompleteModal', () => {
  it('shows payout for first completion', () => {
    render(
      <MemoryRouter>
        <LevelCompleteModal
          clientName="Bob's Bakery"
          completionMessage="Thanks!"
          payout={100}
          time={45}
          alreadyCompleted={false}
          onReplay={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/\$100/)).toBeInTheDocument()
    expect(screen.getByText(/Thanks!/)).toBeInTheDocument()
  })

  it('shows "Already completed" on replay', () => {
    render(
      <MemoryRouter>
        <LevelCompleteModal
          clientName="Bob's Bakery"
          completionMessage="Thanks!"
          payout={100}
          time={30}
          alreadyCompleted={true}
          onReplay={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/already completed/i)).toBeInTheDocument()
  })

  it('calls onReplay when replay is clicked', async () => {
    const onReplay = vi.fn()
    render(
      <MemoryRouter>
        <LevelCompleteModal
          clientName="Bob's Bakery"
          completionMessage="Thanks!"
          payout={100}
          time={45}
          alreadyCompleted={false}
          onReplay={onReplay}
        />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /replay/i }))
    expect(onReplay).toHaveBeenCalled()
  })
})
