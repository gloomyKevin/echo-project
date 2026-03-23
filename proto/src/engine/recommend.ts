import type { Card, ClusterProfile, ScoredCard, Domain } from '../types'

// Hard filter: remove cards the user has already processed
export function hardFilter(
  cards: Card[],
  rejectedIds: Set<string>,
  completedIds: Set<string>,
  likedIds: Set<string>
): Card[] {
  return cards.filter(c => !rejectedIds.has(c.id) && !completedIds.has(c.id) && !likedIds.has(c.id))
}

// Compute cluster profile from swipe history.
// Uses Laplace smoothing (α=0.5) so early swipes don't cause wild swings.
// With 0 data: rate = 0.5/1 = 0.5 (neutral prior). After 4 rights out of 4: rate = 4.5/5 = 0.9.
export function computeClusterProfile(
  swipeHistory: Array<{ cardId: string; direction: 'left' | 'right'; card: Pick<Card, 'atoms' | 'intensity'> }>,
  checkinCount: number
): ClusterProfile {
  const domains: Domain[] = ['reflective', 'exploration', 'social', 'physical', 'creative', 'food']

  // Laplace-smoothed rate helper
  function smoothedRate(rights: number, total: number) {
    return (rights + 0.5) / (total + 1)
  }

  // solo vs social
  const soloCards = swipeHistory.filter(s => s.card.atoms.context.solo)
  const socialCards = swipeHistory.filter(s => s.card.atoms.context.social)
  const soloRightRate = smoothedRate(soloCards.filter(s => s.direction === 'right').length, soloCards.length)
  const socialRightRate = smoothedRate(socialCards.filter(s => s.direction === 'right').length, socialCards.length)
  const soloVsSocial = socialRightRate / (soloRightRate + socialRightRate)

  // indoor vs outdoor
  const indoorCards = swipeHistory.filter(s => s.card.atoms.context.indoor)
  const outdoorCards = swipeHistory.filter(s => s.card.atoms.context.outdoor)
  const indoorRightRate = smoothedRate(indoorCards.filter(s => s.direction === 'right').length, indoorCards.length)
  const outdoorRightRate = smoothedRate(outdoorCards.filter(s => s.direction === 'right').length, outdoorCards.length)
  const indoorVsOutdoor = outdoorRightRate / (indoorRightRate + outdoorRightRate)

  // domain weights — Laplace smoothed per-domain right-swipe rate
  const domainWeights = Object.fromEntries(
    domains.map(domain => {
      const domainSwipes = swipeHistory.filter(s => s.card.atoms.domain.includes(domain))
      const rights = domainSwipes.filter(s => s.direction === 'right').length
      return [domain, smoothedRate(rights, domainSwipes.length)]
    })
  ) as Record<Domain, number>

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

  // Domain match (0–40pts)
  let domainScore = 0
  for (const domain of card.atoms.domain) {
    domainScore += profile.domainWeights[domain] ?? 0.5
  }
  domainScore = domainScore / card.atoms.domain.length
  score += domainScore * 40
  reasons.push(`域匹配 ${(domainScore * 100).toFixed(0)}%`)

  // Context match (0–30pts)
  // Cards tagged solo+social=true are flexible and score well either way (intentional)
  const { solo, social, indoor, outdoor } = card.atoms.context
  let ctxScore = 0
  let ctxCount = 0
  if (solo)    { ctxScore += (1 - profile.soloVsSocial);  ctxCount++ }
  if (social)  { ctxScore += profile.soloVsSocial;         ctxCount++ }
  if (indoor)  { ctxScore += (1 - profile.indoorVsOutdoor); ctxCount++ }
  if (outdoor) { ctxScore += profile.indoorVsOutdoor;       ctxCount++ }
  if (ctxCount > 0) {
    const avg = ctxScore / ctxCount
    score += avg * 30
    reasons.push(`场景匹配 ${(avg * 100).toFixed(0)}%`)
  }

  // Intensity progression (0–30pts)
  // Unlocks medium after 3 checkins, high after 8 — prevents overwhelming new users
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
  likedIds: Set<string>,
  swipeHistory: Array<{ cardId: string; direction: 'left' | 'right'; card: Pick<Card, 'atoms' | 'intensity'> }>,
  checkinCount: number,
  count = 10
): ScoredCard[] {
  const profile = computeClusterProfile(swipeHistory, checkinCount)
  const available = hardFilter(allCards, rejectedIds, completedIds, likedIds)

  if (available.length === 0) return []

  const scored: ScoredCard[] = available.map(card => {
    const { score, reasoning } = scoreCard(card, profile)
    return { card, score, reasoning }
  })

  scored.sort((a, b) => b.score - a.score)

  // Wild card injection: every 5th slot gets a card from the bottom 30%
  const cutoff = Math.floor(scored.length * 0.7)
  const mainQueue = scored.slice(0, cutoff)
  const wildQueue = scored.slice(cutoff)
  const result: ScoredCard[] = []
  let mainIdx = 0
  let wildIdx = 0

  for (let i = 0; i < Math.min(count, scored.length); i++) {
    if ((i + 1) % 5 === 0 && wildIdx < wildQueue.length) {
      result.push({ ...wildQueue[wildIdx], reasoning: wildQueue[wildIdx].reasoning + ' | 🃏野卡' })
      wildIdx++
    } else if (mainIdx < mainQueue.length) {
      result.push(mainQueue[mainIdx++])
    } else if (wildIdx < wildQueue.length) {
      result.push(wildQueue[wildIdx++])
    }
  }

  return result
}
