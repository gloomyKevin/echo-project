import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import CARDS from '../data/cards'

const useStore = create(
  persist(
    (set, get) => ({
      // 卡片状态
      cardIndex: 0,
      darkStars: [],    // 右滑过的 { cardId, timestamp }
      brightStars: [],   // 打卡完成的 { cardId, timestamp, emotion, focusAnswer }
      dismissed: [],     // 左滑过的 cardId

      // 当前视图
      view: 'landing',  // landing | cards | checkin | starmap
      checkinCardId: null,
      expandedCard: false,

      // 是否首次使用
      isFirstVisit: true,

      // 获取当前可用卡片栈
      getCardStack: () => {
        const { darkStars, brightStars, dismissed } = get()
        const usedIds = [
          ...darkStars.map(s => s.cardId),
          ...brightStars.map(s => s.cardId),
          ...dismissed,
        ]
        return CARDS.filter(c => !usedIds.includes(c.id))
      },

      getCardById: (id) => CARDS.find(c => c.id === id),

      // 交互
      swipeRight: (cardId) => set(state => ({
        darkStars: [...state.darkStars, { cardId, timestamp: Date.now() }],
        expandedCard: false,
      })),

      swipeLeft: (cardId, reason) => set(state => ({
        dismissed: [...state.dismissed, cardId],
        expandedCard: false,
      })),

      expandCard: () => set({ expandedCard: true }),
      collapseCard: () => set({ expandedCard: false }),

      // 打卡
      startCheckin: (cardId) => set({ view: 'checkin', checkinCardId: cardId }),

      completeCheckin: (cardId, emotion, focusAnswer) => set(state => ({
        brightStars: [...state.brightStars, { cardId, timestamp: Date.now(), emotion, focusAnswer }],
        darkStars: state.darkStars.filter(s => s.cardId !== cardId),
        view: 'starmap',
        checkinCardId: null,
        justCheckedIn: cardId,
      })),

      clearJustCheckedIn: () => set({ justCheckedIn: null }),

      // 导航
      setView: (view) => set({ view, expandedCard: false }),
      markVisited: () => set({ isFirstVisit: false }),
    }),
    { name: 'vibe-store' }
  )
)

export default useStore
