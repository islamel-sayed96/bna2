import { BUILTIN_QUESTIONS, CATEGORIES } from '../data/questions'
import { addDaysKey, todayKey } from './dates'

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) ?? { id, name: id, icon: '📝', color: 'slate' }

export function allQuestions(custom = []) {
  return [...BUILTIN_QUESTIONS, ...custom.map((q) => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }))]
}

// Deterministic PRNG so the daily challenge is the same all day.
function seeded(seedStr) {
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

export function shuffle(arr, rand = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Daily challenge: one question from each category, then fill to n.
export function dailyQuestions(all, dateKey = todayKey(), n = 10) {
  const rand = seeded(`namaa-${dateKey}`)
  const pool = shuffle(all, rand)
  const picked = []
  for (const c of CATEGORIES) {
    const q = pool.find((x) => x.category === c.id && !picked.includes(x))
    if (q) picked.push(q)
  }
  for (const q of pool) {
    if (picked.length >= n) break
    if (!picked.includes(q)) picked.push(q)
  }
  return shuffle(picked.slice(0, n), rand)
}

// Latest result per question across all attempts.
export function latestResults(attempts) {
  const map = new Map()
  const sorted = [...attempts].sort((a, b) => a.created_at.localeCompare(b.created_at))
  for (const a of sorted) for (const d of a.details ?? []) map.set(d.qid, d.correct)
  return map
}

export function mistakeQuestions(all, attempts) {
  const latest = latestResults(attempts)
  return all.filter((q) => latest.get(q.id) === false)
}

export function categoryStats(attempts, all) {
  const byId = new Map(all.map((q) => [q.id, q]))
  const stats = {}
  for (const a of attempts) {
    for (const d of a.details ?? []) {
      const cat = byId.get(d.qid)?.category
      if (!cat) continue
      stats[cat] ??= { answered: 0, correct: 0 }
      stats[cat].answered++
      if (d.correct) stats[cat].correct++
    }
  }
  return stats
}

export const attemptDay = (a) => {
  const d = new Date(a.created_at)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function practiceStreak(attempts, today = todayKey()) {
  const days = new Set(attempts.map(attemptDay))
  let day = days.has(today) ? today : addDaysKey(today, -1)
  let n = 0
  while (days.has(day)) {
    n++
    day = addDaysKey(day, -1)
  }
  return n
}

export const dailyDoneToday = (attempts, today = todayKey()) =>
  attempts.filter((a) => a.mode === 'daily' && attemptDay(a) === today).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]

export const MODE_LABELS = { daily: 'التحدي اليومي', category: 'اختبار تصنيف', random: 'اختبار عشوائي', mistakes: 'مراجعة الأخطاء' }
