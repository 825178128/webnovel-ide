import { settingCategoryLabels, settingImportanceLabels } from '../constants/labels'
import { useDataStore } from '../data/DataContext'
import type { Chapter, Character, Setting, SettingCategory, SettingImportance } from '../types'
import { countWords, nowIso } from '../utils'
import { TextAreaField, TextField } from './forms'
import { TipTapEditor } from './editor/TipTapEditor'
import { stripHtml } from './editor/htmlUtils'

export function ChapterEditor(props: {
  chapter: Chapter
}) {
  const { state, patchState } = useDataStore()

  const projectCharacters = state.characters.filter(
    (c) => c.projectId === props.chapter.projectId,
  )
  const projectSettings = state.settings.filter(
    (s) => s.projectId === props.chapter.projectId,
  )
  const { editorFont, editorFontSize } = state.appSettings ?? {}

  function updateChapter(patch: Partial<Chapter>) {
    const timestamp = nowIso()

    patchState((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === props.chapter.id
          ? {
              ...chapter,
              ...patch,
              wordCount:
                typeof patch.content === 'string' ? countWords(stripHtml(patch.content)) : chapter.wordCount,
              updatedAt: timestamp,
            }
          : chapter,
      ),
    }))
  }

  return (
    <section className="editor-panel">
      <TipTapEditor
        contentKey={props.chapter.id}
        content={props.chapter.content}
        title={props.chapter.title}
        goal={props.chapter.goal ?? ''}
        status={props.chapter.status}
        wordCount={props.chapter.wordCount}
        characters={projectCharacters}
        settings={projectSettings}
        editorFont={editorFont}
        editorFontSize={editorFontSize}
        onContentChange={(text) => updateChapter({ content: text })}
        onTitleChange={(title) => updateChapter({ title })}
        onGoalChange={(goal) => updateChapter({ goal })}
        onStatusChange={(status) => updateChapter({ status })}
      />
    </section>
  )
}

export function CharacterEditor(props: {
  character: Character
  onDeleteCharacter: (characterId: string) => void
}) {
  const { patchState } = useDataStore()

  function updateCharacter(patch: Partial<Character>) {
    patchState((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === props.character.id
          ? { ...character, ...patch, updatedAt: nowIso() }
          : character,
      ),
    }))
  }

  return (
    <section className="form-panel entity-editor-panel">
      <div className="form-panel-header">
        <div>
          <span>人物资料</span>
          <h1>{props.character.name || '未命名人物'}</h1>
        </div>
        <button className="danger-button" onClick={() => props.onDeleteCharacter(props.character.id)}>
          删除人物
        </button>
      </div>

      <div className="form-section">
        <div className="form-section-title">基础信息</div>
        <div className="form-grid form-grid-3">
          <TextField label="姓名" value={props.character.name} onChange={(name) => updateCharacter({ name })} />
          <TextField label="身份" value={props.character.role ?? ''} onChange={(role) => updateCharacter({ role })} />
          <TextField
            label="阵营/势力"
            value={props.character.faction ?? ''}
            onChange={(faction) => updateCharacter({ faction })}
          />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">人物弧线</div>
        <TextAreaField
          label="目标/欲望"
          value={props.character.desire ?? ''}
          onChange={(desire) => updateCharacter({ desire })}
        />
        <TextAreaField
          label="当前状态"
          value={props.character.currentState ?? ''}
          onChange={(currentState) => updateCharacter({ currentState })}
        />
      </div>

      <div className="form-section">
        <div className="form-section-title">表达特征</div>
        <TextAreaField
          label="性格关键词"
          value={props.character.personality ?? ''}
          onChange={(personality) => updateCharacter({ personality })}
        />
        <TextAreaField
          label="口吻特点"
          value={props.character.speechStyle ?? ''}
          onChange={(speechStyle) => updateCharacter({ speechStyle })}
        />
      </div>
    </section>
  )
}

export function SettingEditor(props: {
  setting: Setting
  onDeleteSetting: (settingId: string) => void
}) {
  const { patchState } = useDataStore()

  function updateSetting(patch: Partial<Setting>) {
    patchState((current) => ({
      ...current,
      settings: current.settings.map((setting) =>
        setting.id === props.setting.id ? { ...setting, ...patch, updatedAt: nowIso() } : setting,
      ),
    }))
  }

  return (
    <section className="form-panel setting-editor-panel">
      <div className="form-panel-header">
        <div>
          <span>{settingCategoryLabels[props.setting.category]}</span>
          <h1>{props.setting.title || '未命名资料'}</h1>
        </div>
        <button className="danger-button" onClick={() => props.onDeleteSetting(props.setting.id)}>
          删除资料
        </button>
      </div>
      <div className="form-section">
        <div className="form-section-title">资料索引</div>
        <div className="form-grid form-grid-3">
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
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">正文资料</div>
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
      </div>
    </section>
  )
}
