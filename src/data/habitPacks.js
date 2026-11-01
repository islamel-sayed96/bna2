// Ready-made habit packs. Adding a pack skips habits you already have (same name).
const ALL = [0, 1, 2, 3, 4, 5, 6]
const h = (name, icon, color, kind = 'build', note = null) => ({ name, icon, color, kind, note, days: ALL })

export const HABIT_PACKS = [
  {
    id: 'fitness',
    name: 'لياقة وصحة',
    icon: '🏋️',
    section: '🏋️ لياقة وصحة',
    habits: [
      h('الذهاب للجيم', '🏋️', 'violet'),
      h('جري 30 دقيقة كارديو', '🏃', 'sky'),
      h('أكل صحي', '🥗', 'emerald'),
      h('عدم الأكل بالخارج', '🍔', 'orange'),
      h('المكملات واحتياج البروتين', '💊', 'rose'),
    ],
  },
  {
    id: 'prayers',
    name: 'الصلوات الخمس',
    icon: '🕌',
    section: '🕌 الصلاة',
    habits: [
      h('الفجر', '🌅', 'indigo'),
      h('الظهر', '☀️', 'amber'),
      h('العصر', '🌤️', 'orange'),
      h('المغرب', '🌇', 'rose'),
      h('العشاء', '🌙', 'violet'),
    ],
  },
  {
    id: 'sunnah',
    name: 'سنن وأذكار (إضافي)',
    icon: '✨',
    section: '✨ إضافي — سنن وأذكار',
    habits: [
      h('سنة الفجر', '🌅', 'amber', 'bonus'),
      h('سنة الظهر', '☀️', 'amber', 'bonus'),
      h('سنة العصر', '🌤️', 'amber', 'bonus'),
      h('سنة المغرب', '🌇', 'amber', 'bonus'),
      h('سنة العشاء', '🌙', 'amber', 'bonus'),
      h('أذكار الصباح', '📿', 'teal', 'bonus'),
      h('أذكار المساء', '📿', 'teal', 'bonus'),
    ],
  },
  {
    id: 'avoid',
    name: 'عادة أتجنبها (X)',
    icon: '🚫',
    section: '🚫 عادات أتجنبها',
    habits: [h('العادة X', '❌', 'rose', 'avoid', 'علّم ✕ بس في اليوم اللي تقع فيها — وكل يوم نضيف بيزود السلسلة')],
  },
]
