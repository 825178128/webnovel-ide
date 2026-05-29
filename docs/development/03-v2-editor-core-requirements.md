# V2 编辑器核心与写作提示系统 — 需求分析

> 目标：将章节编辑器从裸 `<textarea>` 升级为具备 IDE 式写作辅助能力的专业编辑器，
> 为后续素材库、AI 实时提示、连续性检查等功能提供可扩展的架构基础。

---

## 总体原则

1. **编辑器是平台，不是控件** — TipTap (ProseMirror) 作为底层框架，所有功能以 plugin/extension 方式接入
2. **"/" 是入口** — `/` 命令菜单是当前版本的"代码补全"等价物，写入流不打断
3. **右侧面板为主** — 深度操作（关联管理、AI 参数）保留在 ContextPanel，编辑器内仅做轻量内联 & 快捷插入
4. **可扩展优先** — 所有自建 extension 独立文件，后续素材库接入时只需新增 suggestion item

---

## P0 — 本轮必须完成

| ID | 功能 | 说明 |
|----|------|------|
| P0-1 | **TipTap 编辑器替换 textarea** | 引入 `@tiptap/react` + StarterKit + Placeholder extension，保留纯文本兼容（内容提取为纯文本写入 store） |
| P0-2 | **编辑器面板头部** | 章节标题（可编辑内联）、本章目标（可编辑内联）、字数统计、状态选择器。迁移 ContextPanel 中的这部分字段到编辑器内 |
| P0-3 | **Slash Command `/` 菜单** | 输入 `/` 弹出命令浮层，支持筛选。内置命令：角色名插入、设定名插入、AI 续写/润色/总结/改写。命令列表由 props 注入，可扩展 |
| P0-4 | **上下文浮层** | 编辑器中选中文本或悬停在实体名上时，显示关联信息 tooltip（角色简介、设定摘要）。数据源为当前章节关联的 chapterCharacters/chapterSettings |
| P0-5 | **自动保存指示器** | 状态栏显示保存状态（已保存/保存中），与 DataContext 的 500ms 防抖联动 |

## P1 — 下一轮

| ID | 功能 | 说明 |
|----|------|----|
| P1-1 | **日更字数追踪** | 记录每日写入字数，编辑器头部显示今日进度条 + 目标完成率 |
| P1-2 | **内联角色/设定提及检测** | 编辑器内高亮已关联的角色名和设定名，hover 显示摘要 |
| P1-3 | **搜索/筛选侧栏** | 侧栏人物、设定增加搜索输入框，章节列表支持筛选 |
| P1-4 | **编辑器撤销/重做** | TipTap 内置支持，加 UI 按钮 |
| P1-5 | **分栏预览** | 编辑/预览双栏模式，预览渲染为干净阅读版 |

## P2 — 后续迭代（素材库接入后自然涌现）

| ID | 功能 | 说明 |
|----|------|----|
| P2-1 | **AI 实时续写提示** | 光标位置自动触发续写建议，Esc 拒绝，Tab 接受 |
| P2-2 | **网文 Lint** | 节奏检查、重复词检测、视角一致性 |
| P2-3 | **富文本导出** | 导出保留加粗/斜体等格式 |
| P2-4 | **知识库内联引用** | 从素材库直接拖入编辑器 / `/` 菜单索引素材库 |

---

## 架构变化

```
React Component Tree (before)

ChapterEditor
  └─ <textarea>  ← 裸文本框

React Component Tree (after)

ChapterEditor
  ├─ EditorHeader     ← 标题、目标、字数、状态
  ├─ TipTapEditor     ← ProseMirror 实例
  │   ├─ StarterKit
  │   ├─ Placeholder
  │   ├─ SlashCommandExtension  ← 自建
  │   ├─ ContextHoverPlugin      ← 自建
  │   └─ ... (future extensions)
  └─ EditorToolbar    ← 格式化按钮、撤销/重做
```

**数据流**：TipTap 的 `onUpdate` → 提取纯文本 → `patchState` 更新 store（与现有数据模型兼容，不改动 WebnovelIDEState 的 content 字段）

**Extension 注册模式**：

```typescript
// src/components/editor/extensions/registry.ts
interface EditorExtension {
  name: string
  tiptapExtension: Extension
  slashCommands?: SlashCommandItem[]
}
```

后续只需新增 extension 并注册到 registry，无需改动编辑器核心。

---

## 验收标准

- [ ] 新建章节后在编辑器内输入，内容保存到 localStorage 且刷新后恢复
- [ ] `/` 弹出命令列表，筛选和选择正常，选择后插入对应内容
- [ ] 编辑器头部修改标题/目标后，上下文面板同步更新
- [ ] 字数统计与 `countWords` 计算结果一致
- [ ] `npm run build` 通过，无 TypeScript 错误
