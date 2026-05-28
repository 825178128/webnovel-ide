import { useEffect, useRef, useState, type DragEvent, type MouseEvent } from 'react'
import { ContextPanel } from '../components/ContextPanel'
import { Icon } from '../components/Icon'
import {
  CreateChapterDialog,
  CreateCharacterDialog,
  CreateSettingDialog,
  CreateVolumeDialog,
  ProjectSettingsDialog,
} from '../components/dialogs'
import { ChapterEditor, CharacterEditor, SettingEditor } from '../components/editors'
import { chapterStatusLabels } from '../constants/labels'
import { buildBookExport, type ExportFormat } from '../services/exportService'
import type { Chapter, Character, Project, Setting, Volume, WebnovelIDEState } from '../types'
import { createId, downloadText, nowIso } from '../utils'

export type MainView = 'chapter' | 'character' | 'setting'

type CreateDialogState =
  | { type: 'volume' }
  | { type: 'chapter'; volumeId: string }
  | { type: 'character' }
  | { type: 'setting' }
  | undefined

type VolumeMenuState = { volumeId: string; x: number; y: number } | undefined
type ChapterMenuState = { chapterId: string; x: number; y: number } | undefined
type CharacterMenuState = { characterId: string; x: number; y: number } | undefined
type SettingMenuState = { settingId: string; x: number; y: number } | undefined

function getContextMenuPosition(event: MouseEvent) {
  const margin = 8
  const estimatedWidth = 184
  const estimatedHeight = 144
  const maxX = window.innerWidth - estimatedWidth - margin
  const maxY = window.innerHeight - estimatedHeight - margin

  return {
    x: Math.max(margin, Math.min(event.clientX, maxX)),
    y: Math.max(margin, Math.min(event.clientY, maxY)),
  }
}

export interface WorkspacePageProps {
  state: WebnovelIDEState
  project: Project
  chapter?: Chapter
  mainView: MainView
  selectedCharacterId?: string
  selectedSettingId?: string
  onBack: () => void
  onOpenAppSettings: () => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
  onSelectChapter: (chapterId: string) => void
  onSelectCharacter: (characterId: string) => void
  onSelectSetting: (settingId: string) => void
  onSetMainView: (view: MainView) => void
}

export function WorkspacePage(props: WorkspacePageProps) {
  const projectVolumes = props.state.volumes
    .filter((volume) => volume.projectId === props.project.id)
    .sort((a, b) => a.order - b.order)
  const projectChapters = props.state.chapters.filter((chapter) => chapter.projectId === props.project.id)
  const projectCharacters = props.state.characters.filter(
    (character) => character.projectId === props.project.id,
  )
  const projectSettings = props.state.settings.filter((setting) => setting.projectId === props.project.id)
  const selectedCharacter = projectCharacters.find(
    (character) => character.id === props.selectedCharacterId,
  )
  const selectedSetting = projectSettings.find((setting) => setting.id === props.selectedSettingId)
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false)
  const [createDialog, setCreateDialog] = useState<CreateDialogState>()
  const [assistantCollapsed, setAssistantCollapsed] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedVolumeId, setExpandedVolumeId] = useState<string | undefined>(props.chapter?.volumeId)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [draggingChapterId, setDraggingChapterId] = useState<string>()
  const [dragOverChapterId, setDragOverChapterId] = useState<string>()
  const [volumeMenu, setVolumeMenu] = useState<VolumeMenuState>()
  const [chapterMenu, setChapterMenu] = useState<ChapterMenuState>()
  const [characterMenu, setCharacterMenu] = useState<CharacterMenuState>()
  const [settingMenu, setSettingMenu] = useState<SettingMenuState>()
  const activeChapterRowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    activeChapterRowRef.current?.scrollIntoView({ block: 'end' })
  }, [props.chapter?.id, expandedVolumeId])

  useEffect(() => {
    if (props.chapter?.volumeId) {
      setExpandedVolumeId(props.chapter.volumeId)
    }
  }, [props.chapter?.volumeId])

  function createVolume(form: Pick<Volume, 'title' | 'summary'>) {
    const timestamp = nowIso()
    const volumeId = createId('volume')

    props.onPatchState((current) => ({
      ...current,
      volumes: [
        ...current.volumes,
        {
          id: volumeId,
          projectId: props.project.id,
          title: form.title,
          summary: form.summary,
          order: projectVolumes.length + 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }))
    setExpandedVolumeId(volumeId)
    setCreateDialog(undefined)
  }

  function createChapter(volume: Volume, form: Pick<Chapter, 'title' | 'goal'>) {
    const timestamp = nowIso()
    const chapterId = createId('chapter')
    const chaptersInVolume = projectChapters.filter((chapter) => chapter.volumeId === volume.id)
    const nextOrder = Math.max(0, ...chaptersInVolume.map((chapter) => chapter.order)) + 1

    props.onPatchState((current) => ({
      ...current,
      chapters: [
        ...current.chapters,
        {
          id: chapterId,
          projectId: props.project.id,
          volumeId: volume.id,
          title: form.title,
          goal: form.goal,
          summary: '',
          content: '',
          status: 'draft',
          wordCount: 0,
          order: nextOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      activeChapterId: chapterId,
    }))
    props.onSetMainView('chapter')
    setExpandedVolumeId(volume.id)
    setCreateDialog(undefined)
  }

  function createCharacter(form: Pick<Character, 'name' | 'role' | 'faction'>) {
    const timestamp = nowIso()
    const id = createId('character')

    props.onPatchState((current) => ({
      ...current,
      characters: [
        ...current.characters,
        {
          id,
          projectId: props.project.id,
          name: form.name,
          role: form.role,
          faction: form.faction,
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
    setCreateDialog(undefined)
  }

  function createSetting(form: Pick<Setting, 'title' | 'category' | 'content' | 'importance'>) {
    const timestamp = nowIso()
    const id = createId('setting')

    props.onPatchState((current) => ({
      ...current,
      settings: [
        ...current.settings,
        {
          id,
          projectId: props.project.id,
          title: form.title,
          category: form.category,
          content: form.content,
          importance: form.importance,
          notes: '',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }))
    props.onSelectSetting(id)
    setCreateDialog(undefined)
  }

  function renameVolume(volume: Volume) {
    const title = window.prompt('卷名', volume.title)
    if (!title?.trim()) return

    props.onPatchState((current) => ({
      ...current,
      volumes: current.volumes.map((item) =>
        item.id === volume.id ? { ...item, title: title.trim(), updatedAt: nowIso() } : item,
      ),
    }))
  }

  function deleteVolume(volumeId: string) {
    const volume = projectVolumes.find((item) => item.id === volumeId)
    if (!volume || !window.confirm(`确定删除卷「${volume.title}」及其全部章节吗？`)) return

    const chapterIds = projectChapters
      .filter((chapter) => chapter.volumeId === volumeId)
      .map((chapter) => chapter.id)
    const remainingChapter = projectChapters.find((chapter) => !chapterIds.includes(chapter.id))

    props.onPatchState((current) => ({
      ...current,
      volumes: current.volumes.filter((item) => item.id !== volumeId),
      chapters: current.chapters.filter((item) => !chapterIds.includes(item.id)),
      chapterCharacters: current.chapterCharacters.filter((item) => !chapterIds.includes(item.chapterId)),
      chapterSettings: current.chapterSettings.filter((item) => !chapterIds.includes(item.chapterId)),
      aiRequests: current.aiRequests.filter((item) => !item.chapterId || !chapterIds.includes(item.chapterId)),
      activeChapterId: remainingChapter?.id,
    }))
    props.onSetMainView('chapter')
  }

  function openVolumeMenu(event: MouseEvent, volumeId: string) {
    event.preventDefault()
    const position = getContextMenuPosition(event)
    setExportMenuOpen(false)
    setVolumeMenu({ volumeId, ...position })
    setChapterMenu(undefined)
    setCharacterMenu(undefined)
    setSettingMenu(undefined)
  }

  function openChapterMenu(event: MouseEvent, chapterId: string) {
    event.preventDefault()
    const position = getContextMenuPosition(event)
    setExportMenuOpen(false)
    setChapterMenu({ chapterId, ...position })
    setVolumeMenu(undefined)
    setCharacterMenu(undefined)
    setSettingMenu(undefined)
  }

  function openCharacterMenu(event: MouseEvent, characterId: string) {
    event.preventDefault()
    const position = getContextMenuPosition(event)
    setExportMenuOpen(false)
    setCharacterMenu({ characterId, ...position })
    setVolumeMenu(undefined)
    setChapterMenu(undefined)
    setSettingMenu(undefined)
  }

  function openSettingMenu(event: MouseEvent, settingId: string) {
    event.preventDefault()
    const position = getContextMenuPosition(event)
    setExportMenuOpen(false)
    setSettingMenu({ settingId, ...position })
    setVolumeMenu(undefined)
    setChapterMenu(undefined)
    setCharacterMenu(undefined)
  }

  function toggleVolume(volumeId: string) {
    setExpandedVolumeId((current) => (current === volumeId ? undefined : volumeId))
  }

  function renameChapter(chapter: Chapter) {
    const title = window.prompt('章节名', chapter.title)
    if (!title?.trim()) return

    props.onPatchState((current) => ({
      ...current,
      chapters: current.chapters.map((item) =>
        item.id === chapter.id ? { ...item, title: title.trim(), updatedAt: nowIso() } : item,
      ),
    }))
  }

  function renameCharacter(character: Character) {
    const name = window.prompt('人物名', character.name)
    if (!name?.trim()) return

    props.onPatchState((current) => ({
      ...current,
      characters: current.characters.map((item) =>
        item.id === character.id ? { ...item, name: name.trim(), updatedAt: nowIso() } : item,
      ),
    }))
  }

  function renameSetting(setting: Setting) {
    const title = window.prompt('资料标题', setting.title)
    if (!title?.trim()) return

    props.onPatchState((current) => ({
      ...current,
      settings: current.settings.map((item) =>
        item.id === setting.id ? { ...item, title: title.trim(), updatedAt: nowIso() } : item,
      ),
    }))
  }

  function reorderChapter(sourceChapterId: string | undefined, targetChapterId: string) {
    if (!sourceChapterId || sourceChapterId === targetChapterId) return

    const source = projectChapters.find((item) => item.id === sourceChapterId)
    const target = projectChapters.find((item) => item.id === targetChapterId)
    if (!source || !target || source.volumeId !== target.volumeId) return

    const siblings = projectChapters.filter((item) => item.volumeId === source.volumeId)
    const ordered = siblings.filter((item) => item.id !== sourceChapterId)
    const targetIndex = ordered.findIndex((item) => item.id === targetChapterId)
    ordered.splice(targetIndex, 0, source)
    const nextOrderById = new Map(ordered.map((item, index) => [item.id, index + 1]))
    const timestamp = nowIso()

    props.onPatchState((current) => ({
      ...current,
      chapters: (() => {
        const firstSiblingIndex = current.chapters.findIndex((item) => item.volumeId === source.volumeId)
        const reorderedSiblings = ordered.map((item) => {
          const order = nextOrderById.get(item.id)
          return order ? { ...item, order, updatedAt: timestamp } : item
        })
        const nextChapters = current.chapters.filter((item) => item.volumeId !== source.volumeId)
        nextChapters.splice(firstSiblingIndex, 0, ...reorderedSiblings)
        return nextChapters
      })(),
    }))
  }

  function handleChapterDragStart(event: DragEvent, chapterId: string) {
    event.dataTransfer.effectAllowed = 'move'
    setDraggingChapterId(chapterId)
  }

  function volumeChapters(volumeId: string) {
    return projectChapters.filter((chapter) => chapter.volumeId === volumeId)
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

  function exportBook(format: ExportFormat) {
    const content = buildBookExport(props.project, projectVolumes, projectChapters, format)
    downloadText(`${props.project.title}.${format}`, content)
    setExportMenuOpen(false)
  }

  function openCharacterView() {
    if (selectedCharacter) {
      props.onSetMainView('character')
      return
    }

    const firstCharacter = projectCharacters[0]
    if (firstCharacter) {
      props.onSelectCharacter(firstCharacter.id)
      return
    }

    props.onSetMainView('character')
  }

  function openSettingView() {
    if (selectedSetting) {
      props.onSetMainView('setting')
      return
    }

    const firstSetting = projectSettings[0]
    if (firstSetting) {
      props.onSelectSetting(firstSetting.id)
      return
    }

    props.onSetMainView('setting')
  }

  const workspaceModeLabel =
    props.mainView === 'chapter' ? '章节编辑' : props.mainView === 'character' ? '人物卡' : '资料卡'
  const activeResourceLabel =
    props.mainView === 'chapter'
      ? props.chapter?.title
      : props.mainView === 'character'
        ? selectedCharacter?.name
        : selectedSetting?.title

  return (
    <div
      className={`workspace ${assistantCollapsed ? 'assistant-collapsed' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      onClick={() => {
        setExportMenuOpen(false)
        setVolumeMenu(undefined)
        setChapterMenu(undefined)
        setCharacterMenu(undefined)
        setSettingMenu(undefined)
      }}
    >
      <header className="workspace-topbar">
        <div className="topbar-left">
          <button className="topbar-back" aria-label="返回作品列表" title="返回作品列表" onClick={props.onBack}>
            <Icon name="arrow-left" />
          </button>
          {sidebarCollapsed && (
            <button
              className="topbar-sidebar-toggle"
              title="展开资源管理器"
              onClick={() => setSidebarCollapsed(false)}
            >
              <Icon name="panel-right" />
            </button>
          )}
          <div className="workspace-title">
            <strong>{props.project.title}</strong>
            <span>{workspaceModeLabel}</span>
          </div>
        </div>
        <div className="workspace-topbar-spacer" />
        {activeResourceLabel && (
          <div className="workspace-current-resource" title={activeResourceLabel}>
            {activeResourceLabel}
          </div>
        )}
        <div className="topbar-meta">
          <div className="toolbar-group assistant-toolbar">
            <button
              className="icon-button assistant-toggle-button"
              aria-label={assistantCollapsed ? '打开右侧助手' : '隐藏右侧助手'}
              title={assistantCollapsed ? '打开右侧助手' : '隐藏右侧助手'}
              onClick={() => setAssistantCollapsed((value) => !value)}
            >
              <Icon name={assistantCollapsed ? 'panel-right' : 'panel-left'} />
            </button>
          </div>
        </div>
      </header>

      <nav className="activity-bar" aria-label="工作台导航">
        <button
          className={props.mainView === 'chapter' ? 'active' : ''}
          title="章节"
          onClick={() => props.onSetMainView('chapter')}
        >
          <Icon name="book" size={19} />
        </button>
        <button
          className={props.mainView === 'character' ? 'active' : ''}
          title="人物"
          onClick={openCharacterView}
        >
          <Icon name="users" size={19} />
        </button>
        <button
          className={props.mainView === 'setting' ? 'active' : ''}
          title="设定"
          onClick={openSettingView}
        >
          <Icon name="database" size={19} />
        </button>
        <span />
        <button title="应用设置" onClick={props.onOpenAppSettings}>
          <Icon name="settings" size={19} />
        </button>
        <button title="作品设置" onClick={() => setProjectSettingsOpen(true)}>
          <Icon name="book" size={19} />
        </button>
      </nav>

      <aside className="project-sidebar">
        <div className="sidebar-title">
          <span>资源管理器</span>
          <div className="sidebar-title-actions">
            <button
              className={`icon-button ${exportMenuOpen ? 'active' : ''}`}
              title="导出作品"
              onClick={(event) => {
                event.stopPropagation()
                setExportMenuOpen((value) => !value)
              }}
            >
              <Icon name="download" />
            </button>
            <button className="icon-button" title="收起资源管理器" onClick={() => setSidebarCollapsed(true)}>
              <Icon name="panel-left" />
            </button>
          </div>
          {exportMenuOpen && (
            <div className="sidebar-export-menu" onClick={(event) => event.stopPropagation()}>
              <div className="sidebar-menu-title">导出整本作品</div>
              <button className="button-with-icon" onClick={() => exportBook('txt')}>
                <Icon name="file" />
                <span>TXT 文本</span>
              </button>
              <button className="button-with-icon" onClick={() => exportBook('md')}>
                <Icon name="file" />
                <span>Markdown</span>
              </button>
            </div>
          )}
        </div>
        <section className="sidebar-section">
          <div className="sidebar-heading">
            <h2>
              <Icon name="book" />
              <span>章节</span>
              <strong>{projectChapters.length}</strong>
            </h2>
            <button className="button-with-icon" onClick={() => setCreateDialog({ type: 'volume' })}>
              <Icon name="plus" />
              <span>新卷</span>
            </button>
          </div>
          {projectVolumes.length === 0 ? (
            <div className="sidebar-empty">
              <span>还没有卷</span>
              <button className="button-with-icon" onClick={() => setCreateDialog({ type: 'volume' })}>
                <Icon name="plus" />
                <span>新建第一卷</span>
              </button>
            </div>
          ) : (
            projectVolumes.map((volume) => {
              const chaptersInVolume = volumeChapters(volume.id)

              return (
                <div className={`volume-block ${expandedVolumeId !== volume.id ? 'collapsed' : ''}`} key={volume.id}>
                  <div
                    className="volume-title"
                    title="点击折叠或展开"
                    onClick={() => toggleVolume(volume.id)}
                    onContextMenu={(event) => openVolumeMenu(event, volume.id)}
                  >
                    <span className="volume-name">
                      <Icon name="arrow-down" size={13} />
                      <span>{volume.title}</span>
                    </span>
                    <div className="inline-actions">
                      <small>{chaptersInVolume.length} 章</small>
                      <button
                        className="icon-button"
                        title="新建章节"
                        onClick={(event) => {
                          event.stopPropagation()
                          setCreateDialog({ type: 'chapter', volumeId: volume.id })
                        }}
                      >
                        <Icon name="plus" />
                      </button>
                    </div>
                  </div>
                  {expandedVolumeId === volume.id && (
                    <div className="chapter-list-scroll">
                      {chaptersInVolume.length === 0 && (
                        <button
                          className="chapter-empty-action"
                          onClick={() => setCreateDialog({ type: 'chapter', volumeId: volume.id })}
                        >
                          <Icon name="plus" />
                          <span>添加本卷第一章</span>
                        </button>
                      )}
                      {chaptersInVolume.map((chapter) => (
                        <div
                          className={`chapter-row ${draggingChapterId === chapter.id ? 'dragging' : ''} ${dragOverChapterId === chapter.id ? 'drop-target' : ''}`}
                          draggable
                          key={chapter.id}
                          ref={chapter.id === props.chapter?.id ? activeChapterRowRef : undefined}
                          onDragEnd={() => {
                            setDraggingChapterId(undefined)
                            setDragOverChapterId(undefined)
                          }}
                          onDragEnter={() => {
                            if (draggingChapterId && draggingChapterId !== chapter.id) {
                              setDragOverChapterId(chapter.id)
                            }
                          }}
                          onDragOver={(event) => {
                            event.preventDefault()
                            if (draggingChapterId && draggingChapterId !== chapter.id) {
                              setDragOverChapterId(chapter.id)
                            }
                          }}
                          onDragStart={(event) => handleChapterDragStart(event, chapter.id)}
                          onDrop={(event) => {
                            event.preventDefault()
                            reorderChapter(draggingChapterId, chapter.id)
                            setDraggingChapterId(undefined)
                            setDragOverChapterId(undefined)
                          }}
                          onContextMenu={(event) => openChapterMenu(event, chapter.id)}
                        >
                          <button
                            className={`chapter-link ${chapter.id === props.chapter?.id ? 'active' : ''}`}
                            onClick={() => props.onSelectChapter(chapter.id)}
                          >
                            <span>{chapter.title}</span>
                            <small>{chapterStatusLabels[chapter.status]}</small>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>

        <section className="sidebar-section">
          <div className="sidebar-heading">
            <h2>
              <Icon name="users" />
              <span>人物</span>
              <strong>{projectCharacters.length}</strong>
            </h2>
            {projectCharacters.length > 0 && (
              <button className="icon-button" title="新建人物" onClick={() => setCreateDialog({ type: 'character' })}>
                <Icon name="plus" />
              </button>
            )}
          </div>
          {projectCharacters.length === 0 ? (
            <button className="sidebar-empty-action" onClick={() => setCreateDialog({ type: 'character' })}>
              <Icon name="plus" />
              <span>添加主要人物</span>
            </button>
          ) : (
            projectCharacters.map((character) => (
              <button
                className={`plain-list-item ${character.id === selectedCharacter?.id ? 'active' : ''}`}
                key={character.id}
                onClick={() => props.onSelectCharacter(character.id)}
                onContextMenu={(event) => openCharacterMenu(event, character.id)}
              >
                {character.name}
              </button>
            ))
          )}
        </section>

        <section className="sidebar-section">
          <div className="sidebar-heading">
            <h2>
              <Icon name="database" />
              <span>资料库</span>
              <strong>{projectSettings.length}</strong>
            </h2>
            {projectSettings.length > 0 && (
              <button className="icon-button" title="新增资料" onClick={() => setCreateDialog({ type: 'setting' })}>
                <Icon name="plus" />
              </button>
            )}
          </div>
          {projectSettings.length === 0 ? (
            <button className="sidebar-empty-action" onClick={() => setCreateDialog({ type: 'setting' })}>
              <Icon name="plus" />
              <span>添加设定资料</span>
            </button>
          ) : (
            projectSettings.map((setting) => (
              <button
                className={`plain-list-item ${setting.id === selectedSetting?.id ? 'active' : ''}`}
                key={setting.id}
                onClick={() => props.onSelectSetting(setting.id)}
                onContextMenu={(event) => openSettingMenu(event, setting.id)}
              >
                {setting.title}
              </button>
            ))
          )}
        </section>

      </aside>

      <main className={`main-panel main-panel-${props.mainView}`}>
        {props.mainView === 'chapter' && props.chapter && (
          <ChapterEditor
            chapter={props.chapter}
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
        {props.mainView === 'character' && !selectedCharacter && (
          <section className="main-empty-panel">
            <Icon name="users" size={24} />
            <h1>还没有人物卡</h1>
            <p>人物卡用于维护主角、配角、阵营和口吻信息。</p>
            <button className="primary-button button-with-icon" onClick={() => setCreateDialog({ type: 'character' })}>
              <Icon name="plus" />
              <span>添加主要人物</span>
            </button>
          </section>
        )}
        {props.mainView === 'setting' && selectedSetting && (
          <SettingEditor
            setting={selectedSetting}
            onDeleteSetting={deleteSetting}
            onPatchState={props.onPatchState}
          />
        )}
        {props.mainView === 'setting' && !selectedSetting && (
          <section className="main-empty-panel">
            <Icon name="database" size={24} />
            <h1>还没有资料卡</h1>
            <p>资料卡用于沉淀世界观、规则、地点、组织和素材索引。</p>
            <button className="primary-button button-with-icon" onClick={() => setCreateDialog({ type: 'setting' })}>
              <Icon name="plus" />
              <span>添加设定资料</span>
            </button>
          </section>
        )}
      </main>

      {!assistantCollapsed && (
        <ContextPanel
          state={props.state}
          project={props.project}
          chapter={props.chapter}
          mainView={props.mainView}
          character={selectedCharacter}
          setting={selectedSetting}
          characters={projectCharacters}
          settings={projectSettings}
          onPatchState={props.onPatchState}
        />
      )}
      <footer className="workspace-statusbar">
        <div className="statusbar-left">
          <span className="save-status">
            <span className="status-dot" />
            自动保存
          </span>
          <span>{workspaceModeLabel}</span>
        </div>
        <div className="statusbar-right">
          <span>{props.chapter?.wordCount ?? 0} 字</span>
          <span>{projectChapters.length} 章</span>
          <span>{projectCharacters.length} 人物</span>
          <span>{projectSettings.length} 资料</span>
        </div>
      </footer>
      {projectSettingsOpen && (
        <ProjectSettingsDialog
          project={props.project}
          onClose={() => setProjectSettingsOpen(false)}
          onPatchState={props.onPatchState}
        />
      )}
      {createDialog?.type === 'volume' && (
        <CreateVolumeDialog onClose={() => setCreateDialog(undefined)} onSubmit={createVolume} />
      )}
      {createDialog?.type === 'chapter' && (
        <CreateChapterDialog
          defaultTitle={`第 ${projectChapters.length + 1} 章`}
          onClose={() => setCreateDialog(undefined)}
          onSubmit={(form) => {
            const volume = projectVolumes.find((item) => item.id === createDialog.volumeId)
            if (volume) createChapter(volume, form)
          }}
        />
      )}
      {createDialog?.type === 'character' && (
        <CreateCharacterDialog onClose={() => setCreateDialog(undefined)} onSubmit={createCharacter} />
      )}
      {createDialog?.type === 'setting' && (
        <CreateSettingDialog onClose={() => setCreateDialog(undefined)} onSubmit={createSetting} />
      )}
      {volumeMenu && (
        <div
          className="context-menu"
          style={{ left: volumeMenu.x, top: volumeMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              setCreateDialog({ type: 'chapter', volumeId: volumeMenu.volumeId })
              setVolumeMenu(undefined)
            }}
          >
            新建章节
          </button>
          <button
            onClick={() => {
              const volume = projectVolumes.find((item) => item.id === volumeMenu.volumeId)
              if (volume) renameVolume(volume)
              setVolumeMenu(undefined)
            }}
          >
            重命名卷
          </button>
          <button
            className="danger-menu-item"
            onClick={() => {
              deleteVolume(volumeMenu.volumeId)
              setVolumeMenu(undefined)
            }}
          >
            删除卷
          </button>
        </div>
      )}
      {chapterMenu && (
        <div
          className="context-menu"
          style={{ left: chapterMenu.x, top: chapterMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              const chapter = projectChapters.find((item) => item.id === chapterMenu.chapterId)
              if (chapter) renameChapter(chapter)
              setChapterMenu(undefined)
            }}
          >
            重命名章节
          </button>
          <button
            onClick={() => {
              props.onSelectChapter(chapterMenu.chapterId)
              setChapterMenu(undefined)
            }}
          >
            打开章节
          </button>
          <button
            className="danger-menu-item"
            onClick={() => {
              deleteChapter(chapterMenu.chapterId)
              setChapterMenu(undefined)
            }}
          >
            删除章节
          </button>
        </div>
      )}
      {characterMenu && (
        <div
          className="context-menu"
          style={{ left: characterMenu.x, top: characterMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              const character = projectCharacters.find((item) => item.id === characterMenu.characterId)
              if (character) renameCharacter(character)
              setCharacterMenu(undefined)
            }}
          >
            重命名人物
          </button>
          <button
            onClick={() => {
              props.onSelectCharacter(characterMenu.characterId)
              setCharacterMenu(undefined)
            }}
          >
            打开人物卡
          </button>
          <button
            className="danger-menu-item"
            onClick={() => {
              deleteCharacter(characterMenu.characterId)
              setCharacterMenu(undefined)
            }}
          >
            删除人物
          </button>
        </div>
      )}
      {settingMenu && (
        <div
          className="context-menu"
          style={{ left: settingMenu.x, top: settingMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              const setting = projectSettings.find((item) => item.id === settingMenu.settingId)
              if (setting) renameSetting(setting)
              setSettingMenu(undefined)
            }}
          >
            重命名资料
          </button>
          <button
            onClick={() => {
              props.onSelectSetting(settingMenu.settingId)
              setSettingMenu(undefined)
            }}
          >
            打开资料卡
          </button>
          <button
            className="danger-menu-item"
            onClick={() => {
              deleteSetting(settingMenu.settingId)
              setSettingMenu(undefined)
            }}
          >
            删除资料
          </button>
        </div>
      )}
    </div>
  )
}
