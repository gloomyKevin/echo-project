import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import CARDS from '../data/cards'

// 星空机位预设
export const CAMERA_PRESETS = {
  landing:   { opacity: 0.7, scale: 0.8,  offsetY: 0,   userOpacity: 0.6 },
  cards:     { opacity: 0.4, scale: 0.8,  offsetY: -60,  userOpacity: 0.3 },
  starmap:   { opacity: 0.2, scale: 1.0,  offsetY: 0,   userOpacity: 1.0 },
  checkin:   { opacity: 0.3, scale: 0.9,  offsetY: -30,  userOpacity: 0.2 },
  spotlight: { opacity: 0.15, scale: 1.8, offsetY: 0,   userOpacity: 1.0 },
}

const useStore = create(
  persist(
    (set, get) => ({
      // 数据
      stars: [],
      dismissed: [],

      // 视图
      view: 'landing',
      checkinCardId: null,
      justLitStarId: null,
      isFirstVisit: true,
      cardsSeenCount: 0,   // 看过的卡片总数（飞升+沉降）

      // 信笺队列
      pendingNote: null,    // { type, content, options? }

      // 精选
      featuredCardId: null,

      // 星空机位
      camera: { ...CAMERA_PRESETS.landing },

      getCardById: (id) => CARDS.find(c => c.id === id),

      getAvailableCards: () => {
        const { stars, dismissed } = get()
        const usedIds = new Set([
          ...stars.map(s => s.cardId),
          ...dismissed.map(d => d.cardId),
        ])
        return CARDS.filter(c => !usedIds.has(c.id))
      },

      // 飞升
      ascend: (cardId) => set(state => {
        const count = state.cardsSeenCount + 1
        // 检查是否该插入信笺
        let note = null
        if (count === 5 || count === 10 || count === 15) {
          const card = CARDS.find(c => c.id === cardId)
          const actionLabels = { explore: '探索', taste: '尝试新事物', create: '创造', connect: '和人连接', move: '运动', observe: '安静感受', reflect: '向内审视' }
          note = { type: 'profile', content: `你好像更喜欢「${actionLabels[card?.actions?.primary] || '探索'}」类的体验。` }
        }
        return {
          stars: [...state.stars, { cardId, type: 'dark', date: Date.now() }],
          cardsSeenCount: count,
          pendingNote: note || state.pendingNote,
        }
      }),

      // 沉降
      sink: (cardId, viewDuration = 0) => set(state => ({
        dismissed: [...state.dismissed, { cardId, viewDuration, date: Date.now() }],
        cardsSeenCount: state.cardsSeenCount + 1,
      })),

      // 找回
      recover: (cardId) => set(state => ({
        dismissed: state.dismissed.filter(d => d.cardId !== cardId),
        stars: [...state.stars, { cardId, type: 'dark', date: Date.now() }],
      })),

      // 打卡
      startCheckin: (cardId) => set({
        view: 'checkin',
        checkinCardId: cardId,
        camera: CAMERA_PRESETS.checkin,
      }),

      completeCheckin: (cardId, emotion, focusAnswer) => set(state => {
        const brightCount = state.stars.filter(s => s.type === 'bright').length + 1
        let note = null
        if (brightCount === 1 || brightCount === 3 || brightCount === 5 || brightCount === 10) {
          note = { type: 'milestone', content: brightCount === 1 ? '你的天空亮了第一颗星。' : `你的天空有 ${brightCount} 颗星了。` }
        }
        return {
          stars: state.stars.map(s =>
            s.cardId === cardId
              ? { ...s, type: 'bright', emotion, focusAnswer, checkinDate: Date.now() }
              : s
          ),
          view: 'starmap',
          checkinCardId: null,
          justLitStarId: cardId,
          camera: CAMERA_PRESETS.starmap,
          pendingNote: note || state.pendingNote,
        }
      }),

      clearJustLit: () => set({ justLitStarId: null }),
      clearNote: () => set({ pendingNote: null }),

      // 导航
      setView: (view) => set({
        view,
        camera: CAMERA_PRESETS[view] || CAMERA_PRESETS.cards,
      }),

      setCamera: (camera) => set({ camera }),
      markVisited: () => set({ isFirstVisit: false }),

      // 信笺
      insertNote: (note) => set({ pendingNote: note }),

      // 精选
      setFeatured: (cardId) => set({ featuredCardId: cardId }),

      // 模拟
      simulateCheckins: (n) => set(state => {
        const available = CARDS.filter(c => !state.stars.find(s => s.cardId === c.id) && !state.dismissed.find(d => d.cardId === c.id))
        const toAdd = available.slice(0, n)
        const emotions = ['heal', 'happy', 'relief', 'breakthrough', 'plain']
        const newStars = [
          ...state.stars,
          ...toAdd.map((c, i) => ({
            cardId: c.id, type: 'bright',
            emotion: emotions[i % emotions.length],
            focusAnswer: null,
            date: Date.now() - (n - i) * 864e5,
            checkinDate: Date.now() - (n - i) * 864e5,
          }))
        ]
        return { stars: newStars }
      }),

      simulateAscends: (n) => set(state => {
        const available = CARDS.filter(c => !state.stars.find(s => s.cardId === c.id) && !state.dismissed.find(d => d.cardId === c.id))
        const toAdd = available.slice(0, n)
        return {
          stars: [...state.stars, ...toAdd.map(c => ({ cardId: c.id, type: 'dark', date: Date.now() }))],
        }
      }),

      // 重置
      reset: () => {
        localStorage.removeItem('vibe-store')
        set({
          stars: [], dismissed: [], view: 'landing',
          checkinCardId: null, justLitStarId: null,
          isFirstVisit: true, cardsSeenCount: 0,
          pendingNote: null, featuredCardId: null,
          camera: { ...CAMERA_PRESETS.landing },
        })
      },
    }),
    {
      name: 'vibe-store',
      partialize: (state) => ({
        stars: state.stars,
        dismissed: state.dismissed,
        isFirstVisit: state.isFirstVisit,
        cardsSeenCount: state.cardsSeenCount,
      }),
    }
  )
)

export default useStore
