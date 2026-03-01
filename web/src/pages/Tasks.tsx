import { useState } from 'react'
import { useAppState } from '../context/AppState'

export function Tasks() {
  const {
    goals,
    todaysTasks,
    goalMap,
    session,
    handleAddTask,
    handleSelectTask,
  } = useAppState()

  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskGoalId, setNewTaskGoalId] = useState<string | 'none'>('none')

  return (
    <div className="page">
      <h2>Today&apos;s 1-hour tasks</h2>
      <p className="page-subtitle">
        Each task is one hour: 25 min work, 5 min break, 25 min work, 5 min
        break.
      </p>

      <section className="panel">
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddTask(
              newTaskName,
              newTaskGoalId === 'none' ? null : newTaskGoalId,
            )
            setNewTaskName('')
          }}
        >
          <div className="field-group">
            <label>
              Task
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="e.g. Read TS handbook chapter"
              />
            </label>
          </div>
          <div className="field-group">
            <label>
              Linked goal
              <select
                value={newTaskGoalId}
                onChange={(e) =>
                  setNewTaskGoalId(e.target.value as string | 'none')
                }
              >
                <option value="none">None</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit">Add 1-hour task</button>
        </form>

        {todaysTasks.length === 0 ? (
          <p className="empty">
            No tasks scheduled for today. Add at least one to start.
          </p>
        ) : (
          <div className="list">
            {todaysTasks.map((t) => {
              const isCurrent = t.id === session.currentTaskId
              const goal = t.goalId ? goalMap.get(t.goalId) : null
              const completedHours = t.completedPomodoros / 2
              const taskProgress = Math.min(
                100,
                Math.round((t.completedPomodoros / 2) * 100),
              )
              return (
                <button
                  key={t.id}
                  type="button"
                  className={'list-item task-item' + (isCurrent ? ' current' : '')}
                  onClick={() => handleSelectTask(t.id)}
                >
                  <div className="list-item-header">
                    <div>
                      <div className="list-item-title">{t.name}</div>
                      <div className="list-item-meta">
                        {goal ? goal.name : 'No goal linked'}
                        {' · '}
                        {completedHours.toFixed(1)} / 1.0 h done
                      </div>
                    </div>
                    {isCurrent && <span className="pill accent">Current</span>}
                  </div>
                  <div className="progress-bar small">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
