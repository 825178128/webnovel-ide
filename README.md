# Webnovel IDE

面向中文网文作者的长篇连载创作 IDE。像写代码一样管理你的小说——结构化组织章节、人物、设定，提供沉浸式编辑体验。

## 功能

- **所见即所得编辑器** — 基于 TipTap (ProseMirror) 的富文本编辑，支持格式工具栏、斜杠命令补全
- **素材管理** — 人物卡、设定资料库，支持关联到章节
- **写作辅助** — 角色/设定名编辑器内自动高亮，悬停查看摘要
- **日更追踪** — 自动统计每日写作字数，支持设定日更目标
- **项目管理** — 多作品管理，卷/章分级结构，拖拽排序
- **双主题** — 专业深色 + 清爽浅色，自由切换
- **导出** — 支持 TXT / Markdown 整本导出
- **AI 辅助** — 续写/润色/总结/改写（支持接入 OpenAI 兼容 API）

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript + Vite 7 |
| 编辑器 | @tiptap/react v3 (ProseMirror) |
| 状态 | React Context + useReducer |
| 持久化 | localStorage（500ms 防抖自动保存） |
| 样式 | 纯 CSS（CSS 自定义属性双主题） |

## 快速开始

```bash
npm install
npm run dev        # 启动开发服务器 → http://localhost:5174
npm run build      # 生产构建
npm run test:data-store  # 数据层冒烟测试
```

首次启动后可通过「载入演示数据」按钮体验完整功能流程。

## 项目结构

```
src/
├── data/             # 数据层（store + repositories + migrations）
│   ├── DataContext.tsx    # 核心状态管理
│   ├── store.ts           # 创建/加载/保存/重置
│   ├── migrations.ts      # 数据迁移兼容
│   ├── repositories/      # 7 个仓储操作文件
│   └── fixtures/          # 演示数据
├── components/       # UI 组件
│   ├── editor/            # 编辑器核心（TipTap + 插件）
│   │   ├── TipTapEditor.tsx
│   │   ├── EditorToolbar.tsx
│   │   ├── SlashCommandPopup.tsx
│   │   ├── entityPlugin.ts   # 实体高亮 ProseMirror 插件
│   │   └── ...
│   ├── dialogs.tsx        # 所有弹窗
│   ├── ContextPanel.tsx   # 右侧面板
│   └── forms.tsx          # 表单组件
├── pages/             # 页面
│   ├── ProjectsPage.tsx   # 作品库
│   └── WorkspacePage.tsx  # 三栏 IDE 工作台
├── services/          # 服务层
└── types.ts           # 全部 TypeScript 类型
```

## 数据模型

核心实体：Project → Volume → Chapter + Character + Setting，通过关联表建立多对多关系。所有状态集中管理，自动持久化到 localStorage。

详细数据模型见 [ONBOARDING.md](ONBOARDING.md)。

## 截图

（待补充）

## 许可

MIT
