# Webnovel IDE

面向中文网文作者、工作室与编辑协作场景的商业级长篇连载创作 IDE。

## Project Goal

构建一个能支撑网文从立项、设定、大纲、章节写作、AI 辅助、连续性检查、发布准备到数据反馈的专业创作平台。

产品的长期目标不是做一个简单的 AI 续写工具，而是做一个围绕“长期连载生产”的创作操作系统。

## Product Principles

- 作者掌控方向，AI 作为副驾驶。
- 长篇连续性优先于短文本生成。
- 写作流程优先于功能堆叠。
- 商业化结果优先于单次灵感体验。
- 每一步决策沉淀为可追溯文件。

## Current Phase

V1 UI 原型完善。

当前 `v1-development` 分支主目标是完成商业级网文 IDE 的 UI 原型、主题体系、布局与交互壳验收。具体业务功能模块不在本分支深入实现。

当前已产出：

- [需求分析与优先级](D:/codex/webnovel-ide/docs/product/01-requirements-analysis.md)
- [MVP 范围与验收标准](D:/codex/webnovel-ide/docs/product/02-mvp-scope.md)
- [用户流程与页面流转](D:/codex/webnovel-ide/docs/product/03-user-workflows.md)
- [UI 信息架构](D:/codex/webnovel-ide/docs/product/04-ui-information-architecture.md)
- [V1 UI 验收标准](D:/codex/webnovel-ide/docs/product/05-v1-ui-acceptance-criteria.md)
- [技术栈选型](D:/codex/webnovel-ide/docs/architecture/01-tech-stack.md)
- [MVP 数据模型](D:/codex/webnovel-ide/docs/architecture/02-data-model.md)
- [V1 UI 阶段总结](D:/codex/webnovel-ide/docs/release/2026-05-28-v1-ui-stage-summary.md)
- [V1 UI 验收报告](D:/codex/webnovel-ide/docs/release/2026-05-28-v1-ui-acceptance-report.md)
- [V1 UI 文件归档索引](D:/codex/webnovel-ide/docs/release/2026-05-28-v1-ui-file-archive.md)
- [V1 UI 后续开发任务](D:/codex/webnovel-ide/docs/release/2026-05-28-post-ui-roadmap.md)

## V1 UI Acceptance

`v1-development` 分支已完成 V1 UI 原型阶段验收。

验收结论：

- P0 已清零。
- P1 已清零。
- P2 进入后续 UI polish 或功能分支。
- 当前分支可作为 V1 UI 基线合并到主分支。

## Local Development

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

如果默认端口被旧项目占用，可以指定端口：

```bash
npm run dev -- --host 127.0.0.1 --port 5180 --strictPort
```

构建验证：

```bash
npm run build
```

## Planned Traceable Documents

- `docs/product/01-requirements-analysis.md`: 需求分析与优先级
- `docs/architecture/01-tech-stack.md`: 技术栈选型
- `docs/product/02-mvp-scope.md`: MVP 范围
- `docs/product/03-user-workflows.md`: 核心用户流程
- `docs/product/04-ui-information-architecture.md`: UI 信息架构
- `docs/architecture/02-data-model.md`: 数据模型
- `docs/architecture/03-ai-context-system.md`: AI 上下文与长篇记忆系统
- `docs/migration/01-existing-assets-audit.md`: 旧项目可迁移资产盘点
