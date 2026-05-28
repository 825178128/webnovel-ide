# V1 UI 文件归档索引

日期: 2026-05-28
分支: v1-development

## 1. 归档原则

本索引用于说明当前仓库中每类文件的用途和保留理由。

源码、配置、文档全部保留在 Git 中。

依赖目录、构建产物、临时日志不纳入 Git。

## 2. 根目录文件

| 文件 | 用途 | 保留理由 |
| --- | --- | --- |
| `.gitignore` | Git 忽略规则 | 排除依赖、构建产物、环境变量和开发日志 |
| `README.md` | 项目入口说明 | 给后续开发者快速了解项目目标、阶段和命令 |
| `index.html` | Vite 应用入口 | 前端应用运行必需 |
| `package.json` | 依赖和脚本声明 | 本地开发和构建必需 |
| `package-lock.json` | 依赖锁定 | 保证安装一致性 |
| `tsconfig.json` | TypeScript 总配置 | 构建必需 |
| `tsconfig.app.json` | 应用 TypeScript 配置 | 构建必需 |
| `tsconfig.node.json` | Node/Vite TypeScript 配置 | 构建必需 |
| `vite.config.ts` | Vite 配置 | 开发服务和构建必需 |

## 3. 产品文档

| 文件 | 用途 |
| --- | --- |
| `docs/product/01-requirements-analysis.md` | 需求分析与优先级 |
| `docs/product/02-mvp-scope.md` | MVP 范围与验收标准 |
| `docs/product/03-user-workflows.md` | 用户流程 |
| `docs/product/04-ui-information-architecture.md` | UI 信息架构 |
| `docs/product/05-v1-ui-acceptance-criteria.md` | V1 UI 验收标准 |

## 4. 架构文档

| 文件 | 用途 |
| --- | --- |
| `docs/architecture/01-tech-stack.md` | 技术栈选型 |
| `docs/architecture/02-data-model.md` | MVP 数据模型 |
| `docs/architecture/03-v1-data-store-design.md` | V1 数据层边界、仓储接口、迁移策略和保留扩展设计 |

## 5. 发布与验收文档

| 文件 | 用途 |
| --- | --- |
| `docs/release/2026-05-28-v1-ui-stage-summary.md` | V1 UI 阶段总结 |
| `docs/release/2026-05-28-v1-ui-acceptance-report.md` | V1 UI 验收报告 |
| `docs/release/2026-05-28-v1-ui-file-archive.md` | 文件归档索引 |
| `docs/release/2026-05-28-post-ui-roadmap.md` | UI 验收后的后续开发任务 |

## 5.1 开发指导文档

| 文件 | 用途 |
| --- | --- |
| `docs/development/01-v1-module-branching-guide.md` | V1 UI 后功能模块拆分、分支顺序、范围边界和验收指导 |
| `docs/development/02-v1-data-store-implementation-plan.md` | V1 数据层 P0/P1/P2 实现顺序和 P0 完成记录 |

## 6. 源码目录

| 文件 | 用途 |
| --- | --- |
| `src/main.tsx` | React 应用挂载入口 |
| `src/App.tsx` | 应用级状态、页面切换和全局弹窗 |
| `src/styles.css` | 全局主题、布局和组件样式 |
| `src/types.ts` | 项目数据类型 |
| `src/storage.ts` | 本地状态加载、保存、初始化 |
| `src/utils.ts` | 通用工具函数 |
| `src/constants/labels.ts` | 状态、分类、任务等中文标签 |
| `src/data/schema.ts` | 数据层 storage key 和 schema 版本 |
| `src/data/migrations.ts` | 本地数据兼容加载和迁移补齐 |
| `src/data/store.ts` | 数据层 load / save / reset 和默认项目初始化入口 |
| `src/data/adapters/localStorageAdapter.ts` | localStorage 存储适配器 |
| `src/data/fixtures/demoProject.ts` | 数据层演示作品样本，用于验证真实工作台数据 |
| `src/data/repositories/*` | 项目、章节、人物、资料、关联和 AI 请求的数据操作仓储 |

## 7. 页面与组件

| 文件 | 用途 |
| --- | --- |
| `src/pages/ProjectsPage.tsx` | 作品库页面 |
| `src/pages/WorkspacePage.tsx` | IDE 工作台页面 |
| `src/components/ContextPanel.tsx` | 右侧属性、上下文、AI 面板 |
| `src/components/dialogs.tsx` | 创建、设置类弹窗 |
| `src/components/editors.tsx` | 章节、人物、资料编辑器 |
| `src/components/forms.tsx` | 表单基础组件 |
| `src/components/Icon.tsx` | 内置矢量图标 |

## 8. 服务层

| 文件 | 用途 |
| --- | --- |
| `src/services/aiMock.ts` | AI 模拟输出 |
| `src/services/chapterTools.ts` | 章节相关工具 |
| `src/services/exportService.ts` | TXT / Markdown 导出 |
| `src/services/stateRelations.ts` | 章节与人物、资料关联关系 |

## 8.1 开发脚本

| 文件 | 用途 |
| --- | --- |
| `scripts/run-data-store-smoke-test.mjs` | 使用 esbuild 执行 TypeScript 数据层自检脚本 |
| `scripts/data-store-smoke-test.ts` | 验证演示数据、默认项目创建、关联、正文追加、AI 请求和删除级联 |

## 9. 不纳入归档的本地文件

| 路径 | 原因 |
| --- | --- |
| `node_modules` | 依赖安装结果，可由 `npm install` 重建 |
| `dist` | 构建产物，可由 `npm run build` 重建 |
| `.env`, `.env.local` | 本地密钥或环境变量，不应提交 |
| `vite-dev*.log` | 临时开发日志，不应提交 |

## 10. 清理结果

本次封版前已删除:

- `vite-dev.err.log`
- `vite-dev.out.log`

删除原因: 0 字节临时开发日志，无追溯价值。
