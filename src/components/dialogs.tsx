import { useState } from 'react'
import { projectStatusLabels, settingCategoryLabels, settingImportanceLabels } from '../constants/labels'
import type {
  Chapter,
  Character,
  Project,
  ProjectStatus,
  AppTheme,
  Setting,
  SettingCategory,
  SettingImportance,
  Volume,
  WebnovelIDEState,
} from '../types'
import { nowIso, parseOptionalNumber } from '../utils'
import { TextAreaField, TextField } from './forms'

export function CreateProjectDialog(props: {
  onClose: () => void
  onSubmit: (form: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>) => void
}) {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [targetPlatform, setTargetPlatform] = useState('')
  const [synopsis, setSynopsis] = useState('')

  return (
    <DialogShell title="新建作品" onClose={props.onClose}>
      <form
        className="dialog-body"
        onSubmit={(event) => {
          event.preventDefault()
          if (!title.trim()) return
          props.onSubmit({
            title: title.trim(),
            genre: genre.trim(),
            synopsis: synopsis.trim(),
            targetPlatform: targetPlatform.trim(),
          })
        }}
      >
        <TextField label="作品名" value={title} onChange={setTitle} autoFocus />
        <TextField label="题材/类型" value={genre} onChange={setGenre} />
        <TextField label="目标平台" value={targetPlatform} onChange={setTargetPlatform} />
        <TextAreaField label="简介" value={synopsis} onChange={setSynopsis} />
        <footer>
          <button type="button" onClick={props.onClose}>
            取消
          </button>
          <button type="submit" className="primary-button" disabled={!title.trim()}>
            创建并进入
          </button>
        </footer>
      </form>
    </DialogShell>
  )
}

export function ProjectSettingsDialog(props: {
  project: Project
  onClose: () => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
}) {
  const [title, setTitle] = useState(props.project.title)
  const [genre, setGenre] = useState(props.project.genre ?? '')
  const [targetPlatform, setTargetPlatform] = useState(props.project.targetPlatform ?? '')
  const [targetWordCount, setTargetWordCount] = useState(String(props.project.targetWordCount ?? ''))
  const [dailyWordTarget, setDailyWordTarget] = useState(String(props.project.dailyWordTarget ?? ''))
  const [status, setStatus] = useState<ProjectStatus>(props.project.status)
  const [synopsis, setSynopsis] = useState(props.project.synopsis ?? '')

  function saveProject() {
    if (!title.trim()) return

    props.onPatchState((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === props.project.id
          ? {
              ...project,
              title: title.trim(),
              genre: genre.trim(),
              targetPlatform: targetPlatform.trim(),
              targetWordCount: parseOptionalNumber(targetWordCount),
              dailyWordTarget: parseOptionalNumber(dailyWordTarget),
              status,
              synopsis: synopsis.trim(),
              updatedAt: nowIso(),
            }
          : project,
      ),
    }))
    props.onClose()
  }

  return (
    <DialogShell title="作品设置" onClose={props.onClose}>
      <form
        className="dialog-body"
        onSubmit={(event) => {
          event.preventDefault()
          saveProject()
        }}
      >
        <TextField label="作品名" value={title} onChange={setTitle} />
        <TextField label="题材/类型" value={genre} onChange={setGenre} />
        <TextField label="目标平台" value={targetPlatform} onChange={setTargetPlatform} />
        <div className="form-grid">
          <TextField label="目标字数" value={targetWordCount} onChange={setTargetWordCount} />
          <TextField label="日更目标" value={dailyWordTarget} onChange={setDailyWordTarget} />
        </div>
        <label className="field-block">
          作品状态
          <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
            {Object.entries(projectStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <TextAreaField label="简介" value={synopsis} onChange={setSynopsis} />
        <footer>
          <button type="button" onClick={props.onClose}>
            取消
          </button>
          <button type="submit" className="primary-button" disabled={!title.trim()}>
            保存设置
          </button>
        </footer>
      </form>
    </DialogShell>
  )
}

export function AISettingsDialog(props: {
  config: WebnovelIDEState['aiConfig']
  onClose: () => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
}) {
  const [provider, setProvider] = useState(props.config?.provider ?? 'mock')
  const [apiKey, setApiKey] = useState(props.config?.apiKey ?? '')
  const [model, setModel] = useState(props.config?.model ?? 'local-prototype')
  const [baseUrl, setBaseUrl] = useState(props.config?.baseUrl ?? '')
  const [testResult, setTestResult] = useState('')

  function saveConfig() {
    props.onPatchState((current) => ({
      ...current,
      aiConfig: {
        provider: provider.trim() || 'mock',
        apiKey: apiKey.trim(),
        model: model.trim() || 'local-prototype',
        baseUrl: baseUrl.trim(),
        updatedAt: nowIso(),
      },
    }))
    props.onClose()
  }

  return (
    <DialogShell title="AI 配置" onClose={props.onClose}>
      <form
        className="dialog-body"
        onSubmit={(event) => {
          event.preventDefault()
          saveConfig()
        }}
      >
        <label className="field-block">
          Provider
          <select value={provider} onChange={(event) => setProvider(event.target.value)}>
            <option value="mock">模拟输出</option>
            <option value="openai">OpenAI 兼容</option>
            <option value="custom">自定义</option>
          </select>
        </label>
        <TextField label="API Key" value={apiKey} onChange={setApiKey} />
        <TextField label="Model" value={model} onChange={setModel} />
        <TextField label="Base URL" value={baseUrl} onChange={setBaseUrl} />
        <p className="settings-note">
          当前为本地原型配置。后续全栈版本会改为服务端代理调用，避免密钥暴露在前端。
        </p>
        {testResult && <p className="settings-result">{testResult}</p>}
        <footer>
          <button
            type="button"
            onClick={() => {
              setTestResult(provider === 'mock' ? '模拟输出可用。' : '配置已保存前仅做本地字段校验。')
            }}
          >
            测试连接
          </button>
          <button type="button" onClick={props.onClose}>
            取消
          </button>
          <button type="submit" className="primary-button">
            保存配置
          </button>
        </footer>
      </form>
    </DialogShell>
  )
}

export function AppSettingsDialog(props: {
  state: WebnovelIDEState
  onClose: () => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
}) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'ai'>('appearance')
  const [theme, setTheme] = useState<AppTheme>(props.state.appSettings?.theme ?? 'dark')
  const [provider, setProvider] = useState(props.state.aiConfig?.provider ?? 'mock')
  const [apiKey, setApiKey] = useState(props.state.aiConfig?.apiKey ?? '')
  const [model, setModel] = useState(props.state.aiConfig?.model ?? 'local-prototype')
  const [baseUrl, setBaseUrl] = useState(props.state.aiConfig?.baseUrl ?? '')
  const [testResult, setTestResult] = useState('')

  function saveSettings() {
    props.onPatchState((current) => ({
      ...current,
      appSettings: {
        theme,
        updatedAt: nowIso(),
      },
      aiConfig: {
        provider: provider.trim() || 'mock',
        apiKey: apiKey.trim(),
        model: model.trim() || 'local-prototype',
        baseUrl: baseUrl.trim(),
        updatedAt: nowIso(),
      },
    }))
    props.onClose()
  }

  return (
    <DialogShell title="应用设置" onClose={props.onClose}>
      <form
        className="dialog-body app-settings-dialog"
        onSubmit={(event) => {
          event.preventDefault()
          saveSettings()
        }}
      >
        <div className="settings-tabs" role="tablist" aria-label="应用设置分类">
          <button
            type="button"
            className={activeTab === 'appearance' ? 'active' : ''}
            onClick={() => setActiveTab('appearance')}
          >
            外观
          </button>
          <button
            type="button"
            className={activeTab === 'ai' ? 'active' : ''}
            onClick={() => setActiveTab('ai')}
          >
            AI
          </button>
        </div>

        {activeTab === 'appearance' && (
          <section className="settings-section">
            <div className="theme-options">
              <button
                type="button"
                className={`theme-option theme-option-dark ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <span>专业深色</span>
                <small>适合长时间写作和 IDE 工作台</small>
              </button>
              <button
                type="button"
                className={`theme-option theme-option-light ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <span>清爽浅色</span>
                <small>适合白天阅读、整理设定和审稿</small>
              </button>
            </div>
            <p className="settings-note">主题会作用到项目列表、工作台、侧栏、编辑器和弹窗。</p>
          </section>
        )}

        {activeTab === 'ai' && (
          <section className="settings-section">
            <label className="field-block">
              Provider
              <select value={provider} onChange={(event) => setProvider(event.target.value)}>
                <option value="mock">模拟输出</option>
                <option value="openai">OpenAI 兼容</option>
                <option value="custom">自定义</option>
              </select>
            </label>
            <TextField label="API Key" value={apiKey} onChange={setApiKey} />
            <TextField label="Model" value={model} onChange={setModel} />
            <TextField label="Base URL" value={baseUrl} onChange={setBaseUrl} />
            <p className="settings-note">
              当前为本地原型配置。后续全栈版本会改为服务端代理调用，避免密钥暴露在前端。
            </p>
            {testResult && <p className="settings-result">{testResult}</p>}
            <button
              type="button"
              onClick={() => {
                setTestResult(provider === 'mock' ? '模拟输出可用。' : '配置已保存前仅做本地字段校验。')
              }}
            >
              测试连接
            </button>
          </section>
        )}

        <footer>
          <button type="button" onClick={props.onClose}>
            取消
          </button>
          <button type="submit" className="primary-button">
            保存设置
          </button>
        </footer>
      </form>
    </DialogShell>
  )
}

export function CreateVolumeDialog(props: {
  onClose: () => void
  onSubmit: (form: Pick<Volume, 'title' | 'summary'>) => void
}) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')

  return (
    <DialogShell title="新建卷" onClose={props.onClose}>
      <form
        className="dialog-body"
        onSubmit={(event) => {
          event.preventDefault()
          if (!title.trim()) return
          props.onSubmit({ title: title.trim(), summary: summary.trim() })
        }}
      >
        <TextField label="卷名" value={title} onChange={setTitle} />
        <TextAreaField label="卷简介" value={summary} onChange={setSummary} />
        <footer>
          <button type="button" onClick={props.onClose}>
            取消
          </button>
          <button type="submit" className="primary-button" disabled={!title.trim()}>
            创建卷
          </button>
        </footer>
      </form>
    </DialogShell>
  )
}

export function CreateChapterDialog(props: {
  defaultTitle: string
  onClose: () => void
  onSubmit: (form: Pick<Chapter, 'title' | 'goal'>) => void
}) {
  const [title, setTitle] = useState(props.defaultTitle)
  const [goal, setGoal] = useState('')

  return (
    <DialogShell title="新建章节" onClose={props.onClose}>
      <form
        className="dialog-body"
        onSubmit={(event) => {
          event.preventDefault()
          if (!title.trim()) return
          props.onSubmit({ title: title.trim(), goal: goal.trim() })
        }}
      >
        <TextField label="章节标题" value={title} onChange={setTitle} />
        <TextAreaField label="本章目标" value={goal} onChange={setGoal} />
        <footer>
          <button type="button" onClick={props.onClose}>
            取消
          </button>
          <button type="submit" className="primary-button" disabled={!title.trim()}>
            创建章节
          </button>
        </footer>
      </form>
    </DialogShell>
  )
}

export function CreateCharacterDialog(props: {
  onClose: () => void
  onSubmit: (form: Pick<Character, 'name' | 'role' | 'faction'>) => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [faction, setFaction] = useState('')

  return (
    <DialogShell title="新建人物" onClose={props.onClose}>
      <form
        className="dialog-body"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          props.onSubmit({ name: name.trim(), role: role.trim(), faction: faction.trim() })
        }}
      >
        <TextField label="姓名" value={name} onChange={setName} />
        <TextField label="身份" value={role} onChange={setRole} />
        <TextField label="阵营/势力" value={faction} onChange={setFaction} />
        <footer>
          <button type="button" onClick={props.onClose}>
            取消
          </button>
          <button type="submit" className="primary-button" disabled={!name.trim()}>
            创建人物
          </button>
        </footer>
      </form>
    </DialogShell>
  )
}

export function CreateSettingDialog(props: {
  onClose: () => void
  onSubmit: (form: Pick<Setting, 'title' | 'category' | 'content' | 'importance'>) => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<SettingCategory>('world')
  const [importance, setImportance] = useState<SettingImportance>('medium')
  const [content, setContent] = useState('')

  return (
    <DialogShell title="新建设定" onClose={props.onClose}>
      <form
        className="dialog-body"
        onSubmit={(event) => {
          event.preventDefault()
          if (!title.trim()) return
          props.onSubmit({
            title: title.trim(),
            category,
            importance,
            content: content.trim(),
          })
        }}
      >
        <TextField label="标题" value={title} onChange={setTitle} />
        <div className="form-grid">
          <label className="field-block">
            分类
            <select value={category} onChange={(event) => setCategory(event.target.value as SettingCategory)}>
              {Object.entries(settingCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-block">
            重要程度
            <select
              value={importance}
              onChange={(event) => setImportance(event.target.value as SettingImportance)}
            >
              {Object.entries(settingImportanceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TextAreaField label="内容" value={content} onChange={setContent} />
        <footer>
          <button type="button" onClick={props.onClose}>
            取消
          </button>
          <button type="submit" className="primary-button" disabled={!title.trim()}>
            创建设定
          </button>
        </footer>
      </form>
    </DialogShell>
  )
}

function DialogShell(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="dialog-backdrop">
      <section className="dialog">
        <header>
          <h2>{props.title}</h2>
          <button type="button" className="ghost-button" onClick={props.onClose}>
            关闭
          </button>
        </header>
        {props.children}
      </section>
    </div>
  )
}
