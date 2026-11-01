// Full class strings so Tailwind keeps them in the build.
export const COLORS = {
  teal: { dot: 'bg-teal-500', soft: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300', fill: 'bg-teal-500 text-white', ring: 'ring-teal-500', bar: 'bg-teal-500', stroke: '#14b8a6' },
  violet: { dot: 'bg-violet-500', soft: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300', fill: 'bg-violet-500 text-white', ring: 'ring-violet-500', bar: 'bg-violet-500', stroke: '#8b5cf6' },
  amber: { dot: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', fill: 'bg-amber-500 text-white', ring: 'ring-amber-500', bar: 'bg-amber-500', stroke: '#f59e0b' },
  rose: { dot: 'bg-rose-500', soft: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300', fill: 'bg-rose-500 text-white', ring: 'ring-rose-500', bar: 'bg-rose-500', stroke: '#f43f5e' },
  sky: { dot: 'bg-sky-500', soft: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300', fill: 'bg-sky-500 text-white', ring: 'ring-sky-500', bar: 'bg-sky-500', stroke: '#0ea5e9' },
  emerald: { dot: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', fill: 'bg-emerald-500 text-white', ring: 'ring-emerald-500', bar: 'bg-emerald-500', stroke: '#10b981' },
  indigo: { dot: 'bg-indigo-500', soft: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300', fill: 'bg-indigo-500 text-white', ring: 'ring-indigo-500', bar: 'bg-indigo-500', stroke: '#6366f1' },
  orange: { dot: 'bg-orange-500', soft: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300', fill: 'bg-orange-500 text-white', ring: 'ring-orange-500', bar: 'bg-orange-500', stroke: '#f97316' },
  slate: { dot: 'bg-slate-400', soft: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300', fill: 'bg-slate-500 text-white', ring: 'ring-slate-400', bar: 'bg-slate-400', stroke: '#94a3b8' },
}
export const color = (name) => COLORS[name] ?? COLORS.teal
export const HABIT_COLORS = ['teal', 'violet', 'amber', 'rose', 'sky', 'emerald', 'indigo', 'orange']
