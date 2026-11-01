// Pastel widget palette. Full class strings so Tailwind keeps them in the build.
// row/head/hl are hex values used inline (pastel rows, header bands, highlighter marks).
const make = (name, row, head, hl, darkRow) => ({
  dot: `bg-${name}-400`,
  soft: `bg-${name}-100/70 text-${name}-700 dark:bg-${name}-500/15 dark:text-${name}-300`,
  fill: `bg-${name}-400 text-white`,
  ring: `ring-${name}-400`,
  bar: `bg-${name}-400`,
  row,
  head,
  hl,
  darkRow,
})

export const COLORS = {
  teal: make('teal', '#ddf4ef', '#bfeadf', '#9fe3d3', 'rgb(45 212 191 / .12)'),
  violet: make('violet', '#eee8fc', '#dacffa', '#cdbdf6', 'rgb(139 92 246 / .14)'),
  amber: make('amber', '#fff4d6', '#ffe6a6', '#ffe08a', 'rgb(245 158 11 / .12)'),
  rose: make('rose', '#fde6ec', '#fbcad6', '#f9b4c4', 'rgb(244 63 94 / .12)'),
  sky: make('sky', '#e0f1fc', '#c4e5f9', '#a9d8f5', 'rgb(14 165 233 / .12)'),
  emerald: make('emerald', '#e0f6e7', '#c4edd2', '#a6e3ba', 'rgb(16 185 129 / .12)'),
  indigo: make('indigo', '#e6e9fc', '#cfd5f8', '#b7c0f4', 'rgb(99 102 241 / .14)'),
  orange: make('orange', '#ffeadc', '#ffd6bc', '#ffc39e', 'rgb(249 115 22 / .12)'),
  slate: make('slate', '#eff1f5', '#dde2ea', '#cbd2dd', 'rgb(148 163 184 / .12)'),
}
export const color = (name) => COLORS[name] ?? COLORS.violet
export const HABIT_COLORS = ['violet', 'rose', 'amber', 'teal', 'sky', 'emerald', 'indigo', 'orange']
export const RAINBOW = ['violet', 'sky', 'teal', 'emerald', 'amber', 'rose']

// Marker-style highlight behind text.
export const highlight = (hex) => ({
  backgroundImage: `linear-gradient(transparent 58%, ${hex} 58%, ${hex} 92%, transparent 92%)`,
  padding: '0 2px',
})

// Tailwind safelist hint (keeps dynamic class names in the build):
// bg-teal-400 bg-violet-400 bg-amber-400 bg-rose-400 bg-sky-400 bg-emerald-400 bg-indigo-400 bg-orange-400 bg-slate-400
// ring-teal-400 ring-violet-400 ring-amber-400 ring-rose-400 ring-sky-400 ring-emerald-400 ring-indigo-400 ring-orange-400 ring-slate-400
// bg-teal-100/70 bg-violet-100/70 bg-amber-100/70 bg-rose-100/70 bg-sky-100/70 bg-emerald-100/70 bg-indigo-100/70 bg-orange-100/70 bg-slate-100/70
// text-teal-700 text-violet-700 text-amber-700 text-rose-700 text-sky-700 text-emerald-700 text-indigo-700 text-orange-700 text-slate-700
// dark:bg-teal-500/15 dark:bg-violet-500/15 dark:bg-amber-500/15 dark:bg-rose-500/15 dark:bg-sky-500/15 dark:bg-emerald-500/15 dark:bg-indigo-500/15 dark:bg-orange-500/15 dark:bg-slate-500/15
// dark:text-teal-300 dark:text-violet-300 dark:text-amber-300 dark:text-rose-300 dark:text-sky-300 dark:text-emerald-300 dark:text-indigo-300 dark:text-orange-300 dark:text-slate-300
