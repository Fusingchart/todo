import { NavLink, Outlet } from 'react-router-dom'
import { useAppState } from '../context/AppState'

export function Layout() {
  const { currentTask, session } = useAppState()

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <NavLink to="/" className="app-title">
            Deep Focus Planner
          </NavLink>
        </h1>
        <div className="header-right">
          <nav className="nav">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/goals">Goals</NavLink>
            <NavLink to="/tasks">Tasks</NavLink>
            <NavLink to="/timer">Timer</NavLink>
          </nav>
          {currentTask && (
            <div className="current-task-pill">
              <span className="current-task-dot" />
              <span className="current-task-label">
                {session.phase === 'work' ? 'Focusing on' : 'Queued'}:{' '}
                <strong>{currentTask.name}</strong>
              </span>
            </div>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
