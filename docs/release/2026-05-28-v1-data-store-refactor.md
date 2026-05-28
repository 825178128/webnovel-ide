# V1 数据层重构 — 变更汇总

日期: 2026-05-28
分支: v1-data-store

## 概要

将 session 状态从数据状态中分离，引入 React Context 消除 prop-drilling，使用防抖写入代替每次渲染写盘。

## 变更清单

### 类型
- `src/types.ts`: `WebnovelIDEState` 移除 `activeProjectId` / `activeChapterId`
- `src/data/migrations.ts`: `LegacyState` 显式兼容旧数据遗留字段

### 数据层
- `src/data/store.ts`: `seedProjectDefaults` 改为返回 `{ state, volumeId, chapterId }`，不再设置 session ID
- `src/data/repositories/projectRepository.ts`: `createProject` 返回 `{ state, projectId, firstChapterId }`；移除 `openProject`（改为调用方直接设 session）
- `src/data/repositories/chapterRepository.ts`: `createChapter` / `deleteVolume` / `deleteChapter` 不再读写 `activeChapterId`
- `src/data/DataContext.tsx` (新增): `useReducer` + `DataProvider` + `useDataStore` hook，500ms 防抖写入 localStorage

### 组件层
- `src/App.tsx`: 用 `<DataProvider>` 包裹，session 状态独立为 `useState`
- `src/pages/ProjectsPage.tsx`: 改用 `useDataStore()` 获取数据
- `src/pages/WorkspacePage.tsx`: 改用 `useDataStore()`，props 只保留 session 相关
- `src/components/ContextPanel.tsx`: 改用 `useDataStore()`
- `src/components/editors.tsx`: 改用 `useDataStore()`
- `src/components/dialogs.tsx`: 改用 `useDataStore()`

### 清理
- `src/services/stateRelations.ts` (删除): 空转发文件，已无引用

### 测试
- `scripts/data-store-smoke-test.ts`: 适配 `createProject` 新签名
- 冒烟测试 9 项全部通过

## 架构变化

```
之前: localStorage → useState<WebnovelIDEState> (含 session ID)
                      ↓ prop-drilling state + onPatchState
                      
之后: localStorage → DataContext (useReducer + 防抖写入)
                      ↓ useDataStore() 任意组件直接取
                      + session 状态独立 useState
```
