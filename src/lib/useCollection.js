import { useCallback, useEffect, useState } from 'react'
import { backend } from './backend'

// Loads one table and exposes optimistic CRUD helpers.
export function useCollection(table) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      setRows(await backend.list(table))
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [table])

  useEffect(() => {
    reload()
  }, [reload])

  const insert = useCallback(
    async (row) => {
      const saved = await backend.insert(table, row)
      setRows((r) => [...r, saved])
      return saved
    },
    [table],
  )

  const insertMany = useCallback(
    async (list) => {
      const saved = await backend.insertMany(table, list)
      setRows((r) => [...r, ...saved])
      return saved
    },
    [table],
  )

  const update = useCallback(
    async (id, patch) => {
      setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))
      try {
        await backend.update(table, id, patch)
      } catch (e) {
        reload()
        throw e
      }
    },
    [table, reload],
  )

  const remove = useCallback(
    async (id) => {
      setRows((r) => r.filter((x) => x.id !== id))
      try {
        await backend.remove(table, id)
      } catch (e) {
        reload()
        throw e
      }
    },
    [table, reload],
  )

  return { rows, loading, error, insert, insertMany, update, remove, reload }
}
