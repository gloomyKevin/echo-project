export type Intensity = 'low' | 'medium' | 'high'
export type ScaleType = 'micro' | 'daily' | 'event'
export type CardStatus = 'unseen' | 'shown' | 'liked' | 'rejected' | 'completed'
export type DimensionKey = 'health' | 'finance' | 'career' | 'social' | 'environment' | 'possibility'
export type EmotionType = 'refreshed' | 'satisfied' | 'surprised' | 'peaceful' | 'excited' | 'touched' | 'proud'
export type Domain = 'reflective' | 'exploration' | 'social' | 'physical' | 'creative' | 'food'

export interface Card {
  id: string
  title: string
  tagline: string
  coverColor: string
  scaleType: ScaleType
  intensity: Intensity
  atoms: {
    context: { solo: boolean; social: boolean; indoor: boolean; outdoor: boolean }
    domain: Domain[]
    triggerMood: string[]
  }
  requirements: {
    minMinutes: number
    maxMinutes: number
    budgetMin: number
    budgetMax: number
    locationRequired: 'home' | 'nearby' | 'city' | 'anywhere'
  }
  preview: {
    processSummary: string
    dimensionImpact: Partial<Record<DimensionKey, { min: number; max: number }>>
  }
}

export type DimensionScores = Record<DimensionKey, number>

export interface SwipeRecord {
  cardId: string
  direction: 'left' | 'right'
  timestamp: string
  card: Pick<Card, 'atoms' | 'intensity'>
}

export interface CheckinRecord {
  id: string
  cardId: string
  completedAt: string
  emotion: EmotionType
  note: string
  dimensionDelta: Partial<Record<DimensionKey, number>>
}

// Recommendation engine types
export interface ClusterProfile {
  soloVsSocial: number        // 0 = solo, 1 = social
  indoorVsOutdoor: number     // 0 = indoor, 1 = outdoor
  domainWeights: Record<Domain, number>  // right-swipe rate per domain
  swipeCount: number
  checkinCount: number
}

export interface ScoredCard {
  card: Card
  score: number
  reasoning: string
}
