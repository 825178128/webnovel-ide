import { useEffect, useMemo, useState } from 'react'
import type {
  AITaskType,
  Chapter,
  ChapterStatus,
  Character,
  Project,
  ProjectStatus,
  Setting,
  SettingCategory,
  SettingImportance,
  Volume,
  WebnovelIDEState,
} from './types'
import { loadState, saveState, seedProjectDefaults } from './storage'
import { countWords, createId, downloadText, formatDateTime, nowIso } from './utils'

type MainView = 'chapter' | 'character' | 'setting'

const chapterStatusLabels: Record<ChapterStatus, string> = {
  draft: '草稿',
  writing: '写作中',
  revision: '待修改',
  completed: '已完成',
}

const settingCategoryLabels: Record<SettingCategory, string> = {
  world: '世界观',
  faction: '势力',
  power_system: '等级体系',
  item: '道具',
  location: '地点',
  rule: '规则',
  other: '其他',
}

const settingImportanceLabels: Record<SettingImportance, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const aiTaskLabels: Record<AITaskType, string> = {
  continue: '续写',
  polish: '润色',
  summarize: '总结',
  rewrite: '改写',
}

const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: '筹备中',
  writing: '连载中',
  paused: '暂停',
  completed: '已完结',
  archived: '归档',
}

export function App() {
  const [state, setState] = useState<WebnovelIDEState>(() => loadState())
  const [screen, setScreen] = useState<'projects' | 'workspace'>(
    state.activeProjectId ? 'workspace' : 'projects',
  )
  const [mainView, setMainView] = useState<MainView>('chapter')
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>()
  const [selectedSettingId, setSelectedSettingId] = useState<string>()
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [aiSettingsOpen, setAISettingsOpen] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  const activeProject = state.projects.find((project) => project.id === state.activeProjectId)
  const activeChapter = state.chapters.find((chapter) => chapter.id === state.activeChapterId)

  function patchState(updater: (current: WebnovelIDEState) => WebnovelIDEState) {
    setState((current) => updater(current))
  }

  function openProject(projectId: string) {
    const firstChapter = state.chapters
      .filter((chapter) => chapter.projectId === projectId)
      .sort((a, b) => a.order - b.order)[0]

    patchState((current) => ({
      ...current,
      activeProjectId: projectId,
      activeChapterId: firstChapter?.id,
    }))
    setMainView('chapter')
    setScreen('workspace')
  }

  function createProject(form: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>) {
    const timestamp = nowIso()
    const projectId = createId('project')
    const nextState = seedProjectDefaults(
      {
        ...state,
        projects: [
          ...state.projects,
          {
            id: projectId,
            userId: 'user_local',
            title: form.title,
            genre: form.genre,
            synopsis: form.synopsis,
            targetPlatform: form.targetPlatform,
            status: 'writing',
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      },
      projectId,
    )

    setState(nextState)
    setCreateProjectOpen(false)
    setScreen('workspace')
    setMainView('chapter')
  }

  if (screen === 'projects' || !activeProject) {
    return (
      <ProjectsPage
        state={state}
        onCreateProject={() => setCreateProjectOpen(true)}
        onOpenAISettings={() => setAISettingsOpen(true)}
        onOpenProject={openProject}
        onPatchState={patchState}
        createProjectOpen={createProjectOpen}
        aiSettingsOpen={aiSettingsOpen}
        onCloseCreateProject={() => setCreateProjectOpen(false)}
        onCloseAISettings={() => setAISettingsOpen(false)}
        onSubmitProject={createProject}
      />
    )
  }

  return (
    <>
      <WorkspacePage
        state={state}
        project={activeProject}
        chapter={activeChapter}
        mainView={mainView}
        selectedCharacterId={selectedCharacterId}
        selectedSettingId={selectedSettingId}
        onBack={() => setScreen('projects')}
        onOpenAISettings={() => setAISettingsOpen(true)}
        onPatchState={patchState}
        onSelectChapter={(chapterId) => {
          patchState((current) => ({ ...current, activeChapterId: chapterId }))
          setMainView('chapter')
        }}
        onSelectCharacter={(characterId) => {
          setSelectedCharacterId(characterId)
          setMainView('character')
        }}
        onSelectSetting={(settingId) => {
          setSelectedSettingId(settingId)
          setMainView('setting')
        }}
        onSetMainView={setMainView}
      />
      {aiSettingsOpen && (
        <AISettingsDialog
          config={state.aiConfig}
          onClose={() => setAISettingsOpen(false)}
          onPatchState={patchState}
        />
      )}
    </>
  )
}

interface ProjectsPageProps {
  state: WebnovelIDEState
  createProjectOpen: boolean
  aiSettingsOpen: boolean
  onCreateProject: () => void
  onOpenAISettings: () => void
  onCloseCreateProject: () => void
  onCloseAISettings: () => void
  onOpenProject: (projectId: string) => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
  onSubmitProject: (form: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>) => void
}

function ProjectsPage(props: ProjectsPageProps) {
  const totalWordCount = (projectId: string) =>
    props.state.chapters
      .filter((chapter) => chapter.projectId === projectId)
      .reduce((total, chapter) => total + chapter.wordCount, 0)

  const chapterCount = (projectId: string) =>
    props.state.chapters.filter((chapter) => chapter.projectId === projectId).length

  return (
    <div className="app-surface">
      <header className="projects-header">
        <div>
          <p className="eyebrow">Webnovel IDE</p>
          <h1>作品</h1>
        </div>
        <div className="header-actions">
          <button onClick={props.onOpenAISettings}>AI 配置</button>
          <button className="primary-button" onClick={props.onCreateProject}>
            新建作品
          </button>
        </div>
      </header>

      {props.state.projects.length === 0 ? (
        <section className="empty-state">
          <h2>创建第一本作品</h2>
          <p>先建立作品工程，再逐步添加章节、人物、设定和 AI 辅助流程。</p>
          <button className="primary-button" onClick={props.onCreateProject}>
            新建作品
          </button>
        </section>
      ) : (
        <section className="project-grid">
          {props.state.projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div>
                <h2>{project.title}</h2>
                <p>{project.synopsis || '暂无简介'}</p>
              </div>
              <dl>
                <div>
                  <dt>题材</dt>
                  <dd>{project.genre || '未填写'}</dd>
                </div>
                <div>
                  <dt>平台</dt>
                  <dd>{project.targetPlatform || '未填写'}</dd>
                </div>
                <div>
                  <dt>章节</dt>
                  <dd>{chapterCount(project.id)}</dd>
                </div>
                <div>
                  <dt>字数</dt>
                  <dd>{totalWordCount(project.id)}</dd>
                </div>
              </dl>
              <div className="card-footer">
                <span>更新于 {formatDateTime(project.updatedAt)}</span>
                <button onClick={() => props.onOpenProject(project.id)}>进入工作台</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {props.createProjectOpen && (
        <CreateProjectDialog
          onClose={props.onCloseCreateProject}
          onSubmit={props.onSubmitProject}
        />
      )}
      {props.aiSettingsOpen && (
        <AISettingsDialog
          config={props.state.aiConfig}
          onClose={props.onCloseAISettings}
          onPatchState={props.onPatchState}
        />
      )}
    </div>
  )
}

function CreateProjectDialog(props: {
  onClose: () => void
  onSubmit: (form: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>) => void
}) {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [targetPlatform, setTargetPlatform] = useState('')
  const [synopsis, setSynopsis] = useState('')

  return (
    <div className="dialog-backdrop">
      <form
        className="dialog"
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
        <header>
          <h2>新建作品</h2>
          <button type="button" className="ghost-button" onClick={props.onClose}>
            关闭
          </button>
        </header>
        <label>
          作品名
          <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </label>
        <label>
          题材/类型
          <input value={genre} onChange={(event) => setGenre(event.target.value)} />
        </label>
        <label>
          目标平台
          <input value={targetPlatform} onChange={(event) => setTargetPlatform(event.target.value)} />
        </label>
        <label>
          简介
          <textarea value={synopsis} onChange={(event) => setSynopsis(event.target.value)} />
        </label>
        <footer>
          <button type="button" onClick={props.onClose}>
            取消
          </button>
          <button type="submit" className="primary-button" disabled={!title.trim()}>
            创建并进入
          </button>
        </footer>
      </form>
    </div>
  )
}

function ProjectSettingsDialog(props: {
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
    <div className="dialog-backdrop">
      <form
        className="dialog"
        onSubmit={(event) => {
          event.preventDefault()
          saveProject()
        }}
      >
        <header>
          <h2>作品设置</h2>
          <button type="button" className="ghost-button" onClick={props.onClose}>
            关闭
          </button>
        </header>
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
    </div>
  )
}

function AISettingsDialog(props: {
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
    <div className="dialog-backdrop">
      <form
        className="dialog"
        onSubmit={(event) => {
          event.preventDefault()
          saveConfig()
        }}
      >
        <header>
          <h2>AI 配置</h2>
          <button type="button" className="ghost-button" onClick={props.onClose}>
            关闭
          </button>
        </header>
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
    </div>
  )
}

interface WorkspacePageProps {
  state: WebnovelIDEState
  project: Project
  chapter?: Chapter
  mainView: MainView
  selectedCharacterId?: string
  selectedSettingId?: string
  onBack: () => void
  onOpenAISettings: () => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
  onSelectChapter: (chapterId: string) => void
  onSelectCharacter: (characterId: string) => void
  onSelectSetting: (settingId: string) => void
  onSetMainView: (view: MainView) => void
}

function WorkspacePage(props: WorkspacePageProps) {
  const projectVolumes = props.state.volumes
    .filter((volume) => volume.projectId === props.project.id)
    .sort((a, b) => a.order - b.order)
  const projectChapters = props.state.chapters
    .filter((chapter) => chapter.projectId === props.project.id)
    .sort((a, b) => a.order - b.order)
  const projectCharacters = props.state.characters.filter(
    (character) => character.projectId === props.project.id,
  )
  const projectSettings = props.state.settings.filter((setting) => setting.projectId === props.project.id)
  const selectedCharacter = projectCharacters.find(
    (character) => character.id === props.selectedCharacterId,
  )
  const selectedSetting = projectSettings.find((setting) => setting.id === props.selectedSettingId)
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false)

  function createVolume() {
    const title = window.prompt('卷名', `第 ${projectVolumes.length + 1} 卷`)
    if (!title) return
    const timestamp = nowIso()

    props.onPatchState((current) => ({
      ...current,
      volumes: [
        ...current.volumes,
        {
          id: createId('volume'),
          projectId: props.project.id,
          title,
          summary: '',
          order: projectVolumes.length + 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }))
  }

  function createChapter(volume: Volume) {
    const timestamp = nowIso()
    const chapterId = createId('chapter')
    const chaptersInVolume = projectChapters.filter((chapter) => chapter.volumeId === volume.id)

    props.onPatchState((current) => ({
      ...current,
      chapters: [
        ...current.chapters,
        {
          id: chapterId,
          projectId: props.project.id,
          volumeId: volume.id,
          title: `第 ${projectChapters.length + 1} 章`,
          goal: '',
          summary: '',
          content: '',
          status: 'draft',
          wordCount: 0,
          order: chaptersInVolume.length + 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      activeChapterId: chapterId,
    }))
    props.onSetMainView('chapter')
  }

  function createCharacter() {
    const timestamp = nowIso()
    const id = createId('character')

    props.onPatchState((current) => ({
      ...current,
      characters: [
        ...current.characters,
        {
          id,
          projectId: props.project.id,
          name: '新人物',
          role: '',
          faction: '',
          personality: '',
          desire: '',
          abilities: '',
          speechStyle: '',
          currentState: '',
          notes: '',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }))
    props.onSelectCharacter(id)
  }

  function createSetting() {
    const timestamp = nowIso()
    const id = createId('setting')

    props.onPatchState((current) => ({
      ...current,
      settings: [
        ...current.settings,
        {
          id,
          projectId: props.project.id,
          title: '新设定',
          category: 'world',
          content: '',
          importance: 'medium',
          notes: '',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }))
    props.onSelectSetting(id)
  }

  function deleteChapter(chapterId: string) {
    const chapter = projectChapters.find((item) => item.id === chapterId)
    if (!chapter || !window.confirm(`确定删除章节「${chapter.title}」吗？`)) return

    const remainingChapters = projectChapters.filter((item) => item.id !== chapterId)
    const nextActiveChapter = remainingChapters[0]

    props.onPatchState((current) => ({
      ...current,
      chapters: current.chapters.filter((item) => item.id !== chapterId),
      chapterCharacters: current.chapterCharacters.filter((item) => item.chapterId !== chapterId),
      chapterSettings: current.chapterSettings.filter((item) => item.chapterId !== chapterId),
      aiRequests: current.aiRequests.filter((item) => item.chapterId !== chapterId),
      activeChapterId: nextActiveChapter?.id,
    }))
    props.onSetMainView('chapter')
  }

  function deleteCharacter(characterId: string) {
    const character = projectCharacters.find((item) => item.id === characterId)
    if (!character || !window.confirm(`确定删除人物「${character.name}」吗？`)) return

    props.onPatchState((current) => ({
      ...current,
      characters: current.characters.filter((item) => item.id !== characterId),
      chapterCharacters: current.chapterCharacters.filter((item) => item.characterId !== characterId),
    }))
    props.onSetMainView('chapter')
  }

  function deleteSetting(settingId: string) {
    const setting = projectSettings.find((item) => item.id === settingId)
    if (!setting || !window.confirm(`确定删除设定「${setting.title}」吗？`)) return

    props.onPatchState((current) => ({
      ...current,
      settings: current.settings.filter((item) => item.id !== settingId),
      chapterSettings: current.chapterSettings.filter((item) => item.settingId !== settingId),
    }))
    props.onSetMainView('chapter')
  }

  function exportActiveChapter(format: 'txt' | 'md') {
    if (!props.chapter) return
    const content = buildChapterExport(props.chapter, format)
    downloadText(`${props.project.title}-${props.chapter.title}.${format}`, content)
  }

  function exportBook(format: 'txt' | 'md') {
    const content = buildBookExport(props.project, projectVolumes, projectChapters, format)
    downloadText(`${props.project.title}.${format}`, content)
  }

  return (
    <div className="workspace">
      <header className="workspace-topbar">
        <button className="ghost-button" onClick={props.onBack}>
          返回
        </button>
        <div>
          <strong>{props.project.title}</strong>
          <span>{props.chapter ? props.chapter.title : '未选择章节'}</span>
        </div>
        <div className="topbar-meta">
          <button disabled={!props.chapter} onClick={() => exportActiveChapter('txt')}>
            本章 TXT
          </button>
          <button disabled={!props.chapter} onClick={() => exportActiveChapter('md')}>
            本章 MD
          </button>
          <button onClick={() => exportBook('txt')}>全书 TXT</button>
          <button onClick={() => exportBook('md')}>全书 MD</button>
          <button onClick={props.onOpenAISettings}>AI 配置</button>
          <button onClick={() => setProjectSettingsOpen(true)}>作品设置</button>
          <span>已保存</span>
          <span>{props.chapter?.wordCount ?? 0} 字</span>
        </div>
      </header>

      <aside className="project-sidebar">
        <section>
          <div className="sidebar-heading">
            <h2>章节</h2>
            <button onClick={createVolume}>+ 卷</button>
          </div>
          {projectVolumes.map((volume) => (
            <div className="volume-block" key={volume.id}>
              <div className="volume-title">
                <span>{volume.title}</span>
                <button onClick={() => createChapter(volume)}>+ 章</button>
              </div>
              {projectChapters
                .filter((chapter) => chapter.volumeId === volume.id)
                .map((chapter) => (
                  <button
                    className={`chapter-link ${chapter.id === props.chapter?.id ? 'active' : ''}`}
                    key={chapter.id}
                    onClick={() => props.onSelectChapter(chapter.id)}
                  >
                    <span>{chapter.title}</span>
                    <small>{chapterStatusLabels[chapter.status]}</small>
                  </button>
                ))}
            </div>
          ))}
        </section>

        <section>
          <div className="sidebar-heading">
            <h2>人物</h2>
            <button onClick={createCharacter}>+</button>
          </div>
          {projectCharacters.map((character) => (
            <button
              className={`plain-list-item ${character.id === selectedCharacter?.id ? 'active' : ''}`}
              key={character.id}
              onClick={() => props.onSelectCharacter(character.id)}
            >
              {character.name}
            </button>
          ))}
        </section>

        <section>
          <div className="sidebar-heading">
            <h2>设定</h2>
            <button onClick={createSetting}>+</button>
          </div>
          {projectSettings.map((setting) => (
            <button
              className={`plain-list-item ${setting.id === selectedSetting?.id ? 'active' : ''}`}
              key={setting.id}
              onClick={() => props.onSelectSetting(setting.id)}
            >
              {setting.title}
            </button>
          ))}
        </section>
      </aside>

      <main className="main-panel">
        {props.mainView === 'chapter' && props.chapter && (
          <ChapterEditor
            chapter={props.chapter}
            onDeleteChapter={deleteChapter}
            onExportChapter={exportActiveChapter}
            onPatchState={props.onPatchState}
          />
        )}
        {props.mainView === 'character' && selectedCharacter && (
          <CharacterEditor
            character={selectedCharacter}
            onDeleteCharacter={deleteCharacter}
            onPatchState={props.onPatchState}
          />
        )}
        {props.mainView === 'setting' && selectedSetting && (
          <SettingEditor
            setting={selectedSetting}
            onDeleteSetting={deleteSetting}
            onPatchState={props.onPatchState}
          />
        )}
      </main>

      <ContextPanel
        state={props.state}
        project={props.project}
        chapter={props.chapter}
        characters={projectCharacters}
        settings={projectSettings}
        onPatchState={props.onPatchState}
      />
      {projectSettingsOpen && (
        <ProjectSettingsDialog
          project={props.project}
          onClose={() => setProjectSettingsOpen(false)}
          onPatchState={props.onPatchState}
        />
      )}
    </div>
  )
}

function ChapterEditor(props: {
  chapter: Chapter
  onDeleteChapter: (chapterId: string) => void
  onExportChapter: (format: 'txt' | 'md') => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
}) {
  function updateChapter(patch: Partial<Chapter>) {
    const timestamp = nowIso()

    props.onPatchState((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === props.chapter.id
          ? {
              ...chapter,
              ...patch,
              wordCount:
                typeof patch.content === 'string' ? countWords(patch.content) : chapter.wordCount,
              updatedAt: timestamp,
            }
          : chapter,
      ),
    }))
  }

  return (
    <section className="editor-panel">
      <input
        className="chapter-title-input"
        value={props.chapter.title}
        onChange={(event) => updateChapter({ title: event.target.value })}
      />
      <div className="editor-toolbar">
        <select
          value={props.chapter.status}
          onChange={(event) => updateChapter({ status: event.target.value as ChapterStatus })}
        >
          {Object.entries(chapterStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => updateChapter({ summary: summarizeChapter(props.chapter) })}>
          总结本章
        </button>
        <button type="button" onClick={() => props.onExportChapter('txt')}>
          导出 TXT
        </button>
        <button type="button" onClick={() => props.onExportChapter('md')}>
          导出 MD
        </button>
        <button type="button" className="danger-button" onClick={() => props.onDeleteChapter(props.chapter.id)}>
          删除
        </button>
        <span>{props.chapter.wordCount} 字</span>
      </div>
      <label className="field-block">
        本章目标
        <textarea
          value={props.chapter.goal ?? ''}
          onChange={(event) => updateChapter({ goal: event.target.value })}
        />
      </label>
      <textarea
        className="chapter-content"
        value={props.chapter.content}
        onChange={(event) => updateChapter({ content: event.target.value })}
        placeholder="开始写这一章..."
      />
    </section>
  )
}

function CharacterEditor(props: {
  character: Character
  onDeleteCharacter: (characterId: string) => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
}) {
  function updateCharacter(patch: Partial<Character>) {
    props.onPatchState((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === props.character.id
          ? { ...character, ...patch, updatedAt: nowIso() }
          : character,
      ),
    }))
  }

  return (
    <FormPanel title="人物卡">
      <div className="form-actions">
        <button className="danger-button" onClick={() => props.onDeleteCharacter(props.character.id)}>
          删除人物
        </button>
      </div>
      <TextField label="姓名" value={props.character.name} onChange={(name) => updateCharacter({ name })} />
      <TextField label="身份" value={props.character.role ?? ''} onChange={(role) => updateCharacter({ role })} />
      <TextField
        label="阵营/势力"
        value={props.character.faction ?? ''}
        onChange={(faction) => updateCharacter({ faction })}
      />
      <TextAreaField
        label="性格关键词"
        value={props.character.personality ?? ''}
        onChange={(personality) => updateCharacter({ personality })}
      />
      <TextAreaField
        label="目标/欲望"
        value={props.character.desire ?? ''}
        onChange={(desire) => updateCharacter({ desire })}
      />
      <TextAreaField
        label="口吻特点"
        value={props.character.speechStyle ?? ''}
        onChange={(speechStyle) => updateCharacter({ speechStyle })}
      />
      <TextAreaField
        label="当前状态"
        value={props.character.currentState ?? ''}
        onChange={(currentState) => updateCharacter({ currentState })}
      />
    </FormPanel>
  )
}

function SettingEditor(props: {
  setting: Setting
  onDeleteSetting: (settingId: string) => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
}) {
  function updateSetting(patch: Partial<Setting>) {
    props.onPatchState((current) => ({
      ...current,
      settings: current.settings.map((setting) =>
        setting.id === props.setting.id ? { ...setting, ...patch, updatedAt: nowIso() } : setting,
      ),
    }))
  }

  return (
    <FormPanel title="设定卡">
      <div className="form-actions">
        <button className="danger-button" onClick={() => props.onDeleteSetting(props.setting.id)}>
          删除设定
        </button>
      </div>
      <TextField label="标题" value={props.setting.title} onChange={(title) => updateSetting({ title })} />
      <label className="field-block">
        分类
        <select
          value={props.setting.category}
          onChange={(event) => updateSetting({ category: event.target.value as SettingCategory })}
        >
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
          value={props.setting.importance}
          onChange={(event) => updateSetting({ importance: event.target.value as SettingImportance })}
        >
          {Object.entries(settingImportanceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <TextAreaField
        label="内容"
        value={props.setting.content}
        onChange={(content) => updateSetting({ content })}
      />
      <TextAreaField
        label="备注"
        value={props.setting.notes ?? ''}
        onChange={(notes) => updateSetting({ notes })}
      />
    </FormPanel>
  )
}

function ContextPanel(props: {
  state: WebnovelIDEState
  project: Project
  chapter?: Chapter
  characters: Character[]
  settings: Setting[]
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
}) {
  const [taskType, setTaskType] = useState<AITaskType>('continue')
  const [instruction, setInstruction] = useState('')
  const [result, setResult] = useState('')

  const relatedCharacters = useMemo(() => {
    if (!props.chapter) return []
    const ids = props.state.chapterCharacters
      .filter((item) => item.chapterId === props.chapter?.id)
      .map((item) => item.characterId)
    return props.characters.filter((character) => ids.includes(character.id))
  }, [props.chapter, props.characters, props.state.chapterCharacters])

  const relatedSettings = useMemo(() => {
    if (!props.chapter) return []
    const ids = props.state.chapterSettings
      .filter((item) => item.chapterId === props.chapter?.id)
      .map((item) => item.settingId)
    return props.settings.filter((setting) => ids.includes(setting.id))
  }, [props.chapter, props.settings, props.state.chapterSettings])

  function generateMockAI() {
    if (!props.chapter) return
    const output = buildMockAIResult(taskType, props.chapter, instruction)
    const timestamp = nowIso()

    props.onPatchState((current) => ({
      ...current,
      aiRequests: [
        ...current.aiRequests,
        {
          id: createId('ai'),
          userId: 'user_local',
          projectId: props.project.id,
          chapterId: props.chapter?.id,
          taskType,
          instruction,
          inputSnapshot: JSON.stringify({
            project: props.project.title,
            chapter: props.chapter?.title,
            relatedCharacters: relatedCharacters.map((character) => character.name),
            relatedSettings: relatedSettings.map((setting) => setting.title),
          }),
          output,
          provider: 'mock',
          model: 'local-prototype',
          status: 'succeeded',
          createdAt: timestamp,
          completedAt: timestamp,
        },
      ],
    }))
    setResult(output)
  }

  function insertResult() {
    if (!props.chapter || !result) return
    const nextContent = `${props.chapter.content}${props.chapter.content ? '\n\n' : ''}${result}`

    props.onPatchState((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === props.chapter?.id
          ? { ...chapter, content: nextContent, wordCount: countWords(nextContent), updatedAt: nowIso() }
          : chapter,
      ),
    }))
  }

  return (
    <aside className="context-panel">
      <section>
        <h2>当前章节</h2>
        {props.chapter ? (
          <div className="context-card">
            <strong>{props.chapter.title}</strong>
            <span>{chapterStatusLabels[props.chapter.status]}</span>
            <p>{props.chapter.goal || '暂无本章目标'}</p>
            <small>{props.chapter.summary || '暂无本章摘要'}</small>
          </div>
        ) : (
          <p className="muted">未选择章节</p>
        )}
      </section>

      <section>
        <h2>相关人物</h2>
        <RelationPicker
          items={props.characters}
          activeIds={relatedCharacters.map((character) => character.id)}
          getLabel={(character) => character.name}
          onToggle={(characterId) => {
            if (!props.chapter) return
            props.onPatchState((current) => toggleChapterCharacter(current, props.chapter!.id, characterId))
          }}
        />
      </section>

      <section>
        <h2>相关设定</h2>
        <RelationPicker
          items={props.settings}
          activeIds={relatedSettings.map((setting) => setting.id)}
          getLabel={(setting) => setting.title}
          onToggle={(settingId) => {
            if (!props.chapter) return
            props.onPatchState((current) => toggleChapterSetting(current, props.chapter!.id, settingId))
          }}
        />
      </section>

      <section className="ai-panel">
        <h2>AI 助手</h2>
        <p className="muted">当前模型：{props.state.aiConfig?.model ?? 'local-prototype'}</p>
        <select value={taskType} onChange={(event) => setTaskType(event.target.value as AITaskType)}>
          {Object.entries(aiTaskLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="补充你的指令..."
        />
        <button className="primary-button" onClick={generateMockAI} disabled={!props.chapter}>
          生成模拟结果
        </button>
        <div className="ai-result">{result || 'AI 输出会显示在这里。'}</div>
        <button onClick={insertResult} disabled={!result}>
          插入正文
        </button>
      </section>
    </aside>
  )
}

function RelationPicker<T extends { id: string }>(props: {
  items: T[]
  activeIds: string[]
  getLabel: (item: T) => string
  onToggle: (id: string) => void
}) {
  if (props.items.length === 0) {
    return <p className="muted">暂无可关联内容</p>
  }

  return (
    <div className="relation-list">
      {props.items.map((item) => (
        <button
          className={props.activeIds.includes(item.id) ? 'active' : ''}
          key={item.id}
          onClick={() => props.onToggle(item.id)}
        >
          {props.getLabel(item)}
        </button>
      ))}
    </div>
  )
}

function FormPanel(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="form-panel">
      <h1>{props.title}</h1>
      {props.children}
    </section>
  )
}

function TextField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field-block">
      {props.label}
      <input value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  )
}

function TextAreaField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field-block">
      {props.label}
      <textarea value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  )
}

function toggleChapterCharacter(
  state: WebnovelIDEState,
  chapterId: string,
  characterId: string,
): WebnovelIDEState {
  const exists = state.chapterCharacters.some(
    (item) => item.chapterId === chapterId && item.characterId === characterId,
  )

  return {
    ...state,
    chapterCharacters: exists
      ? state.chapterCharacters.filter(
          (item) => !(item.chapterId === chapterId && item.characterId === characterId),
        )
      : [...state.chapterCharacters, { chapterId, characterId, createdAt: nowIso() }],
  }
}

function toggleChapterSetting(
  state: WebnovelIDEState,
  chapterId: string,
  settingId: string,
): WebnovelIDEState {
  const exists = state.chapterSettings.some(
    (item) => item.chapterId === chapterId && item.settingId === settingId,
  )

  return {
    ...state,
    chapterSettings: exists
      ? state.chapterSettings.filter((item) => !(item.chapterId === chapterId && item.settingId === settingId))
      : [...state.chapterSettings, { chapterId, settingId, createdAt: nowIso() }],
  }
}

function summarizeChapter(chapter: Chapter): string {
  if (!chapter.content.trim()) {
    return '本章尚未写入正文。'
  }

  const compact = chapter.content.replace(/\s+/g, ' ').trim()
  return compact.length > 120 ? `${compact.slice(0, 120)}...` : compact
}

function buildMockAIResult(taskType: AITaskType, chapter: Chapter, instruction: string): string {
  const base = instruction ? `根据指令「${instruction}」` : '根据当前章节上下文'

  if (taskType === 'summarize') {
    return summarizeChapter(chapter)
  }

  if (taskType === 'polish') {
    return `${base}，这里给出一版更紧凑、更适合连载阅读的润色结果。`
  }

  if (taskType === 'rewrite') {
    return `${base}，这里给出一版改写文本，保留原意并强化场景推进。`
  }

  return `${base}，下一段可以推进冲突、补足角色反应，并在段尾留下新的悬念。`
}

function buildChapterExport(chapter: Chapter, format: 'txt' | 'md'): string {
  if (format === 'md') {
    return `# ${chapter.title}\n\n${chapter.content.trim()}\n`
  }

  return `${chapter.title}\n\n${chapter.content.trim()}\n`
}

function buildBookExport(
  project: Project,
  volumes: Volume[],
  chapters: Chapter[],
  format: 'txt' | 'md',
): string {
  const sections = volumes
    .map((volume) => {
      const volumeChapters = chapters
        .filter((chapter) => chapter.volumeId === volume.id)
        .sort((a, b) => a.order - b.order)

      const chapterText = volumeChapters
        .map((chapter) => buildChapterExport(chapter, format))
        .join('\n\n')

      if (format === 'md') {
        return `# ${volume.title}\n\n${chapterText}`
      }

      return `${volume.title}\n\n${chapterText}`
    })
    .join('\n\n')

  if (format === 'md') {
    return `# ${project.title}\n\n${sections}\n`
  }

  return `${project.title}\n\n${sections}\n`
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}
