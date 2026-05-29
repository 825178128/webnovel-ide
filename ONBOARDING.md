# Webnovel IDE — 项目启动指引

## 项目定位

面向中文网文作者的长篇连载创作 IDE，类似写代码的 VS Code / IntelliJ。
当前阶段：V2 编辑器核心升级（TipTap + Slash Command），P0 功能已开发中。

## 技术栈

- **框架**：React 19 + TypeScript + Vite 7
- **状态**：React Context + useReducer（自定义 DataContext）
- **持久化**：localStorage（防抖 500ms 写入）
- **编辑器**：TipTap v3 (ProseMirror) + StarterKit + Placeholder
- **样式**：纯 CSS（CSS 变量双主题），约 2100 行
- **包管理**：npm

## 目录结构

```
src/
├── App.tsx                          # 根组件，screen 路由（projects/workspace）
├── main.tsx                         # 入口，StrictMode + ErrorBoundary
├── types.ts                         # 全部 TS 类型（10 个实体 + WebnovelIDEState）
├── styles.css                       # 全部样式（CSS 变量双主题）
├── utils.ts                         # createId, countWords, nowIso 等工具
├── storage.ts                       # 兼容层，re-export from data/store
├── data/
│   ├── DataContext.tsx              # 核心状态管理：DataProvider + useDataStore
│   ├── store.ts                     # 创建/加载/保存/重置状态
│   ├── schema.ts                    # STORAGE_KEY, CURRENT_SCHEMA_VERSION
│   ├── migrations.ts                # normalizeState 兼容旧数据
│   ├── adapters/
│   │   └── localStorageAdapter.ts   # StorageAdapter 接口 + localStorage 实现
│   ├── fixtures/
│   │   └── demoProject.ts           # 演示数据（雾港巡夜人，5 章 + 3 角色 + 4 设定）
│   └── repositories/               # 7 个仓储操作文件
│       ├── projectRepository.ts     # createProject
│       ├── chapterRepository.ts     # createVolume/createChapter/delete/reorder/append
│       ├── characterRepository.ts   # createCharacter/delete
│       ├── settingRepository.ts     # createSetting/delete
│       ├── relationRepository.ts    # toggleChapterCharacter / toggleChapterSetting
│       ├── aiRepository.ts          # recordSucceededAIRequest
│       └── stateHelpers.ts          # touchState（更新 meta.updatedAt）
├── components/
│   ├── ErrorBoundary.tsx            # 运行时错误捕获
│   ├── Icon.tsx                     # SVG 图标组件
│   ├── forms.tsx                    # TextField / TextAreaField
│   ├── dialogs.tsx                  # 所有弹窗（创建/设置）
│   ├── editors.tsx                  # ChapterEditor/CharacterEditor/SettingEditor
│   ├── ContextPanel.tsx             # 右侧面板（属性/上下文/AI 标签）
│   └── editor/                      # V2 新增：编辑器核心
│       ├── TipTapEditor.tsx         # 主编辑器组件
│       ├── EditorHeader.tsx         # 标题/目标/字数/状态头部
│       ├── SlashCommandPopup.tsx    # `/` 命令浮层 UI
│       ├── ContextPopover.tsx       # 选中角色/设定时的信息浮层
│       ├── htmlUtils.ts             # textToTipTapHtml / stripHtml
│       └── commands.ts              # SlashCommandItem 类型 + 工厂函数
├── pages/
│   ├── ProjectsPage.tsx             # 作品列表页
│   └── WorkspacePage.tsx            # 三栏 IDE 工作台
├── services/
│   ├── aiMock.ts                    # AI 模拟输出（续写/润色/总结/改写）
│   ├── chapterTools.ts              # summarizeChapter
│   └── exportService.ts             # TXT/MD 导出（已适配 HTML）
└── constants/
    └── labels.ts                    # 中文标签映射
```

## 核心数据流

```
用户操作 → patchState(updater) → useReducer → state 更新
    → useEffect 触发 → 500ms 防抖 → saveState → localStorage
    → 同时所有 useDataStore() 的组件重渲染
```

## 数据模型 (WebnovelIDEState)

```typescript
interface WebnovelIDEState {
  meta: DataStoreMeta              // schemaVersion, timestamps
  users: User[]                    // 当前仅 user_local
  projects: Project[]              // 作品
  volumes: Volume[]                // 卷
  chapters: Chapter[]              // 章节（content 字段存 HTML）
  characters: Character[]          // 人物卡
  settings: Setting[]              // 设定/资料卡
  chapterCharacters: ChapterCharacter[]  // 章节↔人物关联
  chapterSettings: ChapterSetting[]      // 章节↔设定关联
  aiRequests: AIRequest[]          // AI 请求记录
  aiConfig: AIConfig               // AI 配置
  appSettings: AppSettings         // 主题等
}
```

> **注意**：`chapters[].content` 现在存储 HTML（TipTap 输出），
> 历史纯文本数据加载时通过 `textToTipTapHtml()` 自动转换。
> 字数统计和导出时通过 `stripHtml()` 去除标签。

## 当前状态（V2 编辑器升级进行中）

### 已完成（P0）
- [x] TipTap 替换裸 `<textarea>`（StarterKit + Placeholder）
- [x] 编辑器头部：标题、目标、字数、状态
- [x] 格式化工具栏（加粗、斜体、撤销、重做）
- [x] Slash Command `/` 菜单（角色名/设定名补全）
- [x] 上下文浮层（选中角色/设定名时弹出信息卡片）
- [x] 自动保存指示器（状态栏"保存中..."/"已保存"，含脉冲动画）
- [x] HTML 内容格式迁移（`textToTipTapHtml`/`stripHtml`）
- [x] Ctrl+S 快捷键（阻止浏览器默认行为）
- [x] ErrorBoundary 运行时错误边界

### 已知问题 / 已修复
- ~Slash 命令菜单定位可能不准~ 已修复：添加 scroll 事件监听，菜单跟随编辑器滚动更新位置
- ~ContextPopover 对多选文本的行为需要打磨~ 限制选中文本长度 ≤ 100 字符，减少误触
- ~编辑器撤销/重做按钮未加 UI~ 已添加工具栏按钮
- ~保存指示器首次不显示~ 已修复：状态变化立即显示"保存中..."
- ~内容同步导致光标跳转~ 已修复：内容同步以 `contentKey`（章节 ID）为依赖，避免打字反馈环触发 setContent
- ~死代码~ 已清理：移除废弃的 `onKeyDown` prop、`chapter-content`/`chapter-title-input` CSS

### P1 待做
- [ ] 日更字数追踪
- [ ] 内联角色/设定提及检测（编辑器内高亮 + hover 摘要）
- [ ] 搜索/筛选侧栏人物和设定
- [ ] 分栏预览模式

## 开发命令

```bash
npm run dev          # 启动 Vite 开发服务器
npm run build        # tsc + vite build
npm run test:data-store  # 数据层冒烟测试
```

## 常见 CSS 陷阱

1. **编辑器不滚动**：检查 height 链是否断了。关键链条：`.main-panel`（grid `1fr`）→ `.main-panel-chapter`（必须 `height:100%` 或 flex）→ `.editor-panel`（`min-height:100%`）→ `.tip-tap-editor`（flex column）→ `.editor-content-area`（flex:1, overflow:hidden）→ `.ProseMirror`（flex:1, overflow-y:auto）
2. **侧栏折叠后编辑器宽度不变**：沿 chain 加 `min-width:0`
3. **内容同步循环**：`contentKey`（章节 ID）驱动同步，只有切换章节时才调用 `setContent`，打字时不上行。

## 后续迭代方向

1. **编辑器深化**：分栏预览、撤销/重做 UI、大纲视图
2. **素材库**：可复用的角色/设定模板库
3. **AI 提示系统**：根据上下文实时推荐续写/润色入口
4. **网文 Lint**：节奏检测、重复词、一致性检查
5. **连续性检查**：角色出没记录、伏笔管理
