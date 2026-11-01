import { addDaysKey, fromKey, todayKey } from './dates'

export const logKey = (habitId, date) => `${habitId}|${date}`
export const buildLogSet = (logs) => new Set(logs.map((l) => logKey(l.habit_id, l.date)))

export const isScheduled = (habit, dateKey) => (habit.days ?? []).includes(fromKey(dateKey).getDay())

const createdKey = (habit) => (habit.created_at ? habit.created_at.slice(0, 10) : '2000-01-01')

// Consecutive scheduled days completed. Today only counts once it's done,
// so an unchecked "today" doesn't break the streak yet.
export function currentStreak(habit, logSet, today = todayKey()) {
  let streak = 0
  let day = today
  const start = createdKey(habit)
  if (isScheduled(habit, day) && !logSet.has(logKey(habit.id, day))) day = addDaysKey(day, -1)
  for (let i = 0; i < 730 && day >= start; i++, day = addDaysKey(day, -1)) {
    if (!isScheduled(habit, day)) continue
    if (logSet.has(logKey(habit.id, day))) streak++
    else break
  }
  return streak
}

export function bestStreak(habit, logSet, today = todayKey()) {
  let best = 0
  let run = 0
  let day = createdKey(habit)
  if (day < addDaysKey(today, -730)) day = addDaysKey(today, -730)
  for (; day <= today; day = addDaysKey(day, 1)) {
    if (!isScheduled(habit, day)) continue
    if (logSet.has(logKey(habit.id, day))) best = Math.max(best, ++run)
    else if (day !== today) run = 0
  }
  return best
}

export function completionRate(habit, logSet, days = 30, today = todayKey()) {
  let scheduled = 0
  let done = 0
  const start = createdKey(habit)
  for (let i = 0; i < days; i++) {
    const day = addDaysKey(today, -i)
    if (day < start) break
    if (!isScheduled(habit, day)) continue
    const isDone = logSet.has(logKey(habit.id, day))
    // Don't penalise today before it's over.
    if (day === today && !isDone) continue
    scheduled++
    if (isDone) done++
  }
  return scheduled ? done / scheduled : 0
}

export const HABIT_ICONS = ['💧', '📖', '🏃', '🧘', '🕌', '🥗', '😴', '✍️', '💪', '🚭', '🎯', '🌱', '🧠', '🎧', '📵', '☀️', '🦷', '💊', '🙏', '💻', '🎨', '🚶', '🍎', '✨']
