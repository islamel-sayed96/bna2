// Question packs: a JSON file with categories (+ sub-topics) and questions.
// When importing you choose where it goes: as-is, into a new subject, or into one you already have.
import { backend } from './backend'

const generalPack = () =>
  import('../data/questions').then(({ CATEGORIES, BUILTIN_QUESTIONS }) => ({
    name: 'مجالات عامة',
    categories: CATEGORIES.map((c) => ({ key: c.id, name: c.name, icon: c.icon, color: c.color, parent: null })),
    questions: BUILTIN_QUESTIONS.map((q) => ({
      category: q.category, type: 'mcq', lang: q.category === 'english' ? 'en' : 'ar',
      text: q.text, options: q.options, answer: q.answer, explanation: q.explanation,
    })),
  }))

export const PUBLIC_PACKS = [
  {
    id: 'general',
    name: 'مجالات عامة',
    icon: '🌍',
    desc: '7 مجالات: تفكير منطقي، إنتاجية، تواصل، إنجليزي، ثقافة مالية، برمجة، ثقافة عامة — 63 سؤال اختيارات.',
    load: generalPack,
  },
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

/**
 * target:
 *   { mode: 'pack' }                  keep the pack's own subjects
 *   { mode: 'new', name, icon }       put everything inside a new subject
 *   { mode: 'existing', id }          put everything inside one of your subjects
 * Subjects are found by name before creating, so importing into the same place merges.
 */
export async function importPack(pack, existingCats, target = { mode: 'pack' }) {
  validatePack(pack)
  const cats = [...existingCats]
  let newCats = 0
  const findOrCreate = async (name, icon, color, parentId) => {
    const found = cats.find((x) => x.name === name && (x.parent_id ?? null) === (parentId ?? null))
    if (found) return found.id
    const saved = await backend.insert('skill_categories', { name, icon: icon || '📘', color: color || 'violet', parent_id: parentId ?? null })
    cats.push(saved)
    newCats++
    return saved.id
  }

  const roots = pack.categories.filter((c) => !c.parent)
  const childrenOf = (key) => pack.categories.filter((c) => c.parent === key)
  const idByKey = {}

  if (target.mode === 'pack') {
    for (const r of roots) {
      idByKey[r.key] = await findOrCreate(r.name, r.icon, r.color, null)
      for (const c of childrenOf(r.key)) idByKey[c.key] = await findOrCreate(c.name, c.icon, c.color, idByKey[r.key])
    }
  } else {
    const first = roots[0] ?? {}
    const rootId =
      target.mode === 'existing'
        ? target.id
        : await findOrCreate(target.name?.trim() || pack.name || first.name || 'حزمة جديدة', target.icon || first.icon, first.color, null)
    for (const r of roots) {
      const kids = childrenOf(r.key)
      if (kids.length || roots.length === 1) {
        // The pack's main subject becomes your chosen subject; its topics become topics there.
        idByKey[r.key] = rootId
        for (const c of kids) idByKey[c.key] = await findOrCreate(c.name, c.icon, c.color, rootId)
      } else {
        // Several flat subjects (like "مجالات عامة") become topics inside your subject.
        idByKey[r.key] = await findOrCreate(r.name, r.icon, r.color, rootId)
      }
    }
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
