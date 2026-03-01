import { NavLink, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <NavLink to="/" className="app-title">
            Deep Focus Planner
          </NavLink>
        </h1>
        <nav className="nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/goals">Goals</NavLink>
          <NavLink to="/tasks">Tasks</NavLink>
          <NavLink to="/timer">Timer</NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
