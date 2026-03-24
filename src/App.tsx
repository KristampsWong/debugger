import { HashRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './screens/MainMenu'
import { ClientBoard } from './screens/ClientBoard'
import { Mission } from './screens/Mission'
import { Shop } from './screens/Shop'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/board" element={<ClientBoard />} />
        <Route path="/mission/:levelId" element={<Mission />} />
        <Route path="/shop" element={<Shop />} />
      </Routes>
    </HashRouter>
  )
}
