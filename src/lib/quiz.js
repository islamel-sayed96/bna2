import { BUILTIN_QUESTIONS, CATEGORIES } from '../data/questions'
import { addDaysKey, todayKey } from './dates'

/* ───────────── Categories (built-in + your own, with sub-topics) ───────────── */

export const BUILTIN_CATS = CATEGORIES.map((c) => ({ ...c, parent_id: null, builtin: true }))

export function allCategories(userCats = []) {
  return [...userCats.map((c) => ({ ...c, desc: c.desc ?? '' })), ...BUILTIN_CATS]
}

const FALLBACK = { id: '?', name: 'بدون تصنيف', icon: '📝', color: 'slate', parent_id: null }
export const categoryById = (id, cats = BUILTIN_CATS) => cats.find((c) => c.id === id) ?? { ...FALLBACK, id }
export const rootsOf = (cats) => cats.filter((c) => !c.parent_id)
export const childrenOf = (cats, id) => cats.filter((c) => c.parent_id === id)
// The category itself plus all its sub-topics.
export const withChildren = (cats, id) => [id, ...childrenOf(cats, id).map((c) => c.id)]
export const rootOf = (cats, id) => {
  const c = categoryById(id, cats)
  return c.parent_id ? categoryById(c.parent_id, cats) : c
}
export function categoryPath(cats, id) {
  const c = categoryById(id, cats)
  return c.parent_id ? `${categoryById(c.parent_id, cats).name} › ${c.name}` : c.name
}

/* ───────────── Questions ───────────── */

export const QUESTION_TYPES = {
  mcq: { name: 'اختيار من متعدد', icon: '🔘' },
  truefalse: { name: 'صح أو غلط', icon: '✔️' },
  text: { name: 'إجابة مكتوبة قصيرة', icon: '⌨️' },
  writing: { name: 'كتابة / موضوع', icon: '📝' },
  listening: { name: 'استماع من فيديو', icon: '🎧' },
}

const parse = (v, fallback) => {
  if (v == null) return fallback
  if (typeof v === 'string') {
    try {
      return JSON.parse(v)
    } catch {
      return fallback
    }
  }
  return v
}

export function normalizeQuestion(q) {
  const options = parse(q.options, [])
  return {
    ...q,
    type: q.type || 'mcq',
    options,
    accepted: parse(q.accepted, []),
    keywords: parse(q.keywords, []),
    media: parse(q.media, null),
    lang: q.lang || 'en',
  }
}

export function allQuestions(custom = []) {
  return [...BUILTIN_QUESTIONS.map(normalizeQuestion), ...custom.map(normalizeQuestion)]
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

// Daily challenge: one question from each subject (yours first), then fill to n.
export function dailyQuestions(all, cats, dateKey = todayKey(), n = 10) {
  const rand = seeded(`namaa-${dateKey}`)
  const pool = shuffle(all.filter((q) => q.type !== 'writing'), rand)
  const picked = new Set()
  for (const root of rootsOf(cats)) {
    const ids = withChildren(cats, root.id)
    const q = pool.find((x) => ids.includes(x.category) && !picked.has(x))
    if (q && picked.size < n) picked.add(q)
  }
  for (const q of pool) {
    if (picked.size >= n) break
    picked.add(q)
  }
  return shuffle([...picked], rand)
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

// Sum stats for a category and its sub-topics.
export function statsFor(stats, cats, id) {
  return withChildren(cats, id).reduce(
    (acc, cid) => ({ answered: acc.answered + (stats[cid]?.answered ?? 0), correct: acc.correct + (stats[cid]?.correct ?? 0) }),
    { answered: 0, correct: 0 },
  )
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

export const MODE_LABELS = { daily: 'التحدي اليومي', category: 'اختبار مجال', random: 'اختبار عشوائي', mistakes: 'مراجعة الأخطاء', mine: 'من أسئلتي' }
