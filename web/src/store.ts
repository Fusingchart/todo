export type Goal = {
  id: string
  name: string
  targetHours: number
  loggedMinutes: number
}

export type Task = {
  id: string
  name: string
  goalId: string | null
  date: string
  completedPomodoros: number
}

export type Phase = 'work' | 'break'

export type SessionState = {
  phase: Phase
  minutesRemaining: number
  secondsRemaining: number
  running: boolean
  currentTaskId: string | null
  pomodorosCompletedThisHour: number
  hourBlockStart: number | null
}

export type PersistedState = {
  goals: Goal[]
  tasks: Task[]
  session: SessionState
}

export const WORK_MINUTES = 25
export const BREAK_MINUTES = 5
export const POMODORO_MINUTES = WORK_MINUTES
export const STORAGE_KEY = 'focus_planner_state_v1'

export function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createInitialSession(): SessionState {
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

export function loadInitialState(): PersistedState {
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

export function saveState(state: PersistedState) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
