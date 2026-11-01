import { addDaysKey, fromKey, todayKey } from './dates'

// Habit kinds:
//  build — a habit you want to do (✓ counts toward your rate)
//  bonus — extra credit (✓ raises your rate, skipping it costs nothing)
//  avoid — something to stay away from; a log means you slipped (✕)
export const KINDS = {
  build: { name: 'عادة أساسية', short: 'أساسية', icon: '✅', desc: 'بتحسب في نسبة التزامك' },
  bonus: { name: 'إضافي (بونص)', short: 'إضافي', icon: '⭐', desc: 'لو عملتها بتعلّي نسبتك، ولو لأ مش بتقلل' },
  avoid: { name: 'عادة أتجنبها', short: 'أتجنبها', icon: '✕', desc: 'علّم ✕ بس في اليوم اللي وقعت فيها' },
}
export const kindOf = (h) => (KINDS[h.kind] ? h.kind : 'build')

export const logKey = (habitId, date) => `${habitId}|${date}`
export const buildLogSet = (logs) => new Set(logs.map((l) => logKey(l.habit_id, l.date)))

export const isScheduled = (habit, dateKey) => (habit.days ?? []).includes(fromKey(dateKey).getDay())
const createdKey = (habit) => (habit.created_at ? habit.created_at.slice(0, 10) : '2000-01-01')
export const isActiveOn = (habit, dateKey) => isScheduled(habit, dateKey) && createdKey(habit) <= dateKey

export const isLogged = (habit, logSet, day) => logSet.has(logKey(habit.id, day))
// "Success" for a day: did it (build/bonus) or stayed clean (avoid).
export const isDone = (habit, logSet, day) => (kindOf(habit) === 'avoid' ? !isLogged(habit, logSet, day) : isLogged(habit, logSet, day))

// Consecutive successful scheduled days. Today only counts once it's a success,
// so an unchecked "today" doesn't break the streak yet.
export function currentStreak(habit, logSet, today = todayKey()) {
  let streak = 0
  let day = today
  const start = createdKey(habit)
  if (isScheduled(habit, day) && !isDone(habit, logSet, day)) {
    if (kindOf(habit) === 'avoid') return 0 // slipped today
    day = addDaysKey(day, -1)
  }
  for (let i = 0; i < 730 && day >= start; i++, day = addDaysKey(day, -1)) {
    if (!isScheduled(habit, day)) continue
    if (isDone(habit, logSet, day)) streak++
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
    if (isDone(habit, logSet, day)) best = Math.max(best, ++run)
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
    const ok = isDone(habit, logSet, day)
    if (day === today && !ok && kindOf(habit) !== 'avoid') continue // today isn't over yet
    scheduled++
    if (ok) done++
  }
  return scheduled ? done / scheduled : 0
}

// Daily rating: (required done + avoid clean + bonus done) / (required + avoid).
// Bonus habits can push it above 100%.
export function dayScore(habits, logSet, day) {
  let required = 0
  let done = 0
  let bonusDone = 0
  let bonusTotal = 0
  for (const h of habits) {
    if (!isActiveOn(h, day)) continue
    const k = kindOf(h)
    if (k === 'bonus') {
      bonusTotal++
      if (isLogged(h, logSet, day)) bonusDone++
    } else {
      required++
      if (isDone(h, logSet, day)) done++
    }
  }
  const rate = required ? (done + bonusDone) / required : bonusTotal ? bonusDone / bonusTotal : null
  return { required, done, bonusDone, bonusTotal, rate }
}

export const scoreColor = (rate) =>
  rate == null ? 'text-ink-soft' : rate > 1 ? 'text-amber-500' : rate >= 0.8 ? 'text-emerald-600' : rate >= 0.5 ? 'text-amber-600' : 'text-rose-500'

// Group habits by section, keeping the order they were added.
export function groupBySection(habits) {
  const groups = []
  for (const h of [...habits].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || (a.created_at ?? '').localeCompare(b.created_at ?? ''))) {
    const name = h.section || (kindOf(h) === 'bonus' ? 'إضافي' : kindOf(h) === 'avoid' ? 'عادات أتجنبها' : 'عاداتي')
    let g = groups.find((x) => x.name === name)
    if (!g) groups.push((g = { name, habits: [] }))
    g.habits.push(h)
  }
  return groups
}

export const HABIT_ICONS = ['💧', '📖', '🏃', '🧘', '🕌', '🥗', '😴', '✍️', '💪', '🏋️', '🚭', '🎯', '🌱', '🧠', '🎧', '📵', '☀️', '🌅', '🌙', '📿', '💊', '🙏', '💻', '🚶', '🍎', '🍔', '❌', '✨']
