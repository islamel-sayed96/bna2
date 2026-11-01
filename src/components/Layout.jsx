import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Repeat2, CalendarDays, Brain, LogOut, Moon, Sun, Settings } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { backend, isCloud } from '../lib/backend'
import { useTheme } from '../lib/theme'
import Logo from './Logo'

const NAV = [
  { to: '/', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/habits', label: 'العادات', icon: Repeat2 },
  { to: '/schedule', label: 'الجدول', icon: CalendarDays },
  { to: '/skills', label: 'المهارات', icon: Brain },
]

export default function Layout() {
  const { user } = useAuth()
  const [dark, toggleTheme] = useTheme()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
    }`

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-slate-200/70 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={19} /> {label}
            </NavLink>
          ))}
          <NavLink to="/settings" className={linkClass}>
            <Settings size={19} /> الإعدادات
          </NavLink>
        </nav>
        {!isCloud && (
          <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            وضع تجريبي: البيانات محفوظة في المتصفح ده بس.
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 p-3 dark:border-slate-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold uppercase text-white">
            {user?.email?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-slate-500 dark:text-slate-400" dir="ltr">{user?.email}</div>
          </div>
          <button onClick={toggleTheme} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="تغيير المظهر">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button onClick={() => backend.signOut()} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40" title="تسجيل الخروج">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 lg:hidden">
        <Logo small />
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <NavLink to="/settings" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Settings size={18} />
          </NavLink>
          <button onClick={() => backend.signOut()} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200/70 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-brand-700 dark:text-brand-400' : 'text-slate-500'}`
            }
          >
            <Icon size={21} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
