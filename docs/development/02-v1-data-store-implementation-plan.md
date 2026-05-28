# V1 数据层实现顺序

日期: 2026-05-28
研发分支: v1-data-store
依据: `docs/architecture/03-v1-data-store-design.md`

## 1. 目标

本文把 V1 数据层拆成 P0 / P1 / P2 三个实现层级。

排序原则:

- 先保护已有数据和写作闭环。
- 先建立可迁移的数据底座，再抽复杂仓储。
- 保留现有核心实体和 UI 行为，不在数据层分支里重做产品形态。
- 每一级完成后都应能独立验收和回滚。

## 2. P0: 数据底座与兼容加载

状态: 已完成，2026-05-28

P0 目标是让项目拥有真正的数据层入口，同时不破坏现有 UI 原型和旧 localStorage 数据。

### 2.1 范围

- 增加数据 schema 版本常量。
- 增加 `DataStoreMeta` 顶层元信息。
- 兼容加载旧版没有 `meta` 的本地数据。
- 把 localStorage 读写封装到 adapter。
- 建立 store 门面，统一 `load / save / reset`。
- 保留 `createInitialState` 和 `seedProjectDefaults` 行为。
- 保证刷新后现有数据不丢。
- 保证主题配置兼容补齐。

### 2.2 不做

- 不做完整 repository 拆分。
- 不做项目备份导入 / 导出。
- 不改 UI 交互。
- 不接后端、IndexedDB 或本地文件。
- 不改变 `Setting` 命名。
- 不做章节复盘、伏笔、时间线。

### 2.3 验收标准

- 旧 `webnovel-ide:v1` 数据可以正常加载。
- 新保存的数据包含 `meta.schemaVersion`。
- 没有旧数据时仍能创建默认本地用户和默认设置。
- 创建作品后仍自动创建 `第一卷` 和 `第 1 章`。
- `npm run build` 通过。

## 3. P1: 数据操作收敛与项目备份

状态: 进行中，已完成第一批 repository 收敛，2026-05-28

P1 目标是把主要写入路径从 UI 中逐步收敛到数据服务，并补上项目级备份能力。

### 3.1 范围

- 建立 project / chapter / character / setting / relation / ai repositories。
- 把 `WorkspacePage` 中的创建、删除、重命名、排序逻辑迁移到 repository。
- 把 `ContextPanel` 中的章节属性、关联、AI 请求记录写入迁移到 repository。
- 增加项目级 JSON 备份导出。
- 增加项目级 JSON 备份导入为新项目。
- 明确删除级联规则并集中实现。

### 3.2 不做

- 不做服务端 API。
- 不做真实 AI provider。
- 不做复杂版本历史。
- 不做多人协作。

### 3.3 验收标准

- UI 层不直接拼装大段数据写入逻辑。
- 删除章节、人物、资料后不会留下脏关联。
- 项目可以导出备份文件。
- 项目备份可以导入为新项目。
- 现有 CRUD 行为不退化。

### 3.4 第一批已完成

- 新增 `projectRepository`，收敛作品创建和打开逻辑。
- 新增 `chapterRepository`，收敛卷 / 章节创建、重命名、删除、排序、正文追加和章节更新逻辑。
- 新增 `characterRepository`，收敛人物创建、重命名和删除逻辑。
- 新增 `settingRepository`，收敛资料创建、重命名和删除逻辑。
- 新增 `relationRepository`，收敛章节人物 / 章节资料关联切换逻辑。
- 新增 `aiRepository`，收敛 mock AI 成功请求记录逻辑。
- 新增演示项目数据集，用于验证作品、卷、章节、人物、资料、关联和 AI 请求记录。
- 新增 `npm run test:data-store`，用于自动验证 demo fixture、默认项目创建、关联、正文追加、AI 请求记录和删除级联。
- `App.tsx`、`WorkspacePage.tsx`、`ContextPanel.tsx` 已迁移一批核心写入调用。
- `npm run build` 已通过。

### 3.5 P1 剩余事项

- 把编辑器和设置弹窗中的字段更新逻辑继续迁移到 repository。
- 增加项目级 JSON 备份导出。
- 增加项目级 JSON 备份导入为新项目。
- 补一轮删除级联与导入导出手工验收。

## 4. P2: 可迁移存储与高级安全能力

P2 目标是为更长期的本地优先或服务端版本做准备。

### 4.1 范围

- IndexedDB adapter 设计或实现。
- 本地文件 / 桌面端存储策略预研。
- 数据校验和修复工具。
- 更完整的 migration 测试。
- 导入覆盖、冲突处理和 ID 重映射策略增强。
- 章节版本历史预留。

### 4.2 不做

- 不在没有产品定案前实现复杂同步。
- 不做协作冲突解决。
- 不把资料库强行拆成多个实体。

### 4.3 验收标准

- 数据层 adapter 可替换。
- migration 有测试或手工验证样本。
- 未来迁移到 IndexedDB / 服务端 API 不需要重写 UI。

## 5. 当前执行决定

本轮已优先完成 P0。

完成 P0 后，再评估是否继续进入 P1。P1 会明显触及多个 UI 组件的数据写入路径，应该在 P0 build 通过后单独推进。

P0 完成内容:

- 新增 `src/data/schema.ts`，集中定义 storage key 和 schema version。
- 新增 `src/data/migrations.ts`，兼容旧数据并补齐 `meta`、`appSettings` 和 AI 配置默认值。
- 新增 `src/data/adapters/localStorageAdapter.ts`，封装 localStorage 读写。
- 新增 `src/data/store.ts`，提供 `loadState`、`saveState`、`resetState`、`createInitialState`、`seedProjectDefaults`。
- 保留 `src/storage.ts` 作为兼容导出入口，避免一次性大改 UI。
- `WebnovelIDEState` 增加 `meta: DataStoreMeta`。
- `npm run build` 已通过。
