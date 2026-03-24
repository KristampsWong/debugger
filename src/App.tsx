import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './screens/MainMenu'
import { ClientBoard } from './screens/ClientBoard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/board" element={<ClientBoard />} />
      </Routes>
    </BrowserRouter>
  )
}
