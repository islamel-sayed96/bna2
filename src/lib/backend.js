// One small interface over two storage backends:
//  - Supabase (real accounts + cloud database) when VITE_SUPABASE_URL / KEY are set
//  - Local demo mode (everything stays in this browser) otherwise
import { createClient } from '@supabase/supabase-js'
import { storage } from './storage'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isCloud = Boolean(SUPABASE_URL && SUPABASE_KEY)
export const allowSignup = import.meta.env.VITE_ALLOW_SIGNUP !== 'false'

const TABLES = ['habits', 'habit_logs', 'events', 'questions', 'quiz_attempts']

/* ------------------------------ Supabase ------------------------------ */

function cloudBackend() {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
  const check = ({ data, error }) => {
    if (error) throw new Error(error.message)
    return data
  }

  return {
    async getUser() {
      const { data } = await sb.auth.getSession()
      return data.session?.user ?? null
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, session) => cb(session?.user ?? null))
      return () => data.subscription.unsubscribe()
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw new Error(translateAuthError(error.message))
      return data.user
    },
    async signUp(email, password) {
      const { data, error } = await sb.auth.signUp({ email, password })
      if (error) throw new Error(translateAuthError(error.message))
      if (!data.session) return { needsConfirmation: true }
      return { user: data.user }
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async updatePassword(password) {
      const { error } = await sb.auth.updateUser({ password })
      if (error) throw new Error(translateAuthError(error.message))
    },
    async list(table) {
      return check(await sb.from(table).select('*').order('created_at', { ascending: true }))
    },
    async insert(table, row) {
      return check(await sb.from(table).insert(row).select().single())
    },
    async update(table, id, patch) {
      return check(await sb.from(table).update(patch).eq('id', id).select().single())
    },
    async remove(table, id) {
      check(await sb.from(table).delete().eq('id', id))
    },
  }
}

function translateAuthError(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'الإيميل أو كلمة المرور غير صحيحة'
  if (m.includes('already registered')) return 'الإيميل ده مسجّل بالفعل'
  if (m.includes('password should be')) return 'كلمة المرور ضعيفة — استخدم 8 حروف على الأقل'
  if (m.includes('signups not allowed')) return 'التسجيل مقفول على الموقع ده'
  if (m.includes('email not confirmed')) return 'لازم تأكد الإيميل الأول من الرسالة اللي وصلتك'
  return msg
}

/* ----------------------------- Local demo ----------------------------- */

function localBackend() {
  const USERS = 'namaa:users'
  const SESSION = 'namaa:session'
  const listeners = new Set()
  const read = (k, fallback) => {
    try {
      return JSON.parse(storage.getItem(k)) ?? fallback
    } catch {
      return fallback
    }
  }
  const write = (k, v) => storage.setItem(k, JSON.stringify(v))
  const emit = (user) => listeners.forEach((cb) => cb(user))
  const currentUser = () => {
    const id = read(SESSION, null)
    const u = read(USERS, []).find((x) => x.id === id)
    return u ? { id: u.id, email: u.email } : null
  }
  const key = (table) => {
    const u = currentUser()
    if (!u) throw new Error('غير مسجّل الدخول')
    if (!TABLES.includes(table)) throw new Error('جدول غير معروف')
    return `namaa:data:${u.id}:${table}`
  }

  async function hash(password, salt) {
    const enc = new TextEncoder()
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' },
      base,
      256,
    )
    return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  return {
    async getUser() {
      return currentUser()
    },
    onAuthChange(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    async signIn(email, password) {
      email = email.trim().toLowerCase()
      const u = read(USERS, []).find((x) => x.email === email)
      if (!u || (await hash(password, u.salt)) !== u.hash) throw new Error('الإيميل أو كلمة المرور غير صحيحة')
      write(SESSION, u.id)
      const user = { id: u.id, email: u.email }
      emit(user)
      return user
    },
    async signUp(email, password) {
      email = email.trim().toLowerCase()
      const users = read(USERS, [])
      if (users.some((x) => x.email === email)) throw new Error('الإيميل ده مسجّل بالفعل')
      const salt = crypto.randomUUID()
      const u = { id: crypto.randomUUID(), email, salt, hash: await hash(password, salt) }
      write(USERS, [...users, u])
      write(SESSION, u.id)
      const user = { id: u.id, email }
      emit(user)
      return { user }
    },
    async signOut() {
      storage.removeItem(SESSION)
      emit(null)
    },
    async updatePassword(password) {
      const id = read(SESSION, null)
      const salt = crypto.randomUUID()
      const h = await hash(password, salt)
      write(USERS, read(USERS, []).map((u) => (u.id === id ? { ...u, salt, hash: h } : u)))
    },
    async list(table) {
      return read(key(table), [])
    },
    async insert(table, row) {
      const full = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }
      write(key(table), [...read(key(table), []), full])
      return full
    },
    async update(table, id, patch) {
      let updated = null
      write(
        key(table),
        read(key(table), []).map((r) => (r.id === id ? (updated = { ...r, ...patch }) : r)),
      )
      return updated
    },
    async remove(table, id) {
      const rows = read(key(table), []).filter((r) => r.id !== id)
      write(key(table), rows)
      // Mirror the database's ON DELETE CASCADE for habit logs.
      if (table === 'habits') {
        const lk = key('habit_logs')
        write(lk, read(lk, []).filter((l) => l.habit_id !== id))
      }
    },
  }
}

export const backend = isCloud ? cloudBackend() : localBackend()
