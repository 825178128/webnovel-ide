# MVP 数据模型

版本: v0.1
日期: 2026-05-26
阶段: Phase 0 / MVP 数据设计
研发分支: v1-development

## 1. 设计目标

本文件定义 Webnovel IDE MVP 阶段的数据模型，用于指导本地原型、前端状态设计和后续全栈数据库设计。

数据模型需要满足：

- 支撑作品、卷、章节的长篇结构。
- 支撑人物库和设定库。
- 支撑章节与人物/设定的关联。
- 支撑 AI 请求记录。
- 为后续伏笔、时间线、章节自动梳理、协作和商业化保留扩展空间。

## 2. MVP 实体总览

MVP 需要实现的核心实体：

```text
User
Project
Volume
Chapter
Character
Setting
AIRequest
AIConfig
```

关系概览：

```text
User 1 ── n Project
Project 1 ── n Volume
Project 1 ── n Chapter
Volume 1 ── n Chapter
Project 1 ── n Character
Project 1 ── n Setting
Chapter n ── n Character
Chapter n ── n Setting
Project 1 ── n AIRequest
Chapter 1 ── n AIRequest
User 1 ── 1 AIConfig
```

MVP 本地原型可使用字符串 ID 和本地存储。全栈版本迁移到 PostgreSQL + Prisma。

## 3. 通用字段规范

所有核心实体建议包含：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一 ID |
| createdAt | string | ISO 时间 |
| updatedAt | string | ISO 时间 |

排序字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| order | number | 同级排序 |

软删除字段后续可加：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| deletedAt | string / null | 软删除时间 |

MVP 可先物理删除，后续全栈版本考虑软删除和回收站。

## 4. User

MVP 开发期可以使用单用户模式，但数据结构仍保留 User。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 用户 ID |
| name | string | 否 | 昵称 |
| email | string | 否 | 邮箱 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### TypeScript 草案

```ts
export interface User {
  id: string
  name?: string
  email?: string
  createdAt: string
  updatedAt: string
}
```

## 5. Project

Project 表示一本作品。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 作品 ID |
| userId | string | 是 | 作者 ID |
| title | string | 是 | 作品名 |
| genre | string | 否 | 题材/类型 |
| synopsis | string | 否 | 简介 |
| targetPlatform | string | 否 | 目标平台 |
| targetWordCount | number | 否 | 目标字数 |
| dailyWordTarget | number | 否 | 日更目标 |
| status | ProjectStatus | 是 | 作品状态 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### 状态枚举

```ts
export type ProjectStatus =
  | 'planning'
  | 'writing'
  | 'paused'
  | 'completed'
  | 'archived'
```

### TypeScript 草案

```ts
export interface Project {
  id: string
  userId: string
  title: string
  genre?: string
  synopsis?: string
  targetPlatform?: string
  targetWordCount?: number
  dailyWordTarget?: number
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}
```

## 6. Volume

Volume 表示作品中的卷。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 卷 ID |
| projectId | string | 是 | 所属作品 |
| title | string | 是 | 卷名 |
| summary | string | 否 | 卷简介 |
| order | number | 是 | 排序 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### TypeScript 草案

```ts
export interface Volume {
  id: string
  projectId: string
  title: string
  summary?: string
  order: number
  createdAt: string
  updatedAt: string
}
```

## 7. Chapter

Chapter 表示章节，是 MVP 最核心的数据实体。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 章节 ID |
| projectId | string | 是 | 所属作品 |
| volumeId | string | 是 | 所属卷 |
| title | string | 是 | 章节标题 |
| goal | string | 否 | 本章目标 |
| summary | string | 否 | 本章摘要 |
| content | string | 是 | 正文内容 |
| status | ChapterStatus | 是 | 章节状态 |
| wordCount | number | 是 | 字数 |
| order | number | 是 | 排序 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### 状态枚举

```ts
export type ChapterStatus =
  | 'draft'
  | 'writing'
  | 'revision'
  | 'completed'
```

### TypeScript 草案

```ts
export interface Chapter {
  id: string
  projectId: string
  volumeId: string
  title: string
  goal?: string
  summary?: string
  content: string
  status: ChapterStatus
  wordCount: number
  order: number
  createdAt: string
  updatedAt: string
}
```

### 后续扩展

P1 可增加：

- lastReviewAt: 最后自动梳理时间。
- reviewStatus: 未梳理 / 已梳理 / 待确认。
- rhythmTags: 节奏标签。
- hookNote: 结尾钩子记录。

## 8. Character

Character 表示作品中的人物卡。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 人物 ID |
| projectId | string | 是 | 所属作品 |
| name | string | 是 | 姓名 |
| role | string | 否 | 身份/角色定位 |
| faction | string | 否 | 阵营/势力 |
| personality | string | 否 | 性格关键词 |
| desire | string | 否 | 目标/欲望 |
| abilities | string | 否 | 能力/特长 |
| speechStyle | string | 否 | 口吻特点 |
| currentState | string | 否 | 当前状态 |
| notes | string | 否 | 备注 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### TypeScript 草案

```ts
export interface Character {
  id: string
  projectId: string
  name: string
  role?: string
  faction?: string
  personality?: string
  desire?: string
  abilities?: string
  speechStyle?: string
  currentState?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

## 9. Setting

Setting 表示作品设定。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 设定 ID |
| projectId | string | 是 | 所属作品 |
| title | string | 是 | 设定标题 |
| category | SettingCategory | 是 | 设定分类 |
| content | string | 是 | 设定内容 |
| importance | SettingImportance | 是 | 重要程度 |
| notes | string | 否 | 备注 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### 分类枚举

```ts
export type SettingCategory =
  | 'world'
  | 'faction'
  | 'power_system'
  | 'item'
  | 'location'
  | 'rule'
  | 'other'
```

### 重要程度枚举

```ts
export type SettingImportance =
  | 'low'
  | 'medium'
  | 'high'
```

### TypeScript 草案

```ts
export interface Setting {
  id: string
  projectId: string
  title: string
  category: SettingCategory
  content: string
  importance: SettingImportance
  notes?: string
  createdAt: string
  updatedAt: string
}
```

## 10. ChapterCharacter

ChapterCharacter 表示章节与人物的多对多关联。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| chapterId | string | 是 | 章节 ID |
| characterId | string | 是 | 人物 ID |
| roleInChapter | string | 否 | 本章作用 |
| createdAt | string | 是 | 创建时间 |

### TypeScript 草案

```ts
export interface ChapterCharacter {
  chapterId: string
  characterId: string
  roleInChapter?: string
  createdAt: string
}
```

## 11. ChapterSetting

ChapterSetting 表示章节与设定的多对多关联。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| chapterId | string | 是 | 章节 ID |
| settingId | string | 是 | 设定 ID |
| usageNote | string | 否 | 本章如何使用该设定 |
| createdAt | string | 是 | 创建时间 |

### TypeScript 草案

```ts
export interface ChapterSetting {
  chapterId: string
  settingId: string
  usageNote?: string
  createdAt: string
}
```

## 12. AIRequest

AIRequest 记录 AI 调用，方便调试、成本统计和后续优化上下文。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 请求 ID |
| userId | string | 是 | 用户 ID |
| projectId | string | 是 | 作品 ID |
| chapterId | string | 否 | 关联章节 |
| taskType | AITaskType | 是 | AI 任务类型 |
| instruction | string | 否 | 用户指令 |
| inputSnapshot | string | 是 | 输入上下文快照 |
| output | string | 否 | AI 输出 |
| provider | string | 否 | 模型供应商 |
| model | string | 否 | 模型 |
| status | AIRequestStatus | 是 | 状态 |
| errorMessage | string | 否 | 错误信息 |
| createdAt | string | 是 | 创建时间 |
| completedAt | string | 否 | 完成时间 |

### 任务类型枚举

```ts
export type AITaskType =
  | 'continue'
  | 'polish'
  | 'summarize'
  | 'rewrite'
```

### 状态枚举

```ts
export type AIRequestStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
```

### TypeScript 草案

```ts
export interface AIRequest {
  id: string
  userId: string
  projectId: string
  chapterId?: string
  taskType: AITaskType
  instruction?: string
  inputSnapshot: string
  output?: string
  provider?: string
  model?: string
  status: AIRequestStatus
  errorMessage?: string
  createdAt: string
  completedAt?: string
}
```

## 13. 本地原型数据容器

## 13. AIConfig

AIConfig 表示 MVP 本地原型中的 AI 配置。全栈版本应迁移到服务端安全存储或后端代理，不应长期把真实密钥保存在前端。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| provider | string | 是 | 模型供应商 |
| apiKey | string | 否 | API Key，本地原型临时保存 |
| model | string | 是 | 模型名称 |
| baseUrl | string | 否 | OpenAI 兼容接口地址 |
| updatedAt | string | 否 | 更新时间 |

### TypeScript 草案

```ts
export interface AIConfig {
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
  updatedAt?: string
}
```

## 14. 本地原型数据容器

第一版本地原型可以用一个聚合对象存储。

```ts
export interface WebnovelIDEState {
  users: User[]
  projects: Project[]
  volumes: Volume[]
  chapters: Chapter[]
  characters: Character[]
  settings: Setting[]
  chapterCharacters: ChapterCharacter[]
  chapterSettings: ChapterSetting[]
  aiRequests: AIRequest[]
  aiConfig?: AIConfig
  activeProjectId?: string
  activeChapterId?: string
}
```

本地存储 key 建议：

```text
webnovel-ide:v1
```

## 15. 字数统计规则

MVP 阶段采用简单中文网文字数统计：

- 去除空白字符。
- 中文、英文、数字均按字符计数。
- 后续可增加平台专用统计规则。

示例：

```ts
export function countWords(content: string): number {
  return content.replace(/\s/g, '').length
}
```

## 16. AI 上下文组装数据

AI 调用时不直接读取全部作品，而是组装最小必要上下文。

```ts
export interface AIContext {
  project: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>
  chapter: Pick<Chapter, 'title' | 'goal' | 'summary' | 'content'>
  selectedText?: string
  relatedCharacters: Character[]
  relatedSettings: Setting[]
}
```

MVP 任务上下文：

| 任务 | 必要上下文 |
| --- | --- |
| 续写 | 作品信息、章节标题、章节目标、正文末尾、相关人物、相关设定 |
| 润色 | 选中文本、章节目标、相关人物、相关设定 |
| 总结 | 章节标题、章节目标、章节正文 |
| 改写 | 选中文本、用户指令、章节目标 |

## 17. 后续实体预留

P1/P2/P3 可逐步加入：

| 实体 | 用途 |
| --- | --- |
| Foreshadowing | 伏笔管理 |
| TimelineEvent | 时间线 |
| PlotThread | 主线/支线 |
| ChapterReview | 章节自动梳理结果 |
| Comment | 批注审稿 |
| Team | 工作室 |
| Membership | 团队成员 |
| Subscription | 订阅与套餐 |
| Material | 素材库 |
| ExportJob | 导出任务 |

## 18. MVP 数据验收

- [ ] 一个用户可以拥有多个作品。
- [ ] 一个作品可以拥有多个卷。
- [ ] 一个卷可以拥有多个章节。
- [ ] 一个作品可以拥有多个人物。
- [ ] 一个作品可以拥有多个设定。
- [ ] 一个章节可以关联多个人物。
- [ ] 一个章节可以关联多个设定。
- [ ] AI 请求可以记录任务类型、输入快照和输出。
- [ ] AI 配置可以保存 Provider、Model、Base URL 和本地原型密钥。
- [ ] 刷新页面后本地数据不丢失。
- [ ] 后续能平滑迁移到 PostgreSQL + Prisma。

## 19. 下一步

下一步可以开始工程实现：

1. 初始化前端项目。
2. 建立 TypeScript 数据类型。
3. 建立本地存储层。
4. 搭建作品列表与工作台壳。
