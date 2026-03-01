import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Goal = {
  id: string
  name: string
  targetHours: number
  loggedMinutes: number
}

type Task = {
  id: string
  name: string
  goalId: string | null
  date: string // YYYY-MM-DD
  completedPomodoros: number
}

type Phase = 'work' | 'break'

type SessionState = {
  phase: Phase
  minutesRemaining: number
  secondsRemaining: number
  running: boolean
  currentTaskId: string | null
  pomodorosCompletedThisHour: number
  hourBlockStart: number | null
}

const WORK_MINUTES = 25
const BREAK_MINUTES = 5
const POMODORO_MINUTES = WORK_MINUTES

const STORAGE_KEY = 'focus_planner_state_v1'

type PersistedState = {
  goals: Goal[]
  tasks: Task[]
  session: SessionState
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function createInitialSession(): SessionState {
  return {
    phase: 'work',
    minutesRemaining: WORK_MINUTES,
    secondsRemaining: 0,
    running: false,
    currentTaskId: null,
    pomodorosCompletedThisHour: 0,
    hourBlockStart: null,
  }
}

function loadInitialState(): PersistedState {
  if (typeof localStorage === 'undefined') {
    return {
      goals: [],
      tasks: [],
      session: createInitialSession(),
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        goals: [],
        tasks: [],
        session: createInitialSession(),
      }
    }
    const parsed = JSON.parse(raw) as PersistedState
    return {
      goals: parsed.goals ?? [],
      tasks: parsed.tasks ?? [],
      session: parsed.session ?? createInitialSession(),
    }
  } catch {
    return {
      goals: [],
      tasks: [],
      session: createInitialSession(),
    }
  }
}

function saveState(state: PersistedState) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function App() {
  const [{ goals, tasks, session }, setState] = useState<PersistedState>(() =>
    loadInitialState(),
  )

  // Persist on change
  useEffect(() => {
    saveState({ goals, tasks, session })
  }, [goals, tasks, session])

  // Derived: map of goals
  const goalMap = useMemo(() => {
    const map = new Map<string, Goal>()
    for (const g of goals) {
      map.set(g.id, g)
    }
    return map
  }, [goals])

  const today = getToday()

  // Helper: get remaining minutes for a goal
  function remainingMinutesForGoal(goal: Goal): number {
    return Math.max(goal.targetHours * 60 - goal.loggedMinutes, 0)
  }

  // Derived: suggested current task
  const suggestedTask: Task | null = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.date === today)

    if (todayTasks.length === 0) return null

    // Each short-term task represents 1 hour (2 pomodoros)
    // Prioritize:
    // 1) Tasks attached to goals that are behind (highest remaining minutes)
    // 2) Then unattached tasks

    const withGoal = todayTasks.filter((t) => t.goalId)
    const withoutGoal = todayTasks.filter((t) => !t.goalId)

    if (withGoal.length > 0) {
      const sorted = [...withGoal].sort((a, b) => {
        const ga = a.goalId ? goalMap.get(a.goalId) : undefined
        const gb = b.goalId ? goalMap.get(b.goalId) : undefined
        const ra = ga ? remainingMinutesForGoal(ga) : 0
        const rb = gb ? remainingMinutesForGoal(gb) : 0
        return rb - ra
      })
      return sorted[0]
    }

    // Fallback: any today task
    return withoutGoal[0] ?? null
  }, [tasks, goalMap, today])

  // Ensure session has a current task when idle
  useEffect(() => {
    setState((prev) => {
      if (prev.session.currentTaskId || !suggestedTask) return prev
      return {
        ...prev,
        session: {
          ...prev.session,
          currentTaskId: suggestedTask.id,
        },
      }
    })
  }, [suggestedTask])

  const currentTask =
    session.currentTaskId != null
      ? tasks.find((t) => t.id === session.currentTaskId) ?? null
      : null

  const currentTaskGoal =
    currentTask && currentTask.goalId
      ? goalMap.get(currentTask.goalId) ?? null
      : null

  // Timer effect
  useEffect(() => {
    if (!session.running) return

    const interval = window.setInterval(() => {
      setState((prev) => {
        const s = prev.session
        if (!s.running) return prev

        let { minutesRemaining, secondsRemaining, phase } = s
        let running = s.running
        let pomodorosCompletedThisHour = s.pomodorosCompletedThisHour
        let hourBlockStart = s.hourBlockStart

        if (secondsRemaining === 0) {
          if (minutesRemaining === 0) {
            // Phase finished
            if (phase === 'work') {
              // Completed a pomodoro
              pomodorosCompletedThisHour += 1

              // Log 25 minutes against current task + goal
              const updatedTasks = [...prev.tasks]
              if (s.currentTaskId) {
                const idx = updatedTasks.findIndex(
                  (t) => t.id === s.currentTaskId,
                )
                if (idx !== -1) {
                  const t = updatedTasks[idx]
                  updatedTasks[idx] = {
                    ...t,
                    completedPomodoros: t.completedPomodoros + 1,
                  }
                }
              }

              const updatedGoals = [...prev.goals]
              if (s.currentTaskId) {
                const t = prev.tasks.find((t) => t.id === s.currentTaskId)
                if (t?.goalId) {
                  const gIdx = updatedGoals.findIndex((g) => g.id === t.goalId)
                  if (gIdx !== -1) {
                    const g = updatedGoals[gIdx]
                    updatedGoals[gIdx] = {
                      ...g,
                      loggedMinutes: g.loggedMinutes + POMODORO_MINUTES,
                    }
                  }
                }
              }

              // Switch to break
              minutesRemaining = BREAK_MINUTES
              secondsRemaining = 0
              phase = 'break'

              // Initialize or update the hour block start
              if (hourBlockStart == null) {
                hourBlockStart = Date.now()
              }

              return {
                ...prev,
                goals: updatedGoals,
                tasks: updatedTasks,
                session: {
                  ...s,
                  phase,
                  minutesRemaining,
                  secondsRemaining,
                  pomodorosCompletedThisHour,
                  hourBlockStart,
                },
              }
            }

            // Break finished: start next work session
            phase = 'work'
            minutesRemaining = WORK_MINUTES
            secondsRemaining = 0

            // After 2 pomodoros we consider the hour block done
            if (pomodorosCompletedThisHour >= 2) {
              pomodorosCompletedThisHour = 0
              hourBlockStart = null

              // Auto-switch to next suggested task if available
              const nextSuggested =
                (() => {
                  const today = getToday()
                  const goalsMap = new Map(prev.goals.map((g) => [g.id, g]))
                  const todaysTasks = prev.tasks.filter(
                    (t) => t.date === today,
                  )
                  if (todaysTasks.length === 0) return null
                  const withGoal = todaysTasks.filter((t) => t.goalId)
                  const withoutGoal = todaysTasks.filter((t) => !t.goalId)
                  function remaining(goalId: string | null): number {
                    if (!goalId) return 0
                    const g = goalsMap.get(goalId)
                    if (!g) return 0
                    return Math.max(
                      g.targetHours * 60 - g.loggedMinutes,
                      0,
                    )
                  }
                  if (withGoal.length > 0) {
                    const sorted = [...withGoal].sort(
                      (a, b) =>
                        remaining(b.goalId) - remaining(a.goalId),
                    )
                    return sorted[0]
                  }
                  return withoutGoal[0] ?? null
                })() ?? null

              return {
                ...prev,
                session: {
                  ...s,
                  phase,
                  minutesRemaining,
                  secondsRemaining,
                  pomodorosCompletedThisHour,
                  hourBlockStart,
                  currentTaskId: nextSuggested?.id ?? s.currentTaskId,
                },
              }
            }

            return {
              ...prev,
              session: {
                ...s,
                phase,
                minutesRemaining,
                secondsRemaining,
                pomodorosCompletedThisHour,
                hourBlockStart,
              },
            }
          }

          minutesRemaining -= 1
          secondsRemaining = 59
        } else {
          secondsRemaining -= 1
        }

        return {
          ...prev,
          session: {
            ...s,
            minutesRemaining,
            secondsRemaining,
            phase,
            running,
            pomodorosCompletedThisHour,
            hourBlockStart,
          },
        }
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [session.running])

  function handleAddGoal(name: string, hours: number) {
    if (!name.trim() || hours <= 0) return
    setState((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          targetHours: hours,
          loggedMinutes: 0,
        },
      ],
    }))
  }

  function handleAddTask(name: string, goalId: string | null) {
    if (!name.trim()) return
    const date = getToday()
    setState((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          goalId,
          date,
          completedPomodoros: 0,
        },
      ],
    }))
  }

  function handleSelectTask(taskId: string) {
    setState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        currentTaskId: taskId,
      },
    }))
  }

  function toggleTimer() {
    setState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        running: !prev.session.running,
      },
    }))
  }

  function resetTimer() {
    setState((prev) => ({
      ...prev,
      session: createInitialSession(),
    }))
  }

  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalHours, setNewGoalHours] = useState(10)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskGoalId, setNewTaskGoalId] = useState<string | 'none'>('none')

  const totalTargetMinutes = goals.reduce(
    (sum, g) => sum + g.targetHours * 60,
    0,
  )
  const totalLoggedMinutes = goals.reduce(
    (sum, g) => sum + g.loggedMinutes,
    0,
  )

  const progressPercent =
    totalTargetMinutes === 0
      ? 0
      : Math.min(100, Math.round((totalLoggedMinutes / totalTargetMinutes) * 100))

  const todaysTasks = tasks.filter((t) => t.date === today)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Deep Focus Planner</h1>
        <p className="app-subtitle">
          Long-term goals, 1-hour task blocks, and a built-in Pomodoro guide.
        </p>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Goals</h2>
          <p className="panel-subtitle">
            Define long-term goals with total hours. Pomodoros log progress
            automatically.
          </p>

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
                        Math.round(
                          (g.loggedMinutes / (g.targetHours * 60)) * 100,
                        ),
                      )
                return (
                  <div key={g.id} className="list-item">
                    <div className="list-item-header">
                      <div>
                        <div className="list-item-title">{g.name}</div>
                        <div className="list-item-meta">
                          {(
                            g.loggedMinutes / 60
                          ).toFixed(1)}{' '}
                          / {g.targetHours} h logged
                          {remaining > 0 && (
                            <> · {Math.ceil(remaining / 60)} h remaining</>
                          )}
                        </div>
                      </div>
                      <span className="pill">
                        {goalPercent}% done
                      </span>
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

        <section className="panel">
          <h2>Today&apos;s 1-hour tasks</h2>
          <p className="panel-subtitle">
            Each task is one hour: 25 min work, 5 min break, 25 min work,
            5 min break.
          </p>

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
                    setNewTaskGoalId(
                      e.target.value as string | 'none',
                    )
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
                    className={
                      'list-item task-item' +
                      (isCurrent ? ' current' : '')
                    }
                    onClick={() => handleSelectTask(t.id)}
                  >
                    <div className="list-item-header">
                      <div>
                        <div className="list-item-title">
                          {t.name}
                        </div>
                        <div className="list-item-meta">
                          {goal ? goal.name : 'No goal linked'}
                          {' · '}
                          {completedHours.toFixed(1)} / 1.0 h done
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="pill accent">
                          Current
                        </span>
                      )}
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

        <section className="panel timer-panel">
          <h2>Pomodoro timer</h2>
          <p className="panel-subtitle">
            Guided 25 / 5 / 25 / 5 schedule that automatically logs progress
            to goals and tasks.
          </p>

          <div className="timer-main">
            <div className="timer-phase">
              {session.phase === 'work' ? 'Focus' : 'Break'}
            </div>
            <div className="timer-time">
              {String(session.minutesRemaining).padStart(2, '0')}:
              {String(session.secondsRemaining).padStart(2, '0')}
            </div>
            <div className="timer-task-name">
              {currentTask ? (
                <>
                  Now: <span>{currentTask.name}</span>
                  {currentTaskGoal && (
                    <>
                      <br />
                      <span className="timer-task-goal">
                        Goal: {currentTaskGoal.name}
                      </span>
                    </>
                  )}
                </>
              ) : suggestedTask ? (
                <>
                  Next up: <span>{suggestedTask.name}</span>
                </>
              ) : (
                'No task selected.'
              )}
            </div>

            <div className="timer-buttons">
              <button type="button" onClick={toggleTimer}>
                {session.running ? 'Pause' : 'Start'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={resetTimer}
              >
                Reset
              </button>
            </div>

            <div className="timer-meta">
              <div>
                Pomodoros this block:{' '}
                <strong>{session.pomodorosCompletedThisHour} / 2</strong>
              </div>
              <div className="timer-note">
                After two focus sessions, the app will suggest the next
                best 1-hour task based on goal progress.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
