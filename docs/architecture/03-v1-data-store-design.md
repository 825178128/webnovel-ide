# V1 数据层设计

版本: v0.1
日期: 2026-05-28
研发分支: v1-data-store
状态: 设计草案

## 1. 文档目标

本文用于指导 `v1-data-store` 分支的数据层设计与实现。

当前阶段不追求一次性设计最终数据库，而是建立一个能支撑 V1 MVP 写作闭环、同时不锁死后续产品形态的最小稳定数据底座。

本设计必须保留现有 `docs/architecture/02-data-model.md` 中已经明确的核心实体与关系，并在此基础上补充数据仓储边界、版本迁移策略、AI 写入边界和后续扩展预留。

## 2. 当前不确定性

以下问题目前不应过早定死:

- 资料库最终命名是“设定库”“资料库”“知识库”还是“素材库”。
- 资料是否会拆成世界设定、素材摘录、地点组织、规则体系、拆书卡等多个实体。
- 章节复盘结果是否会成为独立实体，还是先作为 AI 请求结果和待确认草稿存在。
- 人物状态是覆盖式字段，还是需要完整历史记录。
- 伏笔、时间线、剧情线的最终交互形态。
- 第一版数据是否长期停留在 localStorage，还是迁移到 IndexedDB、本地文件或服务端 API。
- 未来是否支持多人协作、版本历史、桌面端离线写作。

因此 V1 数据层的目标不是完整建模所有未来能力，而是保留可迁移、可扩展、可确认写入的边界。

## 3. 设计原则

- 保留现有核心实体，不在本分支推翻 `Project`、`Volume`、`Chapter`、`Character`、`Setting`、`AIRequest`。
- UI 不直接依赖 localStorage，统一通过数据层读取和写入。
- 数据层第一版仍可使用 localStorage 适配器，但接口需要能迁移到 IndexedDB、本地文件或服务端 API。
- 正文内容是最高优先级资产，任何 AI 操作不得自动覆盖。
- AI 只能生成建议，不得自动写入正式人物、资料、章节事实。
- 所有 AI 建议写入正式数据前，都必须经过用户确认。
- 章节、人物、资料之间通过关系表连接，不通过纯文本隐式绑定。
- 核心数据需要有版本号，后续可以迁移。
- 暂不明确的未来能力以扩展实体和元数据预留，不提前复杂化 MVP。

## 4. V1 数据边界

### 4.1 V1 必须稳定的数据

| 数据 | 说明 | 当前状态 |
| --- | --- | --- |
| User | 本地单用户模式保留用户实体 | 已存在 |
| Project | 作品，一本书的顶层容器 | 已存在 |
| Volume | 卷，章节结构分组 | 已存在 |
| Chapter | 章节，正文写作核心资产 | 已存在 |
| Character | 人物卡 | 已存在 |
| Setting | 设定 / 资料卡，命名暂保留为 Setting | 已存在 |
| ChapterCharacter | 章节与人物关联 | 已存在 |
| ChapterSetting | 章节与资料关联 | 已存在 |
| AIRequest | AI 请求记录 | 已存在 |
| AIConfig | 本地原型 AI 配置 | 已存在 |
| AppSettings | 应用设置，例如主题 | 已存在 |

### 4.2 V1 必须保留设计空间的数据

| 预留实体 | 用途 | 当前处理 |
| --- | --- | --- |
| ChapterReview | 章节复盘结果 | 暂不实现，只在设计中预留 |
| CharacterStateHistory | 人物状态历史 | 暂由 `Character.currentState` 承担当前状态 |
| SettingChange | 设定变更记录 | 暂由 `Setting.updatedAt` 和复盘预留承接 |
| Foreshadowing | 伏笔管理 | 暂不实现 |
| TimelineEvent | 时间线事件 | 暂不实现 |
| PlotThread | 主线 / 支线 | 暂不实现 |
| Material | 素材或拆书资料 | 暂不与 Setting 合并定死 |
| ExportJob | 导出任务记录 | V1 可先即时导出，不落库 |
| Revision | 章节版本历史 | 暂不实现，但正文写入接口需避免覆盖风险 |

## 5. 数据容器版本

当前本地存储 key 保留:

```text
webnovel-ide:v1
```

V1 数据容器建议增加顶层元信息:

```ts
export interface DataStoreMeta {
  schemaVersion: number
  appVersion?: string
  createdAt: string
  updatedAt: string
}
```

当前 `WebnovelIDEState` 可演进为:

```ts
export interface WebnovelIDEState {
  meta: DataStoreMeta
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
  appSettings?: AppSettings
  activeProjectId?: string
  activeChapterId?: string
}
```

兼容要求:

- 旧数据没有 `meta` 时，加载时补齐。
- 旧数据没有 `appSettings` 时，继续补默认主题。
- 未来 schema 升级通过 migration 函数处理，不在 UI 组件中散落兼容逻辑。

## 6. 核心实体保留与说明

### 6.1 Project

保留现有字段:

- `id`
- `userId`
- `title`
- `genre`
- `synopsis`
- `targetPlatform`
- `targetWordCount`
- `dailyWordTarget`
- `status`
- `createdAt`
- `updatedAt`

暂不加入复杂字段:

- 平台数据。
- 商业评分。
- 协作者。
- 付费状态。

原因: 这些属于 P2/P3，依赖后续商业化和协作模型。

### 6.2 Volume

保留现有字段:

- `id`
- `projectId`
- `title`
- `summary`
- `order`
- `createdAt`
- `updatedAt`

数据层需要保证:

- 同一作品下卷排序稳定。
- 删除卷时明确是否级联删除章节。V1 继续沿用当前 UI 行为: 删除卷会删除卷内章节及其关联。

### 6.3 Chapter

保留现有字段:

- `id`
- `projectId`
- `volumeId`
- `title`
- `goal`
- `summary`
- `content`
- `status`
- `wordCount`
- `order`
- `createdAt`
- `updatedAt`

重要规则:

- `content` 是核心资产，写入必须走章节数据接口。
- `wordCount` 由数据层或编辑器保存时统一计算，避免 UI 多处重复计算。
- `summary` 可以由用户手写，也可以由 AI 建议后用户确认写入。
- AI 续写、润色、改写结果不得自动覆盖 `content`。

暂不加入但保留:

- `lastReviewAt`
- `reviewStatus`
- `hookNote`
- `rhythmTags`
- `version`

### 6.4 Character

保留现有字段:

- `id`
- `projectId`
- `name`
- `role`
- `faction`
- `personality`
- `desire`
- `abilities`
- `speechStyle`
- `currentState`
- `notes`
- `createdAt`
- `updatedAt`

重要规则:

- `currentState` 表示当前确认状态。
- AI 提取的人物状态变化不能直接覆盖 `currentState`。
- 后续章节复盘应先生成待确认建议，再由用户确认写入。

暂不加入但保留:

- 人物关系。
- 人物状态历史。
- 出场统计。
- 口吻样本。

### 6.5 Setting

当前字段继续保留，命名暂不推翻:

- `id`
- `projectId`
- `title`
- `category`
- `content`
- `importance`
- `notes`
- `createdAt`
- `updatedAt`

说明:

- UI 可以显示为“资料库”，底层类型暂保留 `Setting`，避免在数据层分支中引入大规模命名迁移。
- 后续如果确认要升级为 `KnowledgeItem`，应通过 schema migration 和类型兼容单独处理。

重要规则:

- `Setting` 当前承载世界观、势力、等级体系、道具、地点、规则和其他资料。
- 素材摘录、拆书卡、平台资料暂不直接混入 `Setting`。
- AI 提取的新设定或设定变更必须先进入待确认结果，不能直接写入。

### 6.6 ChapterCharacter

保留现有字段:

- `chapterId`
- `characterId`
- `roleInChapter`
- `createdAt`

数据层需要保证:

- 同一章节和同一人物不重复关联。
- 删除章节时清理关联。
- 删除人物时清理关联。

后续可扩展:

- 本章人物状态。
- 本章人物目标。
- 本章出场类型。

### 6.7 ChapterSetting

保留现有字段:

- `chapterId`
- `settingId`
- `usageNote`
- `createdAt`

数据层需要保证:

- 同一章节和同一资料不重复关联。
- 删除章节时清理关联。
- 删除资料时清理关联。

后续可扩展:

- 引用位置。
- 设定在本章的变化。
- 是否由复盘提取。

### 6.8 AIRequest

保留现有字段:

- `id`
- `userId`
- `projectId`
- `chapterId`
- `taskType`
- `instruction`
- `inputSnapshot`
- `output`
- `provider`
- `model`
- `status`
- `errorMessage`
- `createdAt`
- `completedAt`

建议演进:

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
  appliedAt?: string
}
```

`appliedAt` 表示 AI 输出是否已经被用户应用到正文或数据中。V1 可选实现，不强制。

## 7. 仓储接口设计

数据层第一版建议放在:

```text
src/data/
```

建议结构:

```text
src/data/
  store.ts
  schema.ts
  migrations.ts
  repositories/
    projectRepository.ts
    chapterRepository.ts
    characterRepository.ts
    settingRepository.ts
    aiRepository.ts
  adapters/
    localStorageAdapter.ts
```

### 7.1 Store 接口

```ts
export interface DataStore {
  load(): WebnovelIDEState
  save(state: WebnovelIDEState): void
  reset(): WebnovelIDEState
  exportProject(projectId: string): ProjectBackup
  importProject(backup: ProjectBackup): WebnovelIDEState
}
```

### 7.2 Repository 职责

Repository 负责业务数据操作，不负责组件状态。

| Repository | 职责 |
| --- | --- |
| ProjectRepository | 作品创建、编辑、删除、列表、打开 |
| ChapterRepository | 卷和章节 CRUD、排序、正文保存、字数统计 |
| CharacterRepository | 人物 CRUD |
| SettingRepository | 资料 CRUD |
| RelationRepository | 章节人物、章节资料关联 |
| AIRepository | AI 请求记录创建、状态更新、结果保存 |
| SettingsRepository | 应用设置和 AI 配置 |

说明:

- `activeProjectId` 和 `activeChapterId` 是应用会话选择状态，可以暂时留在 state 中。
- 后续如果进入路由化工作台，可把 active 状态迁移到 URL 或 UI store。

## 8. 数据写入规则

### 8.1 创建作品

创建作品时必须同时创建:

- 默认卷: `第一卷`
- 默认章节: `第 1 章`

该行为当前由 `seedProjectDefaults` 实现，数据层需要保留。

### 8.2 删除作品

删除作品时应级联删除:

- 作品下的卷。
- 作品下的章节。
- 作品下的人物。
- 作品下的资料。
- 章节人物关联。
- 章节资料关联。
- 作品相关 AI 请求。

### 8.3 删除卷

删除卷时应级联删除:

- 卷内章节。
- 这些章节的人物关联。
- 这些章节的资料关联。
- 这些章节相关 AI 请求。

### 8.4 删除章节

删除章节时应级联删除:

- 章节人物关联。
- 章节资料关联。
- 章节相关 AI 请求。

### 8.5 删除人物

删除人物时应级联删除:

- 该人物的章节关联。

不删除:

- 章节正文中已经写下的人物文本。
- AI 请求历史中的快照。

### 8.6 删除资料

删除资料时应级联删除:

- 该资料的章节关联。

不删除:

- 章节正文。
- AI 请求历史中的快照。

## 9. AI 写入边界

AI 相关数据分三层:

| 层级 | 说明 | 是否正式数据 |
| --- | --- | --- |
| Input Snapshot | 发给 AI 的上下文快照 | 否 |
| AI Output | AI 返回结果 | 否 |
| Applied Data | 用户确认后写入的正文、摘要、人物状态或资料 | 是 |

规则:

- 生成续写: 输出只进入 AI 结果区，用户点击插入后才追加到正文。
- 生成润色: 输出只进入 AI 结果区，用户确认后才替换选区或插入。
- 生成总结: 输出只进入 AI 结果区，用户确认后才写入 `Chapter.summary`。
- 生成改写: 输出只进入 AI 结果区，用户确认后才替换选区或插入。
- 章节复盘: 输出先成为待确认建议，不直接写入人物或资料。

## 10. 项目备份格式

V1 需要支持项目级导出 / 导入备份。

建议格式:

```ts
export interface ProjectBackup {
  meta: {
    backupVersion: number
    exportedAt: string
    appVersion?: string
    projectId: string
    projectTitle: string
  }
  project: Project
  volumes: Volume[]
  chapters: Chapter[]
  characters: Character[]
  settings: Setting[]
  chapterCharacters: ChapterCharacter[]
  chapterSettings: ChapterSetting[]
  aiRequests?: AIRequest[]
}
```

导入规则:

- 默认导入为新项目，避免覆盖同 ID 项目。
- 导入时可重新生成 ID，并重映射卷、章节、人物、资料关联。
- 如果未来支持覆盖导入，需要单独确认。

## 11. Migration 设计

第一版需要至少支持:

```ts
const CURRENT_SCHEMA_VERSION = 1
```

加载流程:

```text
读取 raw localStorage
  ↓
JSON parse
  ↓
补齐缺失 meta
  ↓
按 schemaVersion 运行 migrations
  ↓
补齐默认字段
  ↓
返回 WebnovelIDEState
```

迁移规则:

- migration 只处理数据结构，不处理 UI 状态。
- migration 必须是幂等的。
- migration 不删除用户正文。
- migration 遇到无法识别数据时，应尽量保留原字段。

## 12. 第一版实现顺序

建议在 `v1-data-store` 分支内按以下顺序推进:

1. 补齐数据设计文档。
2. 增加 `meta.schemaVersion` 设计和加载兼容。
3. 建立 localStorage adapter。
4. 建立 store 层。
5. 建立 repository 层。
6. 把 `App.tsx`、`WorkspacePage.tsx`、`ContextPanel.tsx` 中的数据写入逐步迁移到 repository。
7. 增加项目备份导出 / 导入。
8. 做刷新、删除、导入导出回归。

## 13. V1 不做事项

本分支不做:

- 后端 API。
- PostgreSQL / Prisma。
- 登录注册。
- 多用户协作。
- 章节版本历史。
- 自动发布平台。
- 完整素材库。
- 完整伏笔库。
- 完整时间线。
- 真实 AI Provider 接入。
- 复杂富文本编辑器。

这些能力需要建立在稳定数据层、编辑器核心和 AI 上下文系统之后。

## 14. 验收标准

数据层分支完成时应满足:

- 刷新页面后现有核心数据不丢失。
- 旧 localStorage 数据可以被兼容加载。
- 新数据包含 schema version。
- 创建作品仍会自动创建默认卷和默认章节。
- 作品、卷、章节、人物、资料的 CRUD 行为不退化。
- 章节正文保存和字数统计不退化。
- 章节与人物、资料的关联不退化。
- 删除章节、人物、资料后不会留下明显脏关联。
- AI 请求记录不退化。
- UI 层不直接读写 localStorage。
- 项目数据可以导出备份。
- 项目备份可以导入为新项目。
- 当前 UI 布局、主题和交互壳不被破坏。

## 15. 与后续分支的关系

`v1-editor-core` 依赖:

- 章节保存接口。
- 字数统计接口。
- 插入正文和替换选区的写入规则。

`v1-context-relations` 依赖:

- 章节人物关联接口。
- 章节资料关联接口。
- 关联查询接口。

`v1-ai-context` 依赖:

- 当前章节、作品、人物、资料的稳定查询接口。
- AI 请求记录接口。
- AI 输出应用状态。

`v1-continuity-review` 依赖:

- 章节摘要写入规则。
- 人物状态写入规则。
- 资料变更写入规则。
- 待确认建议数据结构。

`v1-export-publish-ready` 依赖:

- 稳定的作品、卷、章节顺序查询接口。
- 项目级数据导出接口。

## 16. 后续需要单独设计的问题

以下问题不在本设计中解决，但需要后续单独开文档:

- `Setting` 是否升级为 `KnowledgeItem`。
- 章节复盘待确认数据结构。
- 人物状态历史结构。
- 伏笔与时间线数据结构。
- 章节版本历史。
- 本地文件夹 / 桌面端存储策略。
- 服务端 API 与同步冲突处理。
