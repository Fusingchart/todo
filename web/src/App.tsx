import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppStateProvider } from './context/AppState'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Goals } from './pages/Goals'
import { Tasks } from './pages/Tasks'
import { Timer } from './pages/Timer'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="goals" element={<Goals />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="timer" element={<Timer />} />
          </Route>
        </Routes>
      </AppStateProvider>
    </BrowserRouter>
  )
}

export default App
