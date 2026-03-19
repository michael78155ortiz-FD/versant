export interface QuizAnswers {
  values: string[]
  lifeVision: string
  kidsChoice: string
  kidsInvolvement: number
  moneyStyle: string
  locationFlex: string
  loveLanguage: string[]
  independenceLevel: number
  dailyHabits: string[]
  conflictStyle: string
  growthMindset: string[]
  attachmentStyle: string
  dealbreakers: string[]
  lookingFor: string[]
}

const CONFLICT_COMPATIBILITY: Record<string, string[]> = {
  harmonizer: ['harmonizer', 'validator', 'therapyOriented'],
  validator: ['harmonizer', 'validator', 'direct'],
  avoider: ['avoider', 'validator'],
  direct: ['direct', 'validator', 'harmonizer'],
  therapyOriented: ['therapyOriented', 'harmonizer', 'validator'],
}

const ATTACHMENT_COMPATIBILITY: Record<string, string[]> = {
  secure: ['secure', 'anxious', 'avoidant'],
  anxious: ['secure', 'anxious'],
  avoidant: ['secure'],
  disorganized: ['secure'],
}

function scoreValues(a: string[], b: string[]): number {
  const shared = a.filter(v => b.includes(v)).length
  const maxPossible = Math.min(a.length, b.length)
  return maxPossible === 0 ? 0 : shared / maxPossible
}

function scoreLifeVision(a: string, b: string): number {
  return a === b ? 1 : 0.3
}

function scoreFamily(aKids: string, bKids: string): number {
  if (aKids === bKids) return 1
  const maybeCompatible = ['yesSoon', 'yesLater', 'maybe']
  if (maybeCompatible.includes(aKids) && maybeCompatible.includes(bKids)) return 0.6
  if (aKids === 'neverKids' || bKids === 'neverKids') return 0
  return 0.3
}

function scoreConflict(a: string, b: string): number {
  const compatible = CONFLICT_COMPATIBILITY[a] ?? []
  if (compatible.includes(b)) return 1
  return 0.2
}

function scoreLifestyle(a: string[], b: string[]): number {
  const shared = a.filter(h => b.includes(h)).length
  const maxPossible = Math.min(a.length, b.length)
  return maxPossible === 0 ? 0 : shared / maxPossible
}

function attachmentBonus(a: string, b: string): number {
  const compatible = ATTACHMENT_COMPATIBILITY[a] ?? []
  return compatible.includes(b) ? 0.05 : 0
}

function dealbreakerPenalty(a: string[], b: string[]): number {
  const conflicts = a.filter(d => b.includes(d)).length
  return conflicts > 0 ? conflicts * 0.15 : 0
}

export function calculateCompatibility(
  userA: QuizAnswers,
  userB: QuizAnswers
): number {
  const valuesScore = scoreValues(userA.values, userB.values)
  const visionScore = scoreLifeVision(userA.lifeVision, userB.lifeVision)
  const familyScore = scoreFamily(userA.kidsChoice, userB.kidsChoice)
  const conflictScore = scoreConflict(userA.conflictStyle, userB.conflictStyle)
  const lifestyleScore = scoreLifestyle(userA.dailyHabits, userB.dailyHabits)

  const rawScore =
    valuesScore * 0.30 +
    visionScore * 0.25 +
    familyScore * 0.20 +
    conflictScore * 0.15 +
    lifestyleScore * 0.10

  const bonus = attachmentBonus(userA.attachmentStyle, userB.attachmentStyle)
  const penalty = dealbreerPenalty(userA.dealbreakers, userB.dealbreakers)

  const finalScore = Math.max(0, Math.min(1, rawScore + bonus - penalty))
  return Math.round(finalScore * 100)
}

export function getCompatibilityLabel(score: number): string {
  if (score >= 85) return 'Exceptional Match'
  if (score >= 70) return 'Strong Match'
  if (score >= 55) return 'Good Match'
  if (score >= 40) return 'Some Alignment'
  return 'Low Compatibility'
}

export function getCompatibilityColor(score: number): string {
  if (score >= 85) return '#1D9E75'
  if (score >= 70) return '#C85A2A'
  if (score >= 55) return '#D97706'
  return '#9C9893'
}