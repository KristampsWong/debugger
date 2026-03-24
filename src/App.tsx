import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './screens/MainMenu'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
      </Routes>
    </BrowserRouter>
  )
}
