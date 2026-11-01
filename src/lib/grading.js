// Lenient grading for typed answers + a word-level diff to show what was wrong.

const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is',
  "it's": 'it is', "that's": 'that is', "what's": 'what is', "there's": 'there is', "here's": 'here is', "who's": 'who is',
  "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have',
  "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "they'll": 'they will', "he'll": 'he will', "she'll": 'she will', "it'll": 'it will', "that'll": 'that will',
  "i'd": 'i would', "you'd": 'you would', "we'd": 'we would', "they'd": 'they would', "he'd": 'he would', "she'd": 'she would',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'cannot', "couldn't": 'could not', "won't": 'will not',
  "wouldn't": 'would not', "shouldn't": 'should not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not', "mustn't": 'must not', "let's": 'let us',
  gonna: 'going to', wanna: 'want to', gotta: 'got to',
  // typed without the apostrophe
  im: 'i am', ive: 'i have', youre: 'you are', theyre: 'they are', thats: 'that is', whats: 'what is',
  dont: 'do not', doesnt: 'does not', didnt: 'did not', isnt: 'is not', arent: 'are not', wasnt: 'was not',
  couldnt: 'could not', shouldnt: 'should not', wouldnt: 'would not', havent: 'have not', hasnt: 'has not', lets: 'let us',
}

const AR_DIACRITICS = /[ً-ٰٟـ]/g

export function normalize(s = '') {
  let t = String(s)
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(AR_DIACRITICS, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/…|\.\.\./g, ' ')
  t = t.replace(/[^\p{L}\p{N}'\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
  return t
    .split(' ')
    .map((w) => CONTRACTIONS[w] ?? w)
    .join(' ')
    .replace(/'/g, '')
}

const words = (s) => normalize(s).split(' ').filter(Boolean)

// Longest-common-subsequence diff on words of the *expected* vs *given* answer.
export function wordDiff(expected, given) {
  // Expand each word (e.g. "I'm" -> "i am") but keep the original spelling for display.
  const tokens = (str) =>
    String(str)
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((w) => {
        const n = normalize(w).split(' ').filter(Boolean)
        return n.map((x) => ({ n: x, raw: n.length === 1 ? w : x }))
      })
  const a = tokens(expected)
  const b = tokens(given)
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--) dp[i][j] = a[i].n === b[j].n ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (a[i].n === b[j].n) {
      out.push({ t: 'same', w: a[i].raw })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ t: 'missing', w: a[i].raw })
      i++
    } else {
      out.push({ t: 'extra', w: b[j].raw })
      j++
    }
  }
  while (i < m) out.push({ t: 'missing', w: a[i++].raw })
  while (j < n) out.push({ t: 'extra', w: b[j++].raw })
  const same = out.filter((x) => x.t === 'same').length
  const ratio = m + n ? (2 * same) / (m + n) : 1
  return { parts: out, ratio }
}

// Grade a typed answer against the main answer + accepted alternatives.
export function gradeText(q, given) {
  const targets = [q.answer_text, ...(q.accepted ?? [])].filter(Boolean)
  const g = normalize(given)
  if (!g) return { correct: false, score: 0, level: 'empty', diff: wordDiff(targets[0] ?? '', '') }
  let best = null
  for (const t of targets) {
    const d = wordDiff(t, given)
    const exact = normalize(t) === g
    const cand = { target: t, diff: d, exact, score: exact ? 1 : d.ratio }
    if (!best || cand.score > best.score) best = cand
  }
  const level = best.exact ? 'exact' : best.score >= 0.85 ? 'close' : 'wrong'
  // Only an exact (normalised) match counts; "close" still shows the diff and goes to the review list.
  return { correct: level === 'exact', score: best.score, level, diff: best.diff, target: best.target }
}

// Which required keywords appear in a written answer.
export function keywordCheck(keywords = [], given = '') {
  const g = ` ${normalize(given)} `
  return keywords.map((k) => ({ k, ok: g.includes(` ${normalize(k)} `) || g.includes(normalize(k)) }))
}

export const wordCount = (s = '') => String(s).trim().split(/\s+/).filter(Boolean).length
export { words }
