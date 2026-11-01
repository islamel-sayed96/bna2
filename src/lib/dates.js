// All dates are handled as local 'YYYY-MM-DD' keys so "today" matches the user's clock.
export const pad = (n) => String(n).padStart(2, '0')
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const todayKey = () => toKey(new Date())
export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const addDaysKey = (k, n) => toKey(addDays(fromKey(k), n))

// Week starts on Saturday (common in Egypt / the Gulf).
export const startOfWeek = (d) => addDays(d, -((d.getDay() + 1) % 7))

export const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
export const DAY_SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
// Display order for day pickers, starting Saturday.
export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5]

const fmt = (opts) => new Intl.DateTimeFormat('ar-EG', opts)
export const formatLong = (d) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(d)
export const formatShort = (d) => fmt({ day: 'numeric', month: 'short' }).format(d)
export const formatMonth = (d) => fmt({ month: 'long', year: 'numeric' }).format(d)
export const formatDateTime = (iso) =>
  fmt({ day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

export function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const suffix = h < 12 ? 'ص' : 'م'
  const hh = h % 12 || 12
  return `${hh}:${pad(m)} ${suffix}`
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'ليلة سعيدة'
  if (h < 12) return 'صباح الخير'
  if (h < 17) return 'نهارك سعيد'
  return 'مساء الخير'
}
