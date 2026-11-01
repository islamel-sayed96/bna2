import { useMemo } from 'react'
import { useCollection } from './useCollection'
import { backend } from './backend'
import { allCategories, allQuestions, withChildren } from './quiz'

// Everything the skills pages need: your subjects, questions and attempts.
export function useSkills() {
  const catsCol = useCollection('skill_categories')
  const questions = useCollection('questions')
  const attempts = useCollection('quiz_attempts')
  const loading = catsCol.loading || questions.loading || attempts.loading

  const cats = useMemo(() => allCategories(catsCol.rows), [catsCol.rows])
  const all = useMemo(() => allQuestions(questions.rows), [questions.rows])

  async function deleteCategory(id) {
    const ids = withChildren(cats, id)
    const qIds = questions.rows.filter((q) => ids.includes(q.category)).map((q) => q.id)
    if (qIds.length) await backend.removeMany('questions', qIds)
    for (const cid of ids.slice(1)) await backend.remove('skill_categories', cid)
    await catsCol.remove(id)
    await Promise.all([catsCol.reload(), questions.reload()])
  }

  const reloadAll = () => Promise.all([catsCol.reload(), questions.reload()])

  return { loading, cats, userCats: catsCol.rows, catsCol, questions, attempts, all, deleteCategory, reloadAll }
}
