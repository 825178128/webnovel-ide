import { useState } from 'react'
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
import { buildBookExport, buildChapterExport, type ExportFormat } from '../services/exportService'
import type { Chapter, Character, Project, Setting, Volume, WebnovelIDEState } from '../types'
import { createId, downloadText, nowIso } from '../utils'

export type MainView = 'chapter' | 'character' | 'setting'

type CreateDialogState =
  | { type: 'volume' }
  | { type: 'chapter'; volumeId: string }
  | { type: 'character' }
  | { type: 'setting' }
  | undefined

export interface WorkspacePageProps {
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

export function WorkspacePage(props: WorkspacePageProps) {
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
  const [createDialog, setCreateDialog] = useState<CreateDialogState>()
  const [assistantCollapsed, setAssistantCollapsed] = useState(false)

  function createVolume(form: Pick<Volume, 'title' | 'summary'>) {
    const timestamp = nowIso()

    props.onPatchState((current) => ({
      ...current,
      volumes: [
        ...current.volumes,
        {
          id: createId('volume'),
          projectId: props.project.id,
          title: form.title,
          summary: form.summary,
          order: projectVolumes.length + 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }))
    setCreateDialog(undefined)
  }

  function createChapter(volume: Volume, form: Pick<Chapter, 'title' | 'goal'>) {
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
          title: form.title,
          goal: form.goal,
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

  function moveChapter(chapterId: string, direction: -1 | 1) {
    const chapter = projectChapters.find((item) => item.id === chapterId)
    if (!chapter) return

    const siblings = projectChapters
      .filter((item) => item.volumeId === chapter.volumeId)
      .sort((a, b) => a.order - b.order)
    const index = siblings.findIndex((item) => item.id === chapterId)
    const swapWith = siblings[index + direction]
    if (!swapWith) return

    props.onPatchState((current) => ({
      ...current,
      chapters: current.chapters.map((item) => {
        if (item.id === chapter.id) return { ...item, order: swapWith.order, updatedAt: nowIso() }
        if (item.id === swapWith.id) return { ...item, order: chapter.order, updatedAt: nowIso() }
        return item
      }),
    }))
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

  function exportActiveChapter(format: ExportFormat) {
    if (!props.chapter) return
    const content = buildChapterExport(props.chapter, format)
    downloadText(`${props.project.title}-${props.chapter.title}.${format}`, content)
  }

  function exportBook(format: ExportFormat) {
    const content = buildBookExport(props.project, projectVolumes, projectChapters, format)
    downloadText(`${props.project.title}.${format}`, content)
  }

  return (
    <div className={`workspace ${assistantCollapsed ? 'assistant-collapsed' : ''}`}>
      <header className="workspace-topbar">
        <div className="window-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <button className="topbar-back" aria-label="返回作品列表" title="返回作品列表" onClick={props.onBack}>
          <Icon name="arrow-left" />
        </button>
        <div className="workspace-title">
          <strong>{props.project.title}</strong>
          <span>{props.chapter ? props.chapter.title : '未选择章节'}</span>
        </div>
        <div className="topbar-meta">
          <div className="toolbar-group">
            <button className="button-with-icon" disabled={!props.chapter} onClick={() => exportActiveChapter('txt')}>
              <Icon name="file" />
              <span>本章 TXT</span>
            </button>
            <button className="button-with-icon" disabled={!props.chapter} onClick={() => exportActiveChapter('md')}>
              <Icon name="file" />
              <span>本章 MD</span>
            </button>
            <button className="button-with-icon" onClick={() => exportBook('txt')}>
              <Icon name="download" />
              <span>全书 TXT</span>
            </button>
            <button className="button-with-icon" onClick={() => exportBook('md')}>
              <Icon name="download" />
              <span>全书 MD</span>
            </button>
          </div>
          <div className="toolbar-group">
            <button className="button-with-icon" onClick={props.onOpenAISettings}>
              <Icon name="sparkles" />
              <span>AI 配置</span>
            </button>
            <button className="button-with-icon" onClick={() => setProjectSettingsOpen(true)}>
              <Icon name="settings" />
              <span>作品设置</span>
            </button>
            <button className="button-with-icon" onClick={() => setAssistantCollapsed((value) => !value)}>
              <Icon name={assistantCollapsed ? 'panel-right' : 'panel-left'} />
              <span>{assistantCollapsed ? '展开助手' : '收起助手'}</span>
            </button>
          </div>
          <div className="save-status">
            <Icon name="save" />
            <span>已保存</span>
            <strong>{props.chapter?.wordCount ?? 0} 字</strong>
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
          onClick={() => {
            if (selectedCharacter) props.onSetMainView('character')
          }}
        >
          <Icon name="users" size={19} />
        </button>
        <button
          className={props.mainView === 'setting' ? 'active' : ''}
          title="设定"
          onClick={() => {
            if (selectedSetting) props.onSetMainView('setting')
          }}
        >
          <Icon name="database" size={19} />
        </button>
        <span />
        <button title="AI 配置" onClick={props.onOpenAISettings}>
          <Icon name="sparkles" size={19} />
        </button>
        <button title="作品设置" onClick={() => setProjectSettingsOpen(true)}>
          <Icon name="settings" size={19} />
        </button>
      </nav>

      <aside className="project-sidebar">
        <div className="sidebar-title">
          <span>资源管理器</span>
          <strong>{props.project.title}</strong>
        </div>
        <section>
          <div className="sidebar-heading">
            <h2>
              <Icon name="book" />
              <span>章节</span>
            </h2>
            <button className="button-with-icon" onClick={() => setCreateDialog({ type: 'volume' })}>
              <Icon name="plus" />
              <span>新卷</span>
            </button>
          </div>
          {projectVolumes.map((volume) => (
            <div className="volume-block" key={volume.id}>
              <div className="volume-title">
                <span>{volume.title}</span>
                <div className="inline-actions">
                  <button className="icon-button" title="重命名卷" onClick={() => renameVolume(volume)}>
                    <Icon name="edit" />
                  </button>
                  <button
                    className="icon-button"
                    title="新建章节"
                    onClick={() => setCreateDialog({ type: 'chapter', volumeId: volume.id })}
                  >
                    <Icon name="plus" />
                  </button>
                  <button className="icon-button danger-button" title="删除卷" onClick={() => deleteVolume(volume.id)}>
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
              {projectChapters
                .filter((chapter) => chapter.volumeId === volume.id)
                .map((chapter) => (
                  <div className="chapter-row" key={chapter.id}>
                    <button
                      className={`chapter-link ${chapter.id === props.chapter?.id ? 'active' : ''}`}
                      onClick={() => props.onSelectChapter(chapter.id)}
                    >
                      <span>{chapter.title}</span>
                      <small>{chapterStatusLabels[chapter.status]}</small>
                    </button>
                    <div className="chapter-row-actions">
                      <button className="icon-button" title="上移章节" onClick={() => moveChapter(chapter.id, -1)}>
                        <Icon name="arrow-up" />
                      </button>
                      <button className="icon-button" title="下移章节" onClick={() => moveChapter(chapter.id, 1)}>
                        <Icon name="arrow-down" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </section>

        <section>
          <div className="sidebar-heading">
            <h2>
              <Icon name="users" />
              <span>人物</span>
            </h2>
            <button className="icon-button" title="新建人物" onClick={() => setCreateDialog({ type: 'character' })}>
              <Icon name="plus" />
            </button>
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
            <h2>
              <Icon name="database" />
              <span>设定</span>
            </h2>
            <button className="icon-button" title="新建设定" onClick={() => setCreateDialog({ type: 'setting' })}>
              <Icon name="plus" />
            </button>
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
        <div className="editor-tabs">
          <button className="active">
            <Icon name={props.mainView === 'chapter' ? 'file' : props.mainView === 'character' ? 'users' : 'database'} />
            <span>
              {props.mainView === 'chapter'
                ? props.chapter?.title || '未选择章节'
                : props.mainView === 'character'
                  ? selectedCharacter?.name || '人物'
                  : selectedSetting?.title || '设定'}
            </span>
          </button>
        </div>
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

      {!assistantCollapsed && (
        <ContextPanel
          state={props.state}
          project={props.project}
          chapter={props.chapter}
          characters={projectCharacters}
          settings={projectSettings}
          onPatchState={props.onPatchState}
        />
      )}
      <footer className="workspace-statusbar">
        <span>{props.chapter?.status ? chapterStatusLabels[props.chapter.status] : '未选择章节'}</span>
        <span>{props.chapter?.wordCount ?? 0} 字</span>
        <span>{projectChapters.length} 章</span>
        <span>{projectCharacters.length} 人物</span>
        <span>{projectSettings.length} 设定</span>
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
    </div>
  )
}
