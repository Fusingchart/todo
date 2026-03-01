import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  createInitialSession,
  getToday,
  loadInitialState,
  POMODORO_MINUTES,
  saveState,
  type Goal,
  type PersistedState,
  type Task,
} from '../store'

type AppStateContextValue = PersistedState & {
  goalMap: Map<string, Goal>
  today: string
  suggestedTask: Task | null
  currentTask: Task | null
  currentTaskGoal: Goal | null
  remainingMinutesForGoal: (goal: Goal) => number
  handleAddGoal: (name: string, hours: number) => void
  handleAddTask: (name: string, goalId: string | null) => void
  handleSelectTask: (taskId: string) => void
  toggleTimer: () => void
  resetTimer: () => void
  todaysTasks: Task[]
  totalTargetMinutes: number
  totalLoggedMinutes: number
  progressPercent: number
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitialState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const { goals, tasks, session } = state
  const goalMap = useMemo(() => {
    const map = new Map<string, Goal>()
    for (const g of goals) {
      map.set(g.id, g)
    }
    return map
  }, [goals])

  const today = getToday()

  const remainingMinutesForGoal = useCallback((goal: Goal) => {
    return Math.max(goal.targetHours * 60 - goal.loggedMinutes, 0)
  }, [])

  const suggestedTask = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.date === today)
    if (todayTasks.length === 0) return null
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
    return withoutGoal[0] ?? null
  }, [tasks, goalMap, today, remainingMinutesForGoal])

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
  }, [suggestedTask?.id])

  const currentTask =
    session.currentTaskId != null
      ? tasks.find((t) => t.id === session.currentTaskId) ?? null
      : null

  const currentTaskGoal =
    currentTask && currentTask.goalId
      ? goalMap.get(currentTask.goalId) ?? null
      : null

  const todaysTasks = tasks.filter((t) => t.date === today)

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

  const handleAddGoal = useCallback((name: string, hours: number) => {
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
  }, [])

  const handleAddTask = useCallback((name: string, goalId: string | null) => {
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
  }, [])

  const handleSelectTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        currentTaskId: taskId,
      },
    }))
  }, [])

  const toggleTimer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        running: !prev.session.running,
      },
    }))
  }, [])

  const resetTimer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      session: createInitialSession(),
    }))
  }, [])

  useEffect(() => {
    if (!session.running) return

    const interval = window.setInterval(() => {
      setState((prev) => {
        const s = prev.session
        if (!s.running) return prev

        let { minutesRemaining, secondsRemaining, phase } = s
        let pomodorosCompletedThisHour = s.pomodorosCompletedThisHour
        let hourBlockStart = s.hourBlockStart

        if (secondsRemaining === 0) {
          if (minutesRemaining === 0) {
            if (phase === 'work') {
              pomodorosCompletedThisHour += 1

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

              minutesRemaining = 5
              secondsRemaining = 0
              phase = 'break'
              if (hourBlockStart == null) hourBlockStart = Date.now()

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

            phase = 'work'
            minutesRemaining = 25
            secondsRemaining = 0

            if (pomodorosCompletedThisHour >= 2) {
              pomodorosCompletedThisHour = 0
              hourBlockStart = null

              const goalsMap = new Map(prev.goals.map((g) => [g.id, g]))
              const todaysTasks = prev.tasks.filter((t) => t.date === getToday())
              const withGoal = todaysTasks.filter((t) => t.goalId)
              const withoutGoal = todaysTasks.filter((t) => !t.goalId)
              const remaining = (goalId: string | null) => {
                if (!goalId) return 0
                const g = goalsMap.get(goalId)
                if (!g) return 0
                return Math.max(g.targetHours * 60 - g.loggedMinutes, 0)
              }
              let nextSuggested: Task | null = null
              if (withGoal.length > 0) {
                const sorted = [...withGoal].sort(
                  (a, b) => remaining(b.goalId) - remaining(a.goalId),
                )
                nextSuggested = sorted[0]
              } else if (withoutGoal.length > 0) {
                nextSuggested = withoutGoal[0]
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
            running: s.running,
            pomodorosCompletedThisHour,
            hourBlockStart,
          },
        }
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [session.running])

  const value: AppStateContextValue = useMemo(
    () => ({
      ...state,
      goalMap,
      today,
      suggestedTask: suggestedTask ?? null,
      currentTask,
      currentTaskGoal,
      remainingMinutesForGoal,
      handleAddGoal,
      handleAddTask,
      handleSelectTask,
      toggleTimer,
      resetTimer,
      todaysTasks,
      totalTargetMinutes,
      totalLoggedMinutes,
      progressPercent,
    }),
    [
      state,
      goalMap,
      today,
      suggestedTask,
      currentTask,
      currentTaskGoal,
      remainingMinutesForGoal,
      handleAddGoal,
      handleAddTask,
      handleSelectTask,
      toggleTimer,
      resetTimer,
      todaysTasks,
      totalTargetMinutes,
      totalLoggedMinutes,
      progressPercent,
    ],
  )

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
