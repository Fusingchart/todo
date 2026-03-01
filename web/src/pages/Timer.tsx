import { useAppState } from '../context/AppState'

export function Timer() {
  const {
    session,
    currentTask,
    currentTaskGoal,
    suggestedTask,
    toggleTimer,
    resetTimer,
  } = useAppState()

  return (
    <div className="page timer-page">
      <h2>Pomodoro timer</h2>
      <p className="page-subtitle">
        Guided 25 / 5 / 25 / 5 schedule that automatically logs progress to
        goals and tasks.
      </p>

      <section className="panel timer-panel">
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
              'No task selected. Add tasks on the Tasks page.'
            )}
          </div>

          <div className="timer-buttons">
            <button type="button" onClick={toggleTimer}>
              {session.running ? 'Pause' : 'Start'}
            </button>
            <button type="button" className="secondary" onClick={resetTimer}>
              Reset
            </button>
          </div>

          <div className="timer-meta">
            <div>
              Pomodoros this block:{' '}
              <strong>{session.pomodorosCompletedThisHour} / 2</strong>
            </div>
            <div className="timer-note">
              After two focus sessions, the app will suggest the next best
              1-hour task based on goal progress.
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
