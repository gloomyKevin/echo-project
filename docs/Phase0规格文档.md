# Phase 0 完整规格文档

> **核心原则**：底层数据模型、状态机、服务接口层从第一天就按最终形态建，后续阶段只替换实现，不改接口。UI 层表现从简，但每个核心功能都可触达。
> 更新日期：2026-03-23

---

## 一、Phase 0 定义

**形态**：Expo Web App，部署到 Vercel，一个 https 链接直接分享，手机浏览器打开即用。

**持续时间**：约 1 周，发给最熟悉的 5-20 人做体验反馈。

**验证目标**：
1. 核心交互（滑卡片 → 打卡 → 碎片）感受是否对
2. 卡片内容质量是否能引发行动意愿
3. 六维和碎片这两个核心产出是否有感知价值

**技术约束**：
- 全部数据本地存储（localStorage / AsyncStorage）
- 无用户账号，无后端
- 无实时 AI，预演文字全部人工写入 JSON
- 地图展示真实打卡坐标，但无社区叠加层

---

## 二、功能范围

### 2.1 包含的功能（全部可体验）

| 功能模块 | Phase 0 实现方式 |
|---------|----------------|
| 卡片发现与滑动 | 全功能，Reanimated 3 手势 |
| 今日精选 | 本地算法选出，首位展示 |
| 选择预演 | 静态文字，写入卡片 JSON |
| 队列管理 | 本地存储，含褪色逻辑 |
| 时间锚定 | 队列项可绑定计划时间 |
| 打卡流程 | 图片（Web 文件选择）+ 情绪贴纸 + 备注 |
| 碎片生成与收藏 | 本地生成，完整碎片数据结构 |
| 碎片分享图 | Canvas 生成图片，下载或复制 |
| 六维画像 | 本地计算，增量展示 |
| 城市地图 | 真实坐标点，无社区层 |
| 逆向 Onboarding | 第 5 次交互后触发（Phase 0 简化版：跳过 AI 归类，直接返回预设匹配卡片）|

### 2.2 不做的功能

- 用户登录 / 账号体系
- 数据同步（跨设备）
- 实时 AI 推荐与预演生成
- 推送通知
- 社区热力图
- 挑战 / 先行者机制

### 2.3 深层功能外显原则

原本需要多级导航才能触达的功能，在 Phase 0 直接外显一级入口：

| 功能 | 正常访问路径 | Phase 0 外显方式 |
|------|------------|----------------|
| 选择预演 | 卡片详情页 → 查看预演 | 卡片上常驻「了解」按钮，一键展开 |
| 时间锚定 | 队列 → 卡片详情 → 设置时间 | 队列列表每项直接展示「定个时间」操作 |
| 打卡入口 | 队列 → 卡片详情 → 打卡 | 队列每项直接展示「打卡」按钮 |
| 六维详情 | 我的 → 画像 → 点击维度 | 画像页每个维度可直接展开贡献卡片列表 |
| 碎片详情 | 碎片列表 → 点击碎片 | 可以，但碎片列表已展示关键信息 |

---

## 三、页面与交互规格

### 3.1 首页——卡片发现

**布局**：
```
┌─────────────────────────────┐
│  [今日精选] Vibe             │  顶部 appbar，右侧小图标（碎片数徽章）
├─────────────────────────────┤
│                             │
│    ╔═══════════════╗        │  精选卡片置顶，金色细边框标记
│    ║  今日精选      ║        │
│    ║               ║        │
│    ║  卡片标题      ║        │
│    ╚═══════════════╝        │
│   ╔═══════════════╗         │  第二张卡轻微露出（暗示还有更多）
│   ║               ║         │
│                             │
│  [了解]              ──────→ │  左下常驻按钮展开预演；右侧方向暗示右滑
│                             │
├─────────────────────────────┤
│  ← 跳过   想试试 →   做过 ↑  │  底部操作提示（手势触发，按钮仅作提示）
├─────────────────────────────┤
│  发现  │  队列(N)  │  碎片  │  我的  │  底部导航
└─────────────────────────────┘
```

**卡片内容展示**：
- 封面图（本地资源 or 纯色渐变兜底）
- 大字标题
- 一句副标题
- 标签行：`[尺度徽章]` `[时长]` `[独处/结伴]` `[室内/室外]`

**滑动手势**：
- 右滑：绿色浮层 + 「加入想做」文字 → 入队 → 触觉反馈（iOS haptic）
- 左滑：灰色浮层 + 「跳过」文字 → 跳过
- 上滑：蓝色浮层 + 「做过了」文字 → 记录

**「了解」按钮（预演外显）**：
- 点击：卡片翻转或底部半屏弹出预演文字面板
- 内容：`preview.process` 字段（选择预演文字）+ 维度影响预览（`↑健康` `↑可能性` 这类简单标签）
- 操作：「收起」「加入队列」两个按钮

**卡片池耗尽处理**：
- 显示「今天的卡片已经都看过了」
- 展示一张「随机推荐」入口（从 rejected 状态卡片中随机取一张，重新展示）

---

### 3.2 队列页——想做的事

**布局**：列表视图，每一项完整展示操作。

```
┌─────────────────────────────┐
│  我想做的事  (3)             │
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │ 缩略图 │ 卡片标题       │  │  正常卡片
│ │        │ [日常] 约1小时 │  │
│ │        │ ⏰ 定个时间    │  │  ← 时间锚定外显
│ │        │ [打卡] 按钮    │  │  ← 打卡入口外显
│ └───────────────────────┘   │
│                             │
│ ┌───────────────────────┐   │
│ │ 缩略图 │ 卡片标题       │  │  褪色中的卡片（加入 >7天）
│ │ 半透明  │ [日常] 约1小时 │  │  整体降低透明度
│ │        │ 已放置 9 天   │  │  ← 褪色提示
│ │        │ ⏰ 定个时间   │  │
│ │        │ [打卡]        │  │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

**时间锚定交互**：
- 点击「定个时间」→ 原生日期时间选择器
- 设定后显示为：「周六 下午3点」
- 到时间后可选推送（Phase 1 再做，Phase 0 记录即可）

**删除 / 放弃**：左滑列表项 → 「放弃这张」选项

---

### 3.3 打卡流程

从队列的「打卡」按钮进入，全屏流程，共 3 步。

**Step 1：记录这一刻**
```
┌─────────────────────────────┐
│  < 返回                      │
│                             │
│  「去一家从没进去过的小店」    │  卡片标题回显
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │    拍一张照片         │   │  点击进入相机/图库
│  │    或直接跳过         │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  [跳过，直接记录情绪] ───→   │  次要操作，直接跳到 Step 2
└─────────────────────────────┘
```

**Step 2：现在感觉怎么样**
```
┌─────────────────────────────┐
│                             │
│       选一个情绪              │
│                             │
│  ┌──┐  ┌──┐  ┌──┐          │
│  │治愈│  │开心│  │释然│         │
│  └──┘  └──┘  └──┘          │
│  ┌──┐  ┌──┐  ┌──┐          │
│  │疲惫│  │突破│  │平淡│         │
│  └──┘  └──┘  └──┘          │
│                             │
│  可以说几个字（选填）          │  textarea，100字上限，placeholder 轻柔
│  ┌─────────────────────┐   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  [完成打卡]                  │
└─────────────────────────────┘
```

**Step 3：碎片生成**（过渡动画，约 1.5 秒）
```
┌─────────────────────────────┐
│                             │
│    [照片 or 情绪色块]         │  展示这次的碎片视觉
│                             │
│    去一家从没进去过的小店       │  卡片标题
│    治愈  ·  今天 15:32        │  情绪 + 时间
│                             │
│    " 走进一个陌生空间，          │  展示预演文字（摘要，2-3行）
│      你的身体会先感知到          │
│      某种轻微的不确定… "         │
│                             │
│  [分享这枚碎片]  [查看全部碎片] │
└─────────────────────────────┘
```

---

### 3.4 碎片收藏页

**布局**：瀑布流 / 2列网格

```
┌─────────────────────────────┐
│  我的碎片  (12)               │
├─────────────────────────────┤
│  ┌──────┐  ┌──────┐        │
│  │ 照片  │  │ 色块  │        │  照片碎片 or 情绪色块碎片
│  │      │  │ 情绪色 │        │
│  │ 标题  │  │ 标题  │        │
│  │ 日期  │  │ 日期  │        │
│  └──────┘  └──────┘        │
│  ...                        │
└─────────────────────────────┘
```

**碎片详情页**（点击碎片进入）：
- 完整的照片/色块视觉
- 卡片标题 + 情绪 + 日期 + 地点（如果有）
- **完整预演文字**（`preview.process` 全文，Phase 0 最重要的内容之一）
- 用户备注（如果有）
- 维度影响展示：`↑健康 +8` `↑可能性 +12`
- 分享按钮（生成图片）

**分享图生成**（Canvas / html2canvas）：
- 碎片视觉 + 标题 + 情绪 + 一句预演摘要
- 简洁设计，适合朋友圈 / 小红书
- 不包含任何 App 推广文字（用户自己会说）

---

### 3.5 六维画像页

从「我的」tab 进入。

```
┌─────────────────────────────┐
│  你的生活面貌                 │
│  基于 12 次真实体验            │  动态文案
├─────────────────────────────┤
│                             │
│  健康      ████████░░  +8↑  │  本月增量，不展示绝对值
│  社交      ████░░░░░░  +3↑  │
│  事业      █████░░░░░   0 → │
│  环境      ██████████ +15↑  │
│  可能性    ███░░░░░░░  +5↑  │
│  财务      ──────────  数据不足│  诚实展示
│                             │
│  [点击任意维度查看详情]        │
├─────────────────────────────┤
│  「你最近有 70% 的体验         │  20次交互后才出现的洞察文字
│    都是独自完成的」            │
└─────────────────────────────┘
```

**维度详情**（点击某维度展开）：
- 贡献最多的前 3 张卡片（缩略图 + 标题）
- 本月趋势（简单折线，只有 4 周的点）

---

### 3.6 城市地图页

从「我的」tab 进入，或首页地图小图标进入。

```
┌─────────────────────────────┐
│  我的城市轨迹                 │
│  北京 · 已探索 7 个地点        │
├─────────────────────────────┤
│                             │
│    [地图视图]                 │  高德地图（国内）
│                             │  每个打卡地点：彩色点（按情绪着色）
│    ●  ●                     │
│              ●              │
│         ●                   │
│                             │
├─────────────────────────────┤
│  [生成分享图]                 │  「我已探索了 X 个地点」一键生成
└─────────────────────────────┘
```

**打卡时的地点获取**：打卡 Step 1 时，询问位置权限（一次即可）。Web 端用 `navigator.geolocation`。拒绝授权则该次打卡无地点数据，不影响其他功能。

---

### 3.7 「我的」页

```
┌─────────────────────────────┐
│  嗨                          │  无账号，不显示名字
├─────────────────────────────┤
│  打卡      队列      碎片     │
│   12        3        12      │  快速统计数字
├─────────────────────────────┤
│  🗺  我的地图                 │  → 地图页
│  🌀  六维画像                 │  → 画像页
│  📦  碎片收藏                 │  → 碎片页
├─────────────────────────────┤
│  ···  清除所有数据             │  危险操作，二次确认弹窗
└─────────────────────────────┘
```

---

### 3.8 逆向 Onboarding（简化版）

触发条件：用户完成了第 5 次左滑或右滑操作。

插入一个全屏卡片（非可滑动）：

```
┌─────────────────────────────┐
│                             │
│                             │
│  告诉我一件你最近做了的、       │
│  让你感觉还不错的小事           │
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │  文本输入
│  └─────────────────────┘   │
│                             │
│  [告诉 Vibe]  [先跳过]       │
└─────────────────────────────┘
```

Phase 0 简化处理：不做实时 AI 归类。输入后，客户端根据关键词做简单模糊匹配（「吃」→ 食物域卡片；「走」「爬」→ 探索/健康域卡片；兜底：随机返回一张「可能性」维度卡片）。即使匹配不精准也没关系——这个流程的核心是制造「被理解」的感知，而不是精准推荐。Phase 1 接入真实 AI 替换这段逻辑，接口不变。

---

## 四、数据模型

所有数据结构从第一天按最终形态定义，Phase 0 不用的字段留空/填默认值，但不删除。

### 4.1 卡片（Card）

```typescript
type ScaleType = 'micro' | 'daily' | 'event' | 'bigbang' | 'milestone'
type Season = 'spring' | 'summer' | 'autumn' | 'winter'
type LocationRequired = 'home' | 'nearby' | 'city' | 'anywhere'
type SocialType = 'solo' | 'pair' | 'group' | 'any'
type Dimension = 'health' | 'finance' | 'career' | 'social' | 'environment' | 'possibility'
type DataSource = 'editorial' | 'aggregated' | 'ai'

interface Card {
  id: string                     // UUID，永久不变
  version: number                // 内容版本号，用于缓存刷新

  // 展示层
  title: string                  // 「去一家从没进去过的小店」
  tagline: string                // 副标题
  coverImage: string             // 本地资源路径（Phase 0）或远端 URL（Phase 1+）
  scaleType: ScaleType

  // 原子标签（推荐引擎与展示共用）
  atoms: {
    context: {
      solo: boolean
      social: boolean
      indoor: boolean
      outdoor: boolean
    }
    domain: string[]             // ['food', 'exploration', 'creative', 'reflective', ...]
    triggerMood: string[]        // ['bored', 'tired', 'curious', ...]（Phase 1+ 推荐用）
  }

  // 执行要求
  requirements: {
    minMinutes: number
    maxMinutes: number
    budgetMin: number            // 0 = 免费
    budgetMax: number
    locationRequired: LocationRequired
    seasonValid: Season[]        // [] = 全年有效
    socialType: SocialType
  }

  // 选择预演（Phase 0 全部为 editorial）
  preview: {
    process: string              // 过程预演文字（完整版，碎片详情里展示）
    processSummary: string       // 2-3 句摘要（卡片「了解」面板里展示）
    dimensionImpact: Partial<Record<Dimension, { min: number; max: number }>>
    dataSource: DataSource       // Phase 0 全部填 'editorial'
    sampleSize?: number          // Phase 2+ 有真实数据后填
  }

  // 元数据（Phase 0 填默认值，字段不删）
  source: 'official' | 'ugc' | 'partner'   // Phase 0 全部 'official'
  access: 'free' | 'premium'               // Phase 0 全部 'free'
  tags: string[]
  createdAt: string
  globalCompletionCount: number             // Phase 0 填 0，Phase 1+ 从后端同步
}
```

### 4.2 用户画像（UserProfile）

```typescript
interface DimensionScores {
  health: number        // 0-100，初始 50
  finance: number
  career: number
  social: number
  environment: number
  possibility: number
}

interface AtomWeights {
  solo: number
  social: number
  indoor: number
  outdoor: number
  lowCost: number
  highCost: number
  physical: number
  reflective: number
  creative: number
  exploratory: number
}

interface UserProfile {
  dimensions: DimensionScores
  atomWeights: AtomWeights

  // 月度增量追踪（key 格式：'2026-03'）
  monthlyDimDeltas: Record<string, Partial<DimensionScores>>

  // 统计
  totalSwipes: number
  totalCompleted: number
  lastActiveDate: string          // ISO date string

  // 衰减控制（Phase 1+ 实现，Phase 0 预留字段）
  lastDecayDate?: string
}
```

### 4.3 卡片状态（CardStatusEntry）

```typescript
type CardStatus =
  | 'unseen'
  | 'shown'
  | 'rejected'          // 左滑
  | 'done_before'       // 上滑
  | 'queued'            // 右滑，在队列中
  | 'fading'            // 右滑后 >7 天未行动
  | 'archived_wish'     // 褪色后自动归档（不推荐，但可查）
  | 'shelved'           // 用户主动放入收藏
  | 'completed'         // 已打卡完成

interface CardStatusEntry {
  cardId: string
  status: CardStatus
  updatedAt: string               // ISO datetime

  // 队列相关
  queuedAt?: string
  timeAnchor?: string             // 用户绑定的计划时间（ISO datetime）

  // 完成相关
  completedAt?: string
  fragmentId?: string             // 关联的碎片 ID
}

// Store 结构
type CardStatusMap = Record<string, CardStatusEntry>  // key = cardId
```

### 4.4 碎片（Fragment）

```typescript
type EmotionType = 'healing' | 'happy' | 'relieved' | 'tired' | 'breakthrough' | 'plain'

interface Fragment {
  id: string                      // UUID
  cardId: string
  cardTitle: string               // 快照，卡片标题可能后来改变

  // 媒体
  photoUri?: string               // 本地文件路径（Phase 0 Web：blob URL）
  emotionColor: string            // 情绪对应的渐变色值（无照片时使用）

  // 用户输入
  emotion: EmotionType
  note?: string                   // 用户备注，100字上限

  // 预演快照（打卡时从卡片复制，不受卡片后续修改影响）
  previewProcess: string          // card.preview.process 的快照
  previewSummary: string          // card.preview.processSummary 的快照

  // 位置（用户授权后记录）
  location?: {
    latitude: number
    longitude: number
    cityName: string              // 逆地理编码结果
    placeName?: string            // 具体地点名（选填）
  }

  // 维度影响（打卡时计算并存储）
  dimensionDeltas: Partial<DimensionScores>

  // 元数据
  completedAt: string             // ISO datetime
}
```

### 4.5 每日栈配置（DailyStackConfig）

```typescript
interface TimeContext {
  period: 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night'
  isWeekend: boolean
  season: Season
  date: string
}

interface DailyStack {
  featured: Card                  // 今日精选
  cards: Card[]                   // 剩余卡片（12张上限）
  generatedAt: string
  context: TimeContext
}
```

---

## 五、状态机

### 5.1 卡片状态转移

```
UNSEEN
  │
  ▼（展示给用户）
SHOWN
  ├── 左滑 ──────────────→ REJECTED
  │                           └──（30天后软重置为 UNSEEN）
  ├── 上滑 ──────────────→ DONE_BEFORE（永久，不再推荐）
  └── 右滑 ──────────────→ QUEUED
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
               打卡完成    主动放弃    超时（7天后）
                    │          │          │
               COMPLETED    SHELVED    FADING
               （永久档案）  （收藏）      │
                                    （7天后自动）
                                         ▼
                                  ARCHIVED_WISH
```

### 5.2 状态转移触发条件

| 转移 | 触发方 | 触发条件 |
|------|--------|---------|
| SHOWN → REJECTED | 用户 | 左滑 |
| SHOWN → DONE_BEFORE | 用户 | 上滑 |
| SHOWN → QUEUED | 用户 | 右滑 |
| QUEUED → FADING | 系统 | 进入 QUEUED 后 7 天未变化，每次启动 App 检查 |
| QUEUED → COMPLETED | 用户 | 完成打卡流程 |
| QUEUED → SHELVED | 用户 | 主动放入收藏 |
| FADING → ARCHIVED_WISH | 系统 | 进入 FADING 后 7 天，自动转移（静默） |
| REJECTED → UNSEEN | 系统 | 30 天后自动软重置（可重新推荐） |

### 5.3 褪色逻辑实现

```typescript
function checkAndApplyFading(statuses: CardStatusMap): CardStatusMap {
  const now = new Date()
  const updated = { ...statuses }

  Object.values(updated).forEach(entry => {
    if (entry.status === 'queued' && entry.queuedAt) {
      const daysSinceQueued = diffDays(now, new Date(entry.queuedAt))
      if (daysSinceQueued >= 7) {
        updated[entry.cardId] = { ...entry, status: 'fading', updatedAt: now.toISOString() }
      }
    }
    if (entry.status === 'fading' && entry.updatedAt) {
      const daysSinceFading = diffDays(now, new Date(entry.updatedAt))
      if (daysSinceFading >= 7) {
        updated[entry.cardId] = { ...entry, status: 'archived_wish', updatedAt: now.toISOString() }
      }
    }
  })

  return updated
}

// 在 App 启动时调用一次
useEffect(() => {
  cardStatusStore.getState().applyFading()
}, [])
```

---

## 六、服务接口层

**设计原则**：所有外部依赖通过接口暴露。Phase 0 是「本地实现」，Phase 1+ 是「远端实现」，调用方代码不感知差异。

### 6.1 接口定义

```typescript
// 卡片服务
interface CardService {
  getDaily(context: TimeContext): Promise<DailyStack>
  getCard(id: string): Promise<Card>
  searchCards(query: string): Promise<Card[]>
}

// 用户画像服务
interface ProfileService {
  getProfile(): Promise<UserProfile>
  applySwipeEvent(cardId: string, direction: 'right' | 'left' | 'up'): Promise<void>
  applyCheckinEvent(fragment: Fragment): Promise<void>
  getInsight(): Promise<string | null>    // 「你最近 70% 的体验都是独自完成的」
}

// 碎片服务
interface FragmentService {
  saveFragment(fragment: Fragment): Promise<void>
  getAll(): Promise<Fragment[]>
  getById(id: string): Promise<Fragment | null>
  generateShareImage(fragmentId: string): Promise<Blob>
}

// 地图服务
interface MapService {
  getMyPoints(): Promise<Array<{ lat: number; lng: number; emotion: EmotionType; fragmentId: string }>>
  // Phase 1+ 新增：社区热力数据
}

// 分析服务（Phase 0 就接）
interface AnalyticsService {
  track(event: string, properties?: Record<string, unknown>): void
  identify(traits?: Record<string, unknown>): void
}

// 存储适配器（最底层）
interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}
```

### 6.2 Phase 0 本地实现

```typescript
// 存储：localStorage（Web）
class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  }
  async set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value))
  }
  async remove(key: string) { localStorage.removeItem(key) }
  async clear() { localStorage.clear() }
}

// 卡片服务：静态 JSON
class LocalCardService implements CardService {
  private cards: Card[] = require('../data/cards.json')

  async getDaily(context: TimeContext): Promise<DailyStack> {
    const profile = profileStore.getState().profile
    const statuses = cardStatusStore.getState().statuses
    return generateDailyStack(this.cards, profile, statuses, context)
  }

  async getCard(id: string): Promise<Card> {
    return this.cards.find(c => c.id === id)!
  }

  async searchCards(query: string): Promise<Card[]> {
    return this.cards.filter(c =>
      c.title.includes(query) || c.tags.some(t => t.includes(query))
    )
  }
}

// 画像服务：本地计算
class LocalProfileService implements ProfileService {
  async getProfile() {
    return profileStore.getState().profile
  }

  async applySwipeEvent(cardId: string, direction: 'right' | 'left' | 'up') {
    const card = await cardService.getCard(cardId)
    profileStore.getState().applySwipe(card, direction)
  }

  async applyCheckinEvent(fragment: Fragment) {
    profileStore.getState().applyCheckin(fragment)
  }

  async getInsight(): Promise<string | null> {
    const profile = profileStore.getState().profile
    if (profile.totalSwipes < 20) return null
    return computeLocalInsight(profile)
  }
}
```

### 6.3 服务注册

```typescript
// services/index.ts
// 切换实现只需改这一个文件
export const storage: StorageAdapter = new LocalStorageAdapter()
export const cardService: CardService = new LocalCardService()
export const profileService: ProfileService = new LocalProfileService()
export const fragmentService: FragmentService = new LocalFragmentService()
export const mapService: MapService = new LocalMapService()
export const analytics: AnalyticsService = new AmplitudeAnalyticsService()
// Phase 1 替换：
// export const cardService: CardService = new SupabaseCardService()
```

---

## 七、状态管理（Zustand Stores）

```typescript
// store/cardStatusStore.ts
interface CardStatusStore {
  statuses: CardStatusMap
  setStatus: (cardId: string, status: CardStatus, extra?: Partial<CardStatusEntry>) => void
  setTimeAnchor: (cardId: string, datetime: string) => void
  applyFading: () => void
  getQueue: () => CardStatusEntry[]
  getCompleted: () => CardStatusEntry[]
}

// store/userProfileStore.ts
interface UserProfileStore {
  profile: UserProfile
  applySwipe: (card: Card, direction: 'right' | 'left' | 'up') => void
  applyCheckin: (fragment: Fragment) => void
  applyDecay: () => void               // Phase 1+ 实现，Phase 0 预留
}

// store/fragmentStore.ts
interface FragmentStore {
  fragments: Fragment[]
  addFragment: (fragment: Fragment) => void
  getById: (id: string) => Fragment | undefined
}

// store/dailyStackStore.ts
interface DailyStackStore {
  stack: DailyStack | null
  currentIndex: number
  generatedDate: string
  loadStack: () => Promise<void>
  advanceCard: () => void
}
```

所有 Store 使用 Zustand `persist` middleware，底层接 `StorageAdapter`：

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useCardStatusStore = create<CardStatusStore>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'card-status-store',
      storage: createJSONStorage(() => localStorage),  // Phase 1 换成 AsyncStorage 或 Supabase
    }
  )
)
```

---

## 八、每日栈生成算法

Phase 0 本地实现，接口不变，Phase 1+ 替换为服务端推荐：

```typescript
function generateDailyStack(
  allCards: Card[],
  profile: UserProfile,
  statuses: CardStatusMap,
  context: TimeContext
): DailyStack {

  const eligible = allCards
    // 1. 排除已完成和近期拒绝的
    .filter(card => {
      const s = statuses[card.id]?.status
      return !s || s === 'unseen' || s === 'shown'
    })
    // 2. 季节过滤
    .filter(card =>
      card.requirements.seasonValid.length === 0 ||
      card.requirements.seasonValid.includes(context.season)
    )
    // 3. 时段过滤（晚上优先 home/nearby，早晨过滤 bigbang）
    .filter(card => applyTimeFilter(card, context))

  // 4. 评分排序（原子权重加权点积）
  const scored = eligible
    .map(card => ({ card, score: scoreCard(card, profile) }))
    .sort((a, b) => b.score - a.score)

  // 5. 多样性注入（相邻卡片 domain 不重复）
  const diverse = ensureDomainDiversity(scored.map(x => x.card))

  // 6. 野卡注入（前 12 张里加 1-2 张偏好外的）
  const withWild = injectWildCards(diverse.slice(0, 10), allCards, profile)

  // 7. 精选：加权最高且符合当前时段的第一张
  const featured = withWild[0]

  return {
    featured,
    cards: withWild.slice(0, 12),
    generatedAt: new Date().toISOString(),
    context,
  }
}

function scoreCard(card: Card, profile: UserProfile): number {
  const w = profile.atomWeights
  let score = 0

  if (card.atoms.context.solo)    score += w.solo * 2
  if (card.atoms.context.social)  score += w.social * 2
  if (card.atoms.context.indoor)  score += w.indoor
  if (card.atoms.context.outdoor) score += w.outdoor

  if (card.requirements.budgetMax === 0)  score += w.lowCost * 1.5
  if (card.requirements.budgetMax > 200)  score += w.highCost

  card.atoms.domain.forEach(d => {
    if (d === 'creative')    score += w.creative
    if (d === 'reflective')  score += w.reflective
    if (d === 'exploration') score += w.exploratory
    if (d === 'physical')    score += w.physical
  })

  return score
}
```

---

## 九、埋点规范

**从 Day 1 接入 Amplitude。无埋点则无法迭代。**

```typescript
// analytics/events.ts

// 卡片展示
analytics.track('card_shown', {
  card_id: card.id,
  card_scale: card.scaleType,
  card_domain: card.atoms.domain,
  card_position: index,           // 在当日栈中的位置
  is_featured: index === 0,
  time_period: context.period,
  is_weekend: context.isWeekend,
})

// 卡片滑动
analytics.track('card_swiped', {
  card_id: card.id,
  direction: 'right' | 'left' | 'up',
  view_duration_ms: viewDurationMs,   // 从展示到滑动的时间
  swipe_duration_ms: swipeDurationMs, // 手势持续时间（慢速左滑 ≠ 确定拒绝）
  card_scale: card.scaleType,
  card_domain: card.atoms.domain,
})

// 预演展开
analytics.track('preview_opened', {
  card_id: card.id,
  trigger: 'button' | 'auto',    // 主动点击 or 自动展示
  before_queue: boolean,          // 入队前还是入队后
})

// 时间锚定
analytics.track('time_anchor_set', {
  card_id: card.id,
  days_since_queued: daysSinceQueued,
})

// 打卡开始
analytics.track('checkin_started', {
  card_id: card.id,
  days_since_queued: daysSinceQueued,
  has_time_anchor: !!timeAnchor,
})

// 打卡完成
analytics.track('checkin_completed', {
  card_id: card.id,
  card_scale: card.scaleType,
  has_photo: !!photoUri,
  emotion: emotion,
  has_note: !!note,
  has_location: !!location,
  days_since_queued: daysSinceQueued,
})

// 碎片分享
analytics.track('fragment_shared', {
  fragment_id: fragment.id,
  card_id: fragment.cardId,
  emotion: fragment.emotion,
  share_method: 'download' | 'copy',
})

// 预演文字浏览（碎片详情）
analytics.track('preview_text_read', {
  fragment_id: fragment.id,
  card_id: fragment.cardId,
  read_duration_ms: readDurationMs,
})

// Onboarding 触发
analytics.track('onboarding_prompt_shown', { swipe_count: 5 })
analytics.track('onboarding_input_submitted', { has_text: !!text })
analytics.track('onboarding_skipped', {})
```

---

## 十、深链规范

Phase 0 Web 暂时不需要实际处理，但 URL 结构从第一天定好，Phase 1 iOS 直接注册。

```
// URL scheme（iOS App）
vibe://card/{cardId}             // 直接打开一张卡片
vibe://checkin/{cardId}          // 直接进入打卡流程（队列已有该卡片）
vibe://fragment/{fragmentId}     // 查看碎片详情
vibe://map                       // 打开城市地图

// Universal Link（Web 落地页，Phase 1 分享链接用）
https://{domain}/card/{cardId}
https://{domain}/fragment/{fragmentId}
```

---

## 十一、工程结构

```
src/
├── data/
│   ├── cards.json               # 初始 62 张卡片（完整 schema）
│   └── emotionColors.ts         # 情绪 → 渐变色映射
│
├── services/
│   ├── index.ts                 # 服务注册（切换实现的唯一入口）
│   ├── interfaces.ts            # 所有接口定义
│   ├── local/
│   │   ├── LocalCardService.ts
│   │   ├── LocalProfileService.ts
│   │   ├── LocalFragmentService.ts
│   │   └── LocalStorageAdapter.ts
│   └── analytics/
│       └── AmplitudeService.ts
│
├── store/
│   ├── cardStatusStore.ts
│   ├── userProfileStore.ts
│   ├── fragmentStore.ts
│   └── dailyStackStore.ts
│
├── algorithms/
│   ├── stackGenerator.ts        # generateDailyStack()
│   ├── scoring.ts               # scoreCard(), updateProfile()
│   ├── insights.ts              # computeLocalInsight()
│   └── fadingChecker.ts         # checkAndApplyFading()
│
├── screens/
│   ├── DiscoverScreen.tsx       # 首页卡片发现
│   ├── QueueScreen.tsx          # 队列页
│   ├── CheckinFlow/
│   │   ├── CheckinScreen.tsx    # 打卡主流程
│   │   ├── PhotoStep.tsx
│   │   ├── EmotionStep.tsx
│   │   └── FragmentReveal.tsx   # 碎片生成动画
│   ├── FragmentsScreen.tsx      # 碎片收藏
│   ├── FragmentDetailScreen.tsx
│   ├── ProfileScreen.tsx        # 六维画像
│   ├── MapScreen.tsx            # 城市地图
│   └── MyScreen.tsx             # 我的
│
├── components/
│   ├── CardStack/               # 核心滑卡组件（Reanimated 3）
│   │   ├── CardStack.tsx
│   │   ├── SwipeableCard.tsx
│   │   └── PreviewPanel.tsx     # 「了解」预演面板
│   ├── Fragment/
│   │   ├── FragmentCard.tsx
│   │   └── ShareImageGenerator.tsx
│   └── shared/
│       ├── EmotionSticker.tsx
│       ├── DimensionBar.tsx
│       └── ScaleBadge.tsx
│
├── utils/
│   ├── deepLinks.ts
│   ├── dateHelpers.ts
│   └── geoHelpers.ts            # 逆地理编码（高德 API）
│
└── app.config.ts                # Expo 配置，含 URL scheme 注册
```

---

## 十二、关键工程决定（不可后改）

| 决定 | 规范 | 原因 |
|------|------|------|
| 卡片滑动动画 | 必须使用 `react-native-reanimated 3` + `react-native-gesture-handler`，UI 线程驱动 | 核心交互，第一印象，不能后补 |
| 所有异步操作 | 通过 Service Interface 调用，禁止直接访问 localStorage | 保证 Phase 1 迁移零成本 |
| Schema 完整性 | Phase 0 不使用的字段填默认值，禁止删除字段 | 后端接入时数据结构要能直接映射 |
| 埋点 | Amplitude Day 1 接入，所有关键交互都要上报 | 没有数据无法迭代 |
| TypeScript | `strict: true`，禁止 `any` | 接口层的类型安全是架构稳定的保障 |
| 图片存储 | Phase 0 存 blob URL（内存），Phase 1 上传 Supabase Storage | blob URL 跨 session 不持久，打卡数据需要迁移脚本或用户重新授权 |

---

## 十三、Phase 0 实施顺序

```
Day 1-2   工程搭建
          ├── Expo 工程初始化（SDK 52，TypeScript strict）
          ├── Reanimated 3 + Gesture Handler 配置与测试
          ├── Zustand stores 骨架 + localStorage persist
          ├── Service Interface 层 + LocalCardService
          └── Amplitude 接入 + 首个测试事件

Day 3-4   核心交互
          ├── CardStack 组件（滑动手势 + 方向检测 + 动画反馈）
          ├── 卡片内容展示（封面 + 标题 + 标签行）
          ├── 「了解」预演面板（半屏弹出）
          ├── 状态机：SHOWN → QUEUED / REJECTED / DONE_BEFORE
          └── 每日栈生成算法（本地）

Day 5     打卡流程
          ├── 打卡三步流程（照片 → 情绪 → 完成）
          ├── Fragment 对象生成 + 存储
          ├── 碎片展示动画
          └── 维度分数更新逻辑

Day 6     配套页面
          ├── 队列页（含褪色展示 + 时间锚定 + 快捷打卡入口）
          ├── 碎片收藏页 + 详情页
          ├── 六维画像页（增量展示）
          └── 城市地图页（高德 + 打卡点渲染）

Day 7     收尾
          ├── 逆向 Onboarding（第 5 次交互触发）
          ├── 碎片分享图生成（Canvas）
          ├── 「我的」页
          ├── 褪色定时检查（App 启动时执行）
          └── Vercel 部署 + 发链接
```

---

*Phase 0 规格文档 v1.0 | 2026-03-23*
