// Versant Matching Algorithm — Weighted Scoring v1
// Option B: Weighted scoring based on quiz compatibility

export interface QuizAnswers {
  coreValues?: string[]
  lifestyleWants?: string[]
  kids?: string
  vision?: string
  location?: string
  loveLanguage?: string[]
  independence?: number
  activity?: string
  week?: string[]
  conflict?: string[]
  attachment?: string
  dealbreakers?: string[]
}

export interface UserProfile {
  id: string
  first_name?: string
  full_name?: string
  nickname?: string
  age?: number
  city?: string
  state?: string
  gender?: string
  seeking?: string
  min_age?: number
  max_age?: number
  occupation?: string
  education?: string
  politics_importance?: string
  quiz_answers?: QuizAnswers
  dealbreakers?: string[]
  attachment_style?: string
  avatar_url?: string
  quiz_completed?: boolean
}

// ─── WEIGHTS (must sum to 100) ───────────────────────────────
const WEIGHTS = {
  dealbreakers: 40,
  coreValues: 25,
  lifestyle: 20,
  lifePlans: 15,
}

// ─── MAIN SCORING FUNCTION ───────────────────────────────────
export function scoreCompatibility(
  userA: UserProfile,
  userB: UserProfile
): number {
  const aQ = userA.quiz_answers ?? {}
  const bQ = userB.quiz_answers ?? {}

  // If either user has no quiz answers give a base score of 50
  if (!userA.quiz_answers && !userB.quiz_answers) return 50

  // Hard filter — dealbreakers (instant 0 if violated)
  if (hasDealbreaker(userA, userB)) return 0
  if (hasDealbreaker(userB, userA)) return 0

  let score = 0

  score += scoreDealbreakers(aQ, bQ) * WEIGHTS.dealbreakers
  score += scoreArrayOverlap(aQ.coreValues, bQ.coreValues) * WEIGHTS.coreValues
  score += scoreLifestyle(aQ, bQ) * WEIGHTS.lifestyle
  score += scoreLifePlans(aQ, bQ) * WEIGHTS.lifePlans

  // Minimum score of 40 so demo profiles always show
  return Math.round(Math.min(Math.max(score, 40), 99))
}

// ─── HARD DEALBREAKER CHECK ──────────────────────────────────
function hasDealbreaker(userA: UserProfile, userB: UserProfile): boolean {
  const aBreakers = userA.dealbreakers ?? userA.quiz_answers?.dealbreakers ?? []
  const bQ = userB.quiz_answers ?? {}

  for (const breaker of aBreakers) {
    switch (breaker) {
      case 'nokids':
        if (bQ.kids === 'soon' || bQ.kids === 'later') return true
        break
      case 'nomarriage':
        if (bQ.vision === 'career') return true
        break
      case 'distance':
        if (bQ.location === 'remote') return true
        break
      case 'noambition':
        if (
          bQ.lifestyleWants?.includes('success') === false &&
          bQ.lifestyleWants?.includes('build') === false
        ) return true
        break
    }
  }
  return false
}

// ─── DEALBREAKER ALIGNMENT ───────────────────────────────────
function scoreDealbreakers(aQ: QuizAnswers, bQ: QuizAnswers): number {
  let points = 0
  let total = 0

  total++
  if (aQ.kids && bQ.kids) {
    if (aQ.kids === bQ.kids) points += 1
    else if (
      (aQ.kids === 'soon' && bQ.kids === 'later') ||
      (aQ.kids === 'later' && bQ.kids === 'soon') ||
      (aQ.kids === 'maybe' && bQ.kids !== 'never') ||
      (bQ.kids === 'maybe' && aQ.kids !== 'never')
    ) points += 0.7
    else if (aQ.kids === 'never' || bQ.kids === 'never') points += 0
    else points += 0.4
  } else points += 0.5

  total++
  if (aQ.location && bQ.location) {
    if (aQ.location === bQ.location) points += 1
    else if (aQ.location === 'love' || bQ.location === 'love') points += 0.8
    else if (aQ.location === 'open' || bQ.location === 'open') points += 0.6
    else points += 0.3
  } else points += 0.5

  total++
  if (aQ.vision && bQ.vision) {
    if (aQ.vision === bQ.vision) points += 1
    else if (
      (aQ.vision === 'suburbs' && bQ.vision === 'city') ||
      (aQ.vision === 'city' && bQ.vision === 'suburbs')
    ) points += 0.5
    else points += 0.3
  } else points += 0.5

  return total > 0 ? points / total : 0.5
}

// ─── ARRAY OVERLAP SCORE ─────────────────────────────────────
function scoreArrayOverlap(a?: string[], b?: string[]): number {
  if (!a?.length || !b?.length) return 0.4
  const intersection = a.filter(v => b.includes(v))
  const union = [...new Set([...a, ...b])]
  return union.length > 0 ? intersection.length / union.length : 0
}

// ─── LIFESTYLE SCORE ─────────────────────────────────────────
function scoreLifestyle(aQ: QuizAnswers, bQ: QuizAnswers): number {
  let points = 0
  let total = 0

  total++
  if (aQ.activity && bQ.activity) {
    if (aQ.activity === bQ.activity) points += 1
    else if (
      (aQ.activity === 'very' && bQ.activity === 'moderate') ||
      (aQ.activity === 'moderate' && bQ.activity === 'very') ||
      (aQ.activity === 'moderate' && bQ.activity === 'light') ||
      (aQ.activity === 'light' && bQ.activity === 'moderate')
    ) points += 0.6
    else points += 0.2
  } else points += 0.5

  total++
  points += scoreArrayOverlap(aQ.week, bQ.week)

  total++
  if (aQ.independence !== undefined && bQ.independence !== undefined) {
    const diff = Math.abs(aQ.independence - bQ.independence)
    if (diff <= 1) points += 1
    else if (diff <= 3) points += 0.7
    else if (diff <= 5) points += 0.4
    else points += 0.1
  } else points += 0.5

  total++
  points += scoreArrayOverlap(aQ.loveLanguage, bQ.loveLanguage)

  return total > 0 ? points / total : 0.5
}

// ─── LIFE PLANS SCORE ────────────────────────────────────────
function scoreLifePlans(aQ: QuizAnswers, bQ: QuizAnswers): number {
  let points = 0
  let total = 0

  total++
  points += scoreArrayOverlap(aQ.lifestyleWants, bQ.lifestyleWants)

  total++
  points += scoreArrayOverlap(aQ.conflict, bQ.conflict)

  total++
  if (aQ.attachment && bQ.attachment) {
    if (aQ.attachment === bQ.attachment) points += 1
    else if (aQ.attachment === 'secure' || bQ.attachment === 'secure') points += 0.7
    else points += 0.3
  } else points += 0.5

  return total > 0 ? points / total : 0.5
}

// ─── BASIC ELIGIBILITY FILTER ────────────────────────────────
export function isEligibleMatch(
  currentUser: UserProfile,
  candidate: UserProfile
): boolean {
  // Don't show yourself
  if (currentUser.id === candidate.id) return false

  // Gender/seeking filter — fixed men/women vs man/woman
  if (currentUser.seeking && currentUser.seeking !== 'everyone') {
    if (candidate.gender) {
      const seeking = currentUser.seeking.toLowerCase()
      const gender = candidate.gender.toLowerCase()
      const match =
        (seeking === 'men' && gender === 'man') ||
        (seeking === 'women' && gender === 'woman') ||
        (seeking === gender) ||
        (candidate.seeking === 'everyone')
      if (!match) return false
    }
  }

  // Age filter — only apply if both have ages
  const candidateAge = candidate.age ?? 0
  if (candidateAge > 0) {
    const minAge = currentUser.min_age ?? 18
    const maxAge = currentUser.max_age ?? 99
    if (candidateAge < minAge) return false
    if (candidateAge > maxAge) return false
  }

  // No city filter — show all profiles regardless of location
  return true
}

// ─── SORT PROFILES BY SCORE ──────────────────────────────────
export function rankProfiles(
  currentUser: UserProfile,
  candidates: UserProfile[]
): (UserProfile & { compatibilityScore: number })[] {
  return candidates
    .filter(c => isEligibleMatch(currentUser, c))
    .map(c => ({
      ...c,
      compatibilityScore: scoreCompatibility(currentUser, c),
    }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
}