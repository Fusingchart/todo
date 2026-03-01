## Deep Focus Planner

A small web app for planning **long-term goals** and **short-term 1‑hour tasks**, with a built‑in **Pomodoro timer** that:

- **Long-term goals**: Each goal has a target number of hours. Every 25‑minute focus session automatically logs time toward its linked goal.
- **Short-term tasks**: Each task represents a **1‑hour block** for a specific day (today). The app assumes 2×25‑minute Pomodoros (with 5‑minute breaks) per task.
- **Smart scheduling**: The app always highlights a **suggested task** based on which goals are furthest from their target hours.
- **Pomodoro flow**: 25 min work → 5 min break → 25 min work → 5 min break. After **2 focus sessions**, the hour block is considered done and the app can automatically suggest the next task.

State (goals, tasks, and the timer session) is stored in `localStorage`, so your data persists between page reloads in the same browser.

### Project layout

- `web/` – Vite + React + TypeScript app
  - `src/App.tsx` – main UI and scheduling/timer logic
  - `src/App.css` – layout and component styling
  - `src/index.css` – global styles

### Running the app

From the project root:

```bash
cd web
npm install
npm run dev
```

Then open the printed `http://localhost:...` URL in your browser.

### How to use

1. **Create long-term goals**
   - In the **Goals** panel, enter a goal name and a target number of hours.
   - Each completed Pomodoro (25 minutes of focus) automatically adds 25 minutes to the linked goal.

2. **Create today’s 1‑hour tasks**
   - In **Today’s 1‑hour tasks**, add tasks for **today**.
   - Optionally link each task to one of your goals.
   - Each task is assumed to require **1 hour** (2 Pomodoros) to “complete”.

3. **Follow the Pomodoro timer**
   - The **Pomodoro timer** panel shows:
     - The current phase: **Focus** or **Break**
     - The remaining time in the current phase
     - The **current task** and its linked goal (if any)
   - Press **Start** to begin:
     - 25 minutes focus → logs 25 minutes to the active task/goal
     - 5 minutes break
     - 25 minutes focus → logs another 25 minutes
     - 5 minutes break
   - After **2 focus sessions**, the current task’s “hour” is done. The app:
     - Resets the Pomodoro block counter
     - Can automatically select the next best task for you (based on which goals are most behind).

4. **Choosing tasks**
   - You can manually click a task in the list to make it the **current** task.
   - When idle, the app shows a **suggested next task** according to your goal progress.

### Notes

- Time tracking is approximate and driven by the Pomodoro timer—if you pause/reset the timer, you will not log additional time to goals/tasks.
- All data is **local to your browser**; there is no backend or sync.

