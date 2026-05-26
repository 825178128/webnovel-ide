# 技术栈选型

版本: v0.1
日期: 2026-05-26
阶段: Phase 0 / 技术方案确认

## 1. 选型目标

Webnovel IDE 的技术栈需要同时满足三类目标：

1. 快速做出可验证 MVP。
2. 支撑商业级长篇写作产品的复杂度。
3. 后续能平滑扩展到桌面端、AI 长篇记忆、协作和素材库。

因此第一版应优先选择成熟、生态完整、工程风险低的方案。

## 2. 产品形态选择

### 2.1 第一阶段形态

第一阶段采用 Web App 优先。

原因：

- 便于快速迭代和内测。
- 用户无需安装即可试用。
- AI 服务、账号系统、订阅系统、云端同步更容易接入。
- 后续可以用 Electron 或 Tauri 包装为桌面端。

### 2.2 后续形态

中后期支持：

- Web 版：主产品入口。
- 桌面版：面向重度作者，提供本地文件、离线草稿、系统级快捷键。
- 私有化版：面向工作室或机构客户。

## 3. 推荐技术栈

### 3.1 前端

| 类型 | 推荐方案 | 说明 |
| --- | --- | --- |
| 框架 | React + TypeScript | 生态成熟，适合复杂 IDE 型界面 |
| 构建 | Vite | 启动快，适合前期研发 |
| 路由 | React Router | Web IDE 内部页面流转足够稳定 |
| 状态管理 | Zustand | 简洁，适合项目状态、编辑器状态、面板状态 |
| 数据请求 | TanStack Query | 管理服务端数据、缓存和异步状态 |
| UI 基础 | Tailwind CSS + shadcn/ui | 快速搭建专业后台/工具型界面 |
| 图标 | lucide-react | 与 shadcn/ui 适配好 |

说明：

第一版暂不直接上 Next.js。Webnovel IDE 初期更像一个复杂单页应用，而不是内容站或 SEO 产品。Vite + React 更适合快速打造 IDE 壳、编辑器和多面板交互。

当后续需要官网、营销页、服务端渲染或统一全栈路由时，可再引入 Next.js 或拆出独立官网。

### 3.2 编辑器

| 类型 | 推荐方案 | 说明 |
| --- | --- | --- |
| 正文编辑器 | TipTap | 基于 ProseMirror，可扩展评论、批注、AI 插入、节点标记 |
| 纯文本导出 | Markdown / TXT | 适配网文平台发布流转 |
| 长文性能策略 | 分章节加载 | 不在单个编辑器内加载整本书 |

选择 TipTap 的原因：

- 支持富文本、结构化节点和扩展。
- 适合实现 AI 局部改写、批注、章节标记、敏感词高亮。
- 比从零写编辑器风险低。

### 3.3 后端

| 类型 | 推荐方案 | 说明 |
| --- | --- | --- |
| 运行时 | Node.js | 与前端 TypeScript 统一技术栈 |
| 服务框架 | NestJS | 适合商业级模块化后端 |
| API 风格 | REST 优先，后续可补 tRPC / GraphQL | MVP 易调试，扩展成本低 |
| ORM | Prisma | 类型安全，迁移清晰 |
| 数据库 | PostgreSQL | 成熟稳定，适合结构化创作数据 |
| 向量扩展 | pgvector | MVP 阶段减少额外服务复杂度 |
| 缓存/队列 | Redis + BullMQ | AI 异步任务、长任务、限流 |

说明：

如果第一版只做本地原型，可以先用前端本地存储或 SQLite 过渡。但商业级方向应以 PostgreSQL 为主线设计数据模型。

### 3.4 AI 服务层

| 类型 | 推荐方案 | 说明 |
| --- | --- | --- |
| 模型接入 | Provider Adapter | 抽象 OpenAI、国产模型、本地模型等供应商 |
| AI 任务 | Task-based Pipeline | 续写、润色、总结、检查等任务独立配置 |
| 上下文系统 | Context Builder | 按任务组装章节、人物、设定、摘要、检索结果 |
| 长篇记忆 | 摘要 + 结构化状态 + 向量检索 | 不依赖单次超长上下文 |
| 异步执行 | Queue Worker | 避免 AI 请求阻塞编辑器 |

AI 层原则：

- AI 不直接覆盖用户正文。
- 所有 AI 输出先进入预览区或建议区。
- 每次 AI 调用需要记录输入上下文、任务类型、模型和结果，方便调试与成本分析。
- 上下文组装应独立于 UI 组件。

### 3.5 存储

| 类型 | 推荐方案 | 说明 |
| --- | --- | --- |
| 结构化数据 | PostgreSQL | 用户、作品、章节、设定、人物、伏笔 |
| 向量数据 | pgvector | 章节摘要、素材片段、设定检索 |
| 文件存储 | S3 / Cloudflare R2 | 导入文档、导出文件、素材附件 |
| 本地缓存 | IndexedDB | Web 端草稿缓存和离线保护 |

### 3.6 认证与商业化

| 类型 | 推荐方案 | 说明 |
| --- | --- | --- |
| 认证 | Auth.js 或 Clerk | MVP 可优先 Clerk，后续可迁移自管 |
| 支付 | Stripe / 国内支付后续适配 | 国际版优先 Stripe，国内版需微信/支付宝 |
| 权限 | RBAC | 后续支持个人、工作室、编辑角色 |
| 订阅限制 | Feature Flag + Usage Limit | 控制 AI 次数、项目数、协作人数等 |

### 3.7 部署

| 类型 | 推荐方案 | 说明 |
| --- | --- | --- |
| 前端 | Vercel / Cloudflare Pages | 快速部署 Web App |
| 后端 | Railway / Render / Fly.io / 自有 VPS | 根据成本和稳定性选择 |
| 数据库 | Supabase / Neon / Railway PostgreSQL | 初期托管，减少运维 |
| 对象存储 | Cloudflare R2 / S3 | 存储导入导出文件 |

国内用户场景后续需要单独评估：

- 国内云服务器。
- 国内对象存储。
- 国内模型供应商。
- 备案与合规。

## 4. 第一版推荐组合

MVP 推荐组合：

- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui + lucide-react
- Editor: TipTap
- State: Zustand + TanStack Query
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Vector: pgvector
- Queue: Redis + BullMQ
- AI: Provider Adapter + Context Builder + Task Pipeline

这套组合兼顾研发速度和商业级扩展性。

## 5. 暂不采用的方案

### 5.1 暂不优先 Electron

桌面端对重度作者有价值，但第一版优先验证核心工作流和付费意愿。等 Web 版 MVP 成立后，再用 Electron 或 Tauri 包装。

### 5.2 暂不优先 Next.js

Next.js 适合全栈 Web 和营销页面，但 IDE 型应用的核心复杂度在编辑器、状态、上下文和长篇数据管理。第一阶段使用 Vite 更轻、更直接。

### 5.3 暂不引入独立向量数据库

Qdrant、Milvus 等适合大规模检索，但 MVP 阶段 pgvector 足够，能减少服务数量和部署复杂度。

### 5.4 暂不做实时协同

实时协同涉及 CRDT、权限、冲突合并和复杂编辑器同步。第一版保留数据模型扩展空间，但不实现。

## 6. 架构模块草图

```text
Web Client
  - IDE Shell
  - Chapter Editor
  - Project Sidebar
  - Context Panel
  - AI Assistant Panel

API Server
  - Auth Module
  - Project Module
  - Chapter Module
  - Character Module
  - Setting Module
  - AI Task Module
  - Export Module

AI Layer
  - Provider Adapter
  - Context Builder
  - Prompt Templates
  - Task Pipeline
  - Cost / Usage Logger

Data Layer
  - PostgreSQL
  - pgvector
  - Redis Queue
  - Object Storage
```

## 7. 关键技术风险

| 风险 | 描述 | 应对 |
| --- | --- | --- |
| 编辑器复杂度 | 富文本、AI 插入、批注、导出容易变复杂 | 第一版控制编辑器功能，只做章节正文和局部 AI |
| AI 上下文失控 | 上下文过长、成本高、回答漂移 | 做 Context Builder，按任务取最小必要上下文 |
| 长篇性能 | 作品字数变大后查询和检索变慢 | 分章节存储、摘要索引、懒加载 |
| 成本不可控 | AI 调用频繁导致费用高 | 用 Usage Limit、异步任务、缓存和模型分级 |
| 数据安全 | 用户作品属于高敏感内容 | 默认私有、调用透明、日志脱敏 |

## 8. 后续决策点

下一步需要继续确认：

1. MVP 是先做纯前端原型，还是直接搭全栈骨架。
2. 首个 AI Provider 选择哪一个。
3. 是否第一版就接真实登录。
4. 数据库本地开发使用 Docker PostgreSQL 还是托管 PostgreSQL。
5. 是否保留未来桌面端目录结构。

建议下一份文件：

- `docs/product/02-mvp-scope.md`: MVP 范围和验收标准。
