// Question packs: a JSON file with categories (+ sub-topics) and questions.
// Importing merges categories by name, so packs can extend each other.
import { backend } from './backend'

export const PUBLIC_PACKS = [
  {
    id: 'english-phrases',
    name: 'الإنجليزي — تعبيرات وجمل',
    icon: '🇬🇧',
    desc: 'تركيبات لغوية، جمل مختلفة، Idioms، قل ولا تقل، تعبيرات يومية وللشغل — حوالي 300 سؤال أغلبها كتابة.',
    load: () => import('../data/packs/english-phrases.json').then((m) => m.default),
  },
]

export function validatePack(pack) {
  if (!pack || !Array.isArray(pack.categories) || !Array.isArray(pack.questions)) throw new Error('الملف ده مش حزمة أسئلة صالحة')
  return pack
}

// existingCats: current skill_categories rows. Returns { categories, questions } counts.
export async function importPack(pack, existingCats) {
  validatePack(pack)
  const idByKey = {}
  const cats = [...existingCats]
  let newCats = 0
  // Parents first.
  const ordered = [...pack.categories].sort((a, b) => (a.parent ? 1 : 0) - (b.parent ? 1 : 0))
  for (const c of ordered) {
    const parentId = c.parent ? idByKey[c.parent] : null
    const found = cats.find((x) => x.name === c.name && (x.parent_id ?? null) === (parentId ?? null))
    if (found) {
      idByKey[c.key] = found.id
      continue
    }
    const saved = await backend.insert('skill_categories', { name: c.name, icon: c.icon || '📘', color: c.color || 'violet', parent_id: parentId })
    cats.push(saved)
    idByKey[c.key] = saved.id
    newCats++
  }
  const rows = pack.questions
    .filter((q) => idByKey[q.category])
    .map((q) => ({
      category: idByKey[q.category],
      type: q.type || 'mcq',
      text: q.text,
      options: q.options ?? [],
      answer: q.answer ?? null,
      answer_text: q.answer_text ?? null,
      accepted: q.accepted ?? [],
      keywords: q.keywords ?? [],
      media: q.media ?? null,
      lang: q.lang || 'en',
      explanation: q.explanation ?? null,
    }))
  await backend.insertMany('questions', rows)
  return { categories: newCats, questions: rows.length }
}

// Export your own subjects + questions as a pack (backup / share).
export function buildPack(name, userCats, questions) {
  const key = (id) => `c${userCats.findIndex((c) => c.id === id)}`
  return {
    name,
    categories: userCats.map((c) => ({ key: key(c.id), name: c.name, icon: c.icon, color: c.color, parent: c.parent_id ? key(c.parent_id) : null })),
    questions: questions
      .filter((q) => userCats.some((c) => c.id === q.category))
      .map(({ id: _id, user_id: _u, created_at: _c, category, ...q }) => ({ ...q, category: key(category) })),
  }
}
