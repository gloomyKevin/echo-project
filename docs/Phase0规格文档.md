# Phase 0 规格文档

> **定位**：纯本地 H5 原型，给最初几十位真实用户体验核心交互，收集第一批行为数据。
> **分水岭**：本阶段无服务端、无 AI、无账号——这不是过渡，是一个需要认真对待的完整产品形态。
> **原则**：Service Interface 层从 Day 1 设计好，Phase 1 切换后端只需换实现，不改调用方。

---

## 最小能力集

**做**：
- 卡片发现（滑动）→ 打卡 → 庆祝，这条链路要流畅有情绪
- 本地推荐引擎：时间过滤 + 偏好排序 + 强度渐进 + 野卡注入
- 打卡情绪记录 + 维度分变化
- Dev Panel：实时展示聚类信号、维度分、推荐逻辑（仅开发/测试环境）
- 卡片 JSON 增量更新能力（结构预留，Phase 0 静态）

**不做**：
- 队列管理、碎片系统、地图、个人页
- 账号 / 同步
- Taste Seeding 引导流程
- 任何通知推送

---

## 核心数据类型

```typescript
type Intensity = 'low' | 'medium' | 'high'
type ScaleType = 'micro' | 'daily' | 'event'
type CardStatus = 'unseen' | 'shown' | 'liked' | 'rejected' | 'completed'
type DimensionKey = 'health' | 'finance' | 'career' | 'social' | 'environment' | 'possibility'
type EmotionType = 'refreshed' | 'satisfied' | 'surprised' | 'peaceful' | 'excited' | 'touched' | 'proud'

interface Card {
  id: string
  title: string
  tagline: string
  coverColor: string
  scaleType: ScaleType
  intensity: Intensity
  atoms: {
    context: { solo: boolean; social: boolean; indoor: boolean; outdoor: boolean }
    domain: string[]        // 'reflective' | 'exploration' | 'social' | 'physical' | 'creative' | 'food'
    triggerMood: string[]
  }
  requirements: {
    minMinutes: number; maxMinutes: number
    budgetMin: number; budgetMax: number
    locationRequired: 'home' | 'nearby' | 'city' | 'anywhere'
  }
  preview: {
    processSummary: string
    dimensionImpact: Partial<Record<DimensionKey, { min: number; max: number }>>
  }
}

interface CheckinRecord {
  id: string; cardId: string; completedAt: string
  emotion: EmotionType; note: string
  dimensionDelta: Partial<Record<DimensionKey, number>>
}
```

---

## 本地推荐引擎

Phase 0 唯一的「智能」来源，完全在前端运行：

```
优先级顺序：
1. 硬过滤   → 排除已完成/已拒绝；按当前时间/星期排除做不到的
2. 软排序   → 根据历史右滑的 domain/context 统计偏好权重
3. 强度渐进 → checkin < 3 只推 low；3-8 引入 medium；8+ 引入 high
4. 野卡注入 → 每 5 张插 1 张偏好之外的域，防信息茧房
```

**聚类信号**（5 次滑动后开始有意义）：
- `soloVsSocial`：solo 卡右滑占比 vs social 卡
- `indoorVsOutdoor`：同上
- `domainWeights`：各 domain 右滑率

信号同时供 Dev Panel 实时展示，验证推荐逻辑是否符合预期。

---

## 屏幕流

```
发现页 ──右滑/左滑──▶ 继续发现
   │
   │「已经做过」
   ▼
打卡弹窗 ──选情绪+备注──▶ 完成 ──▶ 庆祝页 ──▶ 回到发现页
```

三个屏幕，无底栏，无导航。

---

## Dev Panel（测试环境可见）

浮层，可折叠，实时更新：

| 面板区域 | 内容 |
|---------|------|
| 聚类信号 | solo/social/indoor/outdoor 偏好百分比 |
| 域偏好 | 各 domain 右滑率 |
| 强度状态 | 当前推荐强度层级 + checkin 进度 |
| 维度分 | 6 维实时数值 |
| 推荐理由 | 当前顶部卡片的得分明细 |

---

## 技术栈

| 层 | 选择 |
|----|------|
| 框架 | React 19 + TypeScript + Vite |
| 动画 | Framer Motion |
| 状态 | Zustand 5 + localStorage |
| 部署 | Vercel（静态） |

---

## Phase 1 迁移接口

```typescript
interface CardService {
  getStack(ctx: RecommendationContext): Promise<Card[]>
  recordSwipe(cardId: string, direction: 'left' | 'right'): Promise<void>
  recordCheckin(record: CheckinRecord): Promise<void>
}
// Phase 0：LocalCardService  →  Phase 1：SupabaseCardService
// 调用方零改动
```

本地积累的行为数据在 Phase 1 迁移时随账号同步上传，不丢失冷启动信号。
