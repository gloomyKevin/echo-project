import type { Card, ClusterProfile, ScoredCard, Domain } from '../types'

// Hard filter: remove cards that cannot be executed right now
export function hardFilter(cards: Card[], rejectedIds: Set<string>, completedIds: Set<string>): Card[] {
  return cards.filter(c => !rejectedIds.has(c.id) && !completedIds.has(c.id))
}

// Compute cluster profile from swipe history
export function computeClusterProfile(
  swipeHistory: Array<{ cardId: string; direction: 'left' | 'right'; card: Pick<Card, 'atoms' | 'intensity'> }>,
  checkinCount: number
): ClusterProfile {
  const domains: Domain[] = ['reflective', 'exploration', 'social', 'physical', 'creative', 'food']
  const domainWeights = Object.fromEntries(domains.map(d => [d, 0.5])) as Record<Domain, number>

  if (swipeHistory.length === 0) {
    return { soloVsSocial: 0.5, indoorVsOutdoor: 0.5, domainWeights, swipeCount: 0, checkinCount }
  }

  // solo vs social
  const soloCards = swipeHistory.filter(s => s.card.atoms.context.solo)
  const socialCards = swipeHistory.filter(s => s.card.atoms.context.social)
  const soloRightRate = soloCards.length > 0
    ? soloCards.filter(s => s.direction === 'right').length / soloCards.length
    : 0.5
  const socialRightRate = socialCards.length > 0
    ? socialCards.filter(s => s.direction === 'right').length / socialCards.length
    : 0.5
  const soloVsSocial = soloCards.length + socialCards.length > 0
    ? socialRightRate / (soloRightRate + socialRightRate + 0.001)
    : 0.5

  // indoor vs outdoor
  const indoorCards = swipeHistory.filter(s => s.card.atoms.context.indoor)
  const outdoorCards = swipeHistory.filter(s => s.card.atoms.context.outdoor)
  const indoorRightRate = indoorCards.length > 0
    ? indoorCards.filter(s => s.direction === 'right').length / indoorCards.length
    : 0.5
  const outdoorRightRate = outdoorCards.length > 0
    ? outdoorCards.filter(s => s.direction === 'right').length / outdoorCards.length
    : 0.5
  const indoorVsOutdoor = indoorCards.length + outdoorCards.length > 0
    ? outdoorRightRate / (indoorRightRate + outdoorRightRate + 0.001)
    : 0.5

  // domain weights
  for (const domain of domains) {
    const domainSwipes = swipeHistory.filter(s => s.card.atoms.domain.includes(domain))
    if (domainSwipes.length > 0) {
      domainWeights[domain] = domainSwipes.filter(s => s.direction === 'right').length / domainSwipes.length
    }
  }

  return {
    soloVsSocial,
    indoorVsOutdoor,
    domainWeights,
    swipeCount: swipeHistory.length,
    checkinCount,
  }
}

// Soft score: higher = better match
function scoreCard(card: Card, profile: ClusterProfile): { score: number; reasoning: string } {
  const reasons: string[] = []
  let score = 0

  // Domain match
  let domainScore = 0
  for (const domain of card.atoms.domain) {
    domainScore += profile.domainWeights[domain] ?? 0.5
  }
  domainScore = domainScore / card.atoms.domain.length
  score += domainScore * 40
  reasons.push(`域匹配 ${(domainScore * 100).toFixed(0)}%`)

  // Context match
  const { solo, social, indoor, outdoor } = card.atoms.context
  let ctxScore = 0
  let ctxCount = 0
  if (solo) { ctxScore += (1 - profile.soloVsSocial); ctxCount++ }
  if (social) { ctxScore += profile.soloVsSocial; ctxCount++ }
  if (indoor) { ctxScore += (1 - profile.indoorVsOutdoor); ctxCount++ }
  if (outdoor) { ctxScore += profile.indoorVsOutdoor; ctxCount++ }
  if (ctxCount > 0) {
    const avg = ctxScore / ctxCount
    score += avg * 30
    reasons.push(`场景匹配 ${(avg * 100).toFixed(0)}%`)
  }

  // Intensity progression
  const { checkinCount } = profile
  let intensityScore = 0
  if (card.intensity === 'low') {
    intensityScore = 1.0
  } else if (card.intensity === 'medium') {
    intensityScore = checkinCount >= 3 ? 1.0 : 0.1
  } else if (card.intensity === 'high') {
    intensityScore = checkinCount >= 8 ? 1.0 : 0.0
  }
  score += intensityScore * 30
  reasons.push(`强度适配 ×${intensityScore.toFixed(1)}`)

  return { score, reasoning: reasons.join(' | ') }
}

export function recommend(
  allCards: Card[],
  rejectedIds: Set<string>,
  completedIds: Set<string>,
  shownIds: Set<string>,
  swipeHistory: Array<{ cardId: string; direction: 'left' | 'right'; card: Pick<Card, 'atoms' | 'intensity'> }>,
  checkinCount: number,
  count = 10
): ScoredCard[] {
  const profile = computeClusterProfile(swipeHistory, checkinCount)
  const available = hardFilter(allCards, rejectedIds, completedIds)

  // Prefer unseen cards, then re-surface shown ones
  const unseen = available.filter(c => !shownIds.has(c.id))
  const seen = available.filter(c => shownIds.has(c.id))
  const pool = [...unseen, ...seen]

  if (pool.length === 0) return []

  // Score all
  const scored: ScoredCard[] = pool.map(card => {
    const { score, reasoning } = scoreCard(card, profile)
    return { card, score, reasoning }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Wild card injection: every 5th slot gets a low-scoring card from a non-preferred domain
  const result: ScoredCard[] = []
  const mainQueue = scored.filter((_, i) => i < scored.length * 0.7)
  const wildQueue = scored.filter((_, i) => i >= scored.length * 0.7)
  let wildIdx = 0

  for (let i = 0; i < Math.min(count, scored.length); i++) {
    if ((i + 1) % 5 === 0 && wildIdx < wildQueue.length) {
      result.push({ ...wildQueue[wildIdx], reasoning: wildQueue[wildIdx].reasoning + ' | 🃏野卡' })
      wildIdx++
    } else {
      const card = mainQueue.shift()
      if (card) result.push(card)
    }
  }

  return result
}
