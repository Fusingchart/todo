import { useState } from 'react'
import { useAppState } from '../context/AppState'

export function Goals() {
  const {
    goals,
    remainingMinutesForGoal,
    progressPercent,
    handleAddGoal,
  } = useAppState()

  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalHours, setNewGoalHours] = useState(10)

  return (
    <div className="page">
      <h2>Goals</h2>
      <p className="page-subtitle">
        Define long-term goals with target hours. Pomodoros log progress
        automatically.
      </p>

      <section className="panel">
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddGoal(newGoalName, newGoalHours)
            setNewGoalName('')
          }}
        >
          <div className="field-group">
            <label>
              Goal
              <input
                type="text"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="e.g. Learn TypeScript deeply"
              />
            </label>
          </div>
          <div className="field-group small">
            <label>
              Target hours
              <input
                type="number"
                min={1}
                value={newGoalHours}
                onChange={(e) =>
                  setNewGoalHours(
                    Number.isNaN(e.target.valueAsNumber)
                      ? 1
                      : Math.max(1, e.target.valueAsNumber),
                  )
                }
              />
            </label>
          </div>
          <button type="submit">Add goal</button>
        </form>

        {goals.length === 0 ? (
          <p className="empty">No goals yet. Add one to get started.</p>
        ) : (
          <div className="list">
            {goals.map((g) => {
              const remaining = remainingMinutesForGoal(g)
              const goalPercent =
                g.targetHours === 0
                  ? 0
                  : Math.min(
                      100,
                      Math.round((g.loggedMinutes / (g.targetHours * 60)) * 100),
                    )
              return (
                <div key={g.id} className="list-item">
                  <div className="list-item-header">
                    <div>
                      <div className="list-item-title">{g.name}</div>
                      <div className="list-item-meta">
                        {(g.loggedMinutes / 60).toFixed(1)} / {g.targetHours} h
                        logged
                        {remaining > 0 && (
                          <> · {Math.ceil(remaining / 60)} h remaining</>
                        )}
                      </div>
                    </div>
                    <span className="pill">{goalPercent}% done</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${goalPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="overall-progress">
          <div className="overall-label">
            Overall goal progress: {progressPercent}%
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill overall"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
