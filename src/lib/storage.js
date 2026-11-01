// localStorage with an in-memory fallback (some embedded/private browsers block it).
const memory = new Map()
let ls = null
try {
  const k = '__namaa_test__'
  window.localStorage.setItem(k, '1')
  window.localStorage.removeItem(k)
  ls = window.localStorage
} catch {
  ls = null
}

export const storage = {
  persistent: Boolean(ls),
  getItem: (k) => (ls ? ls.getItem(k) : memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => (ls ? ls.setItem(k, v) : memory.set(k, String(v))),
  removeItem: (k) => (ls ? ls.removeItem(k) : memory.delete(k)),
}
