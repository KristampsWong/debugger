import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Mission } from '../Mission'
import { useGameStore } from '../../store/gameStore'
import { useLevelStore } from '../../store/levelStore'

// Mock Monaco Editor to avoid jsdom issues
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="mock-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

function renderMission(levelId: string) {
  return render(
    <MemoryRouter initialEntries={[`/mission/${levelId}`]}>
      <Routes>
        <Route path="/mission/:levelId" element={<Mission />} />
        <Route path="/board" element={<div data-testid="board-redirect">Board</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Mission', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
    useLevelStore.getState().reset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('redirects to board when level does not exist', () => {
    renderMission('nonexistent-level')
    expect(screen.getByTestId('board-redirect')).toBeInTheDocument()
  })

  it('redirects to board when prerequisites are not met', () => {
    // level-02 requires level-01 to be completed
    renderMission('level-02')
    expect(screen.getByTestId('board-redirect')).toBeInTheDocument()
  })

  it('loads level-01 successfully (no prerequisites)', () => {
    renderMission('level-01')
    // Should render mission screen with client name
    expect(screen.getByText("Bob's Bakery")).toBeInTheDocument()
  })

  it('renders the submit button as disabled initially', () => {
    renderMission('level-01')
    const submitBtn = screen.getByRole('button', { name: /submit/i })
    expect(submitBtn).toBeDisabled()
  })

  it('displays timer starting at 0:00', () => {
    renderMission('level-01')
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('increments timer each second', () => {
    renderMission('level-01')
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('0:03')).toBeInTheDocument()
  })

  it('formats timer with minutes and padded seconds', () => {
    renderMission('level-01')
    act(() => {
      vi.advanceTimersByTime(65000)
    })
    expect(screen.getByText('1:05')).toBeInTheDocument()
  })

  it('renders test panel with level tests', () => {
    renderMission('level-01')
    expect(screen.getByTestId('test-panel')).toBeInTheDocument()
  })

  it('renders client brief', () => {
    renderMission('level-01')
    expect(screen.getByTestId('client-brief')).toBeInTheDocument()
  })

  it('loads level-02 when prerequisites are met', () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    renderMission('level-02')
    expect(screen.getByText('Flex Fitness')).toBeInTheDocument()
  })

  it('renders single preview when solution-preview tool is not owned', () => {
    renderMission('level-01')
    const previews = screen.getAllByTitle('Live Preview')
    expect(previews).toHaveLength(1)
  })

  it('renders two previews side-by-side when solution-preview tool is owned', () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    useGameStore.setState({ ownedTools: ['solution-preview'] })
    renderMission('level-01')
    const previews = screen.getAllByTitle('Live Preview')
    expect(previews).toHaveLength(2)
  })

  it('shows "My Result" and "Correct Answer" labels when solution-preview is owned', () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    useGameStore.setState({ ownedTools: ['solution-preview'] })
    renderMission('level-01')
    expect(screen.getByText('My Result')).toBeInTheDocument()
    expect(screen.getByText('Correct Answer')).toBeInTheDocument()
  })
})
