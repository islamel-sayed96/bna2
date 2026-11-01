"""Turn the English study workbook into two question packs (JSON).

usage: python3 -I scripts/build_english_packs.py <workbook.xlsx> <public_out.json> <personal_out.json>

The public pack (phrases, idioms, expressions) can ship with the site.
The personal pack (interview answers, "about me", course work) must NOT be bundled:
import it from the site's "استيراد ملف" button so it lives only in your account.
"""
import json
import random
import re
import sys

import openpyxl

random.seed(7)
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)


def clean(v):
    if v is None:
        return ''
    return re.sub(r'\s+', ' ', str(v)).strip()


def rows(sheet, header_row):
    ws = wb[sheet]
    out = []
    for i, r in enumerate(ws.iter_rows(values_only=True), 1):
        if i <= header_row:
            continue
        cells = [clean(c) for c in r]
        if sum(1 for c in cells if c) >= 2:
            out.append(cells)
    return out


def split_alts(en):
    """'A / B' -> ['A', 'B']; strips trailing ellipsis."""
    parts = [p.strip() for p in re.split(r'\s+/\s+', en) if p.strip()]
    return [re.sub(r'(…|\.\.\.)$', '', p).strip() for p in parts]


ROOT = {'key': 'en', 'name': 'الإنجليزي', 'icon': '🇬🇧', 'color': 'sky', 'parent': None}


def translate_q(cat, ar, en, explanation='', prompt='اكتب بالإنجليزي'):
    alts = split_alts(en)
    if not alts or not ar:
        return None
    return {
        'category': cat, 'type': 'text', 'lang': 'en',
        'text': f'{prompt}: «{ar}»',
        'answer_text': alts[0], 'accepted': alts[1:],
        'explanation': explanation or None,
    }


def mcq_meaning(cat, en, ar, pool, explanation=''):
    wrong = [p for p in pool if p != ar]
    if len(wrong) < 3:
        return None
    options = random.sample(wrong, 3) + [ar]
    random.shuffle(options)
    return {
        'category': cat, 'type': 'mcq', 'lang': 'en',
        'text': f'إيه معنى: “{en}”؟', 'options': options, 'answer': options.index(ar),
        'explanation': explanation or None,
    }


def phrase_sheet(cat, pairs, mcq_every=3):
    """pairs: [(en, ar, explanation)] -> mix of typed translations (writing focus) and meaning MCQs."""
    pool = [ar for _, ar, _ in pairs]
    qs = []
    for i, (en, ar, ex) in enumerate(pairs):
        q = mcq_meaning(cat, en, ar, pool, ex) if mcq_every and i % mcq_every == mcq_every - 1 else None
        q = q or translate_q(cat, ar, en, ex)
        if q:
            qs.append(q)
    return qs


public = {'name': 'الإنجليزي — تعبيرات وجمل', 'categories': [ROOT], 'questions': []}
personal = {'name': 'الإنجليزي — مقابلات وعنّي والكورس', 'categories': [ROOT], 'questions': []}


def sub(pack, key, name, icon):
    pack['categories'].append({'key': key, 'name': name, 'icon': icon, 'color': 'sky', 'parent': 'en'})


# ── Sheet 1: language combinations (Part headers + notes, then English || Arabic rows) ──
sub(public, 'combos', 'تركيبات لغوية', '🧱')
pairs, notes, part = [], [], ''
for r in wb['التركيبات اللغوية'].iter_rows(values_only=True):
    c = [clean(x) for x in r]
    filled = [x for x in c if x]
    if not filled:
        continue
    if filled[0].startswith('Part '):
        part, notes = filled[0], []
        continue
    if len(filled) == 1:
        if filled[0] != 'الحوار':
            notes.append(filled[0])
        continue
    en, ar = filled[0], filled[1]
    if en == 'English' or re.match(r'^\w+:', en):  # header or dialogue line
        continue
    pairs.append((en, ar, f'{part} — ' + ' '.join(notes) if notes else part))
public['questions'] += phrase_sheet('combos', pairs)

# ── Chapter 37 different sentences / Chapter 38 idioms ──
for key, name, icon, sheet, every in [('sentences', 'جمل مختلفة', '💬', 'جمل مختلفة', 3), ('idioms', 'مصطلحات (Idioms)', '🎭', 'مصطلحات', 2)]:
    sub(public, key, name, icon)
    pairs, section = [], ''
    for c in rows(sheet, 0):
        filled = [x for x in c if x]
        if filled[0] == 'English':
            continue
        en, ar = filled[0], filled[1]
        note = filled[2] if len(filled) > 2 else ''
        pairs.append((en, ar, note))
    public['questions'] += phrase_sheet(key, pairs, every)

# ── Say / don't say ──
sub(public, 'saynot', 'قل ولا تقل', '⚖️')
for c in rows('قل ولا تقل - فروق الاستخدام', 5):
    basic, alt, meaning, diff, example = (c + [''] * 5)[:5]
    q = translate_q('saynot', meaning, basic, f'{diff} مثال: {example}'.strip())
    if q:
        q['accepted'] += split_alts(alt)
        public['questions'].append(q)

# ── Expression sheets: expr || ar || explanation || example ──
expr_sheets = [
    ('daily', 'تعبيرات يومية', '☕', ['تعبيرات يومية 1', 'تعبيرات يومية 2-4']),
    ('work', 'الشغل والنقاش', '💼', ['الشغل والنقاش']),
    ('situations', 'مواقف ومفردات', '🗣️', ['مواقف ومفردات']),
    ('chat', 'اختصارات الشات', '📱', ['اختصارات الشات']),
    ('over', 'استخدامات over', '🔁', ['استخدامات over']),
    ('encourage', 'عبارات تشجيعية', '💪', ['عبارات تشجيعية']),
]
for key, name, icon, sheets in expr_sheets:
    sub(public, key, name, icon)
    pairs = []
    for s in sheets:
        for c in rows(s, 5):
            en, ar, ex, example = (c + [''] * 4)[:4]
            pairs.append((en, ar, ' '.join(x for x in [ex, f'مثال: {example}' if example else ''] if x)))
    public['questions'] += phrase_sheet(key, pairs, 3)

# ── My requests in English ──
sub(public, 'requests', 'طلباتي بالإنجليزي', '🙋')
pairs = []
for c in rows('طلباتي بالإنجليزي', 5):
    use, en, ar, ex = (c + [''] * 4)[:4]
    pairs.append((en, ar, f'{use}: {ex}' if ex else use))
public['questions'] += phrase_sheet('requests', pairs, 4)

# ══════════════ Personal pack ══════════════
sub(personal, 'interview', 'مقابلات العمل', '🎤')
for c in rows('مقابلات العمل', 5):
    q_en, q_ar, model, model_ar, notes = (c + [''] * 5)[:5]
    if q_en and model:
        personal['questions'].append({
            'category': 'interview', 'type': 'writing', 'lang': 'en',
            'text': f'{q_en}\n({q_ar})', 'answer_text': model,
            'explanation': ' '.join(x for x in [f'الترجمة: {model_ar}' if model_ar else '', notes] if x) or None,
        })

sub(personal, 'aboutme', 'عنّي — أسئلة وإجابات', '🙂')
for c in rows('عنّي - أسئلة وإجابات', 4):
    q, version, en, ar = (c + [''] * 4)[:4]
    if not (q and en):
        continue
    q_en = q.split(' / ')[0]
    label = ' (إجابة مفصّلة)' if version.startswith('Detailed') else ''
    personal['questions'].append({
        'category': 'aboutme', 'type': 'writing', 'lang': 'en',
        'text': f'{q}{label}', 'answer_text': en.replace(' /  / ', '\n\n'),
        'explanation': f'المعنى: {ar}' if ar else None,
    })

sub(personal, 'aboutwords', 'عنّي — كلمات وتعبيرات', '📝')
pairs = []
for c in rows('عنّي - كلمات وتعبيرات', 4):
    en, ar, ex, ex_ar = (c + [''] * 4)[:4]
    pairs.append((en, ar, f'مثال: {ex} — {ex_ar}' if ex else ''))
pairs += [((c + [''])[0], (c + ['', ''])[1], (c + ['', '', ''])[2]) for c in rows('عنّي - محادثات يومية', 4)]
personal['questions'] += phrase_sheet('aboutwords', pairs, 4)

sub(personal, 'course_q', 'الكورس — أسئلة الفصول', '📚')
for c in rows('كورس - أسئلة الفصول', 5):
    ch, q_en, q_ar, a_en = (c + [''] * 4)[:4]
    if q_en and a_en:
        personal['questions'].append({
            'category': 'course_q', 'type': 'writing', 'lang': 'en',
            'text': f'[{ch}] {q_en}\n({q_ar})', 'answer_text': a_en, 'explanation': None,
        })

sub(personal, 'course_words', 'الكورس — الكلمات المهمة', '🔤')
for c in rows('كورس - الكلمات المهمة', 5):
    ch, en, ar, ex = (c + [''] * 4)[:4]
    q = translate_q('course_words', ar, en, f'[{ch}] مثال: {ex}' if ex else f'[{ch}]')
    if q:
        personal['questions'].append(q)

sub(personal, 'course_fix', 'الكورس — التصحيحات', '✏️')
for c in rows('كورس - التصحيحات', 5):
    wrong, right, why = (c + [''] * 3)[:3]
    if wrong and right:
        personal['questions'].append({
            'category': 'course_fix', 'type': 'text', 'lang': 'en',
            'text': f'صحّح الجملة: “{wrong}”', 'answer_text': split_alts(right)[0],
            'accepted': split_alts(right)[1:], 'explanation': why or None,
        })

sub(personal, 'course_dialog', 'الكورس — حوار وجمل', '💭')
pairs = [((c + ['', ''])[1], (c + ['', '', ''])[2], (c + [''])[0]) for c in rows('كورس - حوار وجمل', 5)]
personal['questions'] += phrase_sheet('course_dialog', pairs, 0)

sub(personal, 'course_tasks', 'الكورس — فيديو تاسك وبرزنتيشن', '🎬')
for c in rows('كورس - فيديو تاسك', 5):
    topic, task, words, text = (c + [''] * 4)[:4]
    if text:
        personal['questions'].append({
            'category': 'course_tasks', 'type': 'writing', 'lang': 'en',
            'text': f'[{topic}] {task}', 'answer_text': text,
            'keywords': [w.strip() for w in words.split(';') if w.strip()],
            'explanation': None,
        })
for c in rows('كورس - البرزنتيشنز', 5):
    ch, part, en, ar = (c + [''] * 4)[:4]
    if en and part != 'المطلوب':
        personal['questions'].append({
            'category': 'course_tasks', 'type': 'writing', 'lang': 'en',
            'text': f'[{ch}] اكتب: {part}', 'answer_text': en,
            'explanation': f'المعنى: {ar}' if ar else None,
        })

for pack, path in [(public, sys.argv[2]), (personal, sys.argv[3])]:
    json.dump(pack, open(path, 'w'), ensure_ascii=False, indent=1)
    counts = {}
    for q in pack['questions']:
        counts[q['category']] = counts.get(q['category'], 0) + 1
    print(pack['name'], len(pack['questions']), counts)
