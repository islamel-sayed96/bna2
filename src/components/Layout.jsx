import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, Moon, Sun, Settings } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { backend, isCloud } from '../lib/backend'
import { useTheme } from '../lib/theme'
import Logo from './Logo'

const NAV = [
  { to: '/', label: 'الرئيسية', emoji: '🏠', end: true },
  { to: '/habits', label: 'العادات', emoji: '🔁' },
  { to: '/schedule', label: 'الجدول', emoji: '🗓️' },
  { to: '/skills', label: 'المهارات', emoji: '🧠' },
]

export default function Layout() {
  const { user } = useAuth()
  const [dark, toggleTheme] = useTheme()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium transition ${
      isActive
        ? 'bg-white text-ink shadow-sm ring-1 ring-[#e8e3f8] dark:bg-white/10 dark:text-white dark:ring-white/5'
        : 'text-ink-soft hover:bg-white/60 hover:text-ink dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
    }`

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar (desktop) — Notion-like */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-[#e6e1f6] bg-[#f8f6fd]/90 px-3 py-6 backdrop-blur dark:border-white/5 dark:bg-[#1a1830]/90 lg:flex">
        <div className="px-3">
          <Logo />
        </div>

        <div className="mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/70">صفحاتي</div>
        <nav className="mt-2 flex flex-col gap-0.5">
          {NAV.map(({ to, label, emoji, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <span className="text-lg">{emoji}</span> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/70">الحساب</div>
        <nav className="mt-2 flex flex-1 flex-col gap-0.5">
          <NavLink to="/settings" className={linkClass}>
            <span className="text-lg">⚙️</span> الإعدادات
          </NavLink>
        </nav>

        {!isCloud && (
          <div className="sticky-note mx-1 mb-5 rotate-[-1.5deg] p-3 text-xs leading-relaxed">
            <span className="tape !h-4 !w-14" />
            📌 وضع تجريبي: البيانات محفوظة في المتصفح ده بس.
          </div>
        )}
        <div className="flex items-center gap-2.5 rounded-2xl bg-white p-2.5 ring-1 ring-[#e8e3f8] dark:bg-white/5 dark:ring-white/5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-rose-300 font-display text-base font-bold uppercase text-white">
            {user?.email?.[0]}
          </div>
          <div className="min-w-0 flex-1 truncate text-xs text-ink-soft dark:text-slate-400" dir="ltr">{user?.email}</div>
          <button onClick={toggleTheme} className="rounded-lg p-1.5 text-ink-soft hover:bg-brand-50 dark:hover:bg-white/10" title="تغيير المظهر">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button onClick={() => backend.signOut()} className="rounded-lg p-1.5 text-ink-soft hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40" title="تسجيل الخروج">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e6e1f6] bg-[#f8f6fd]/90 px-4 py-2.5 backdrop-blur dark:border-white/5 dark:bg-[#1a1830]/90 lg:hidden">
        <Logo small />
        <div className="flex items-center gap-1 text-ink-soft">
          <button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-white dark:hover:bg-white/10">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <NavLink to="/settings" className="rounded-lg p-2 hover:bg-white dark:hover:bg-white/10"><Settings size={18} /></NavLink>
          <button onClick={() => backend.signOut()} className="rounded-lg p-2 hover:bg-white dark:hover:bg-white/10"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-7 sm:px-6 lg:px-10 lg:pb-14 lg:pt-12">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl bg-white/95 p-1.5 shadow-card ring-1 ring-[#e8e3f8] backdrop-blur dark:bg-[#1f1c38]/95 dark:ring-white/10 lg:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map(({ to, label, emoji, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition ${isActive ? 'bg-brand-50 text-ink dark:bg-white/10 dark:text-white' : 'text-ink-soft'}`
            }
          >
            <span className="text-xl leading-none">{emoji}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
