import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppState'

export function Home() {
  const {
    goals,
    todaysTasks,
    progressPercent,
    suggestedTask,
    currentTask,
    session,
  } = useAppState()

  return (
    <div className="page home-page">
      <h2>Dashboard</h2>
      <p className="page-subtitle">
        Overview of your goals, today&apos;s tasks, and focus progress.
      </p>

      <div className="dashboard-grid">
        <section className="panel dashboard-card">
          <h3>Goals</h3>
          <p className="stat">
            {goals.length} goal{goals.length !== 1 ? 's' : ''}
          </p>
          <div className="progress-bar">
            <div
              className="progress-bar-fill overall"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="stat-label">Overall progress: {progressPercent}%</p>
          <Link to="/goals" className="link-btn">
            Manage goals →
          </Link>
        </section>

        <section className="panel dashboard-card">
          <h3>Today&apos;s tasks</h3>
          <p className="stat">
            {todaysTasks.length} task{todaysTasks.length !== 1 ? 's' : ''} for
            today
          </p>
          {suggestedTask && (
            <p className="suggested">
              Suggested next: <strong>{suggestedTask.name}</strong>
            </p>
          )}
          <Link to="/tasks" className="link-btn">
            Manage tasks →
          </Link>
        </section>

        <section className="panel dashboard-card">
          <h3>Pomodoro</h3>
          {currentTask ? (
            <p className="stat">
              Current: <strong>{currentTask.name}</strong>
            </p>
          ) : (
            <p className="stat">No task selected</p>
          )}
          <p className="stat-label">
            {session.phase === 'work' ? 'Focus' : 'Break'} ·{' '}
            {String(session.minutesRemaining).padStart(2, '0')}:
            {String(session.secondsRemaining).padStart(2, '0')}
          </p>
          <Link to="/timer" className="link-btn primary">
            Open timer →
          </Link>
        </section>
      </div>
    </div>
  )
}
