import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './screens/MainMenu'
import { ClientBoard } from './screens/ClientBoard'
import { Mission } from './screens/Mission'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/board" element={<ClientBoard />} />
        <Route path="/mission/:levelId" element={<Mission />} />
      </Routes>
    </BrowserRouter>
  )
}
