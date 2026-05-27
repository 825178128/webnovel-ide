import { chapterStatusLabels, settingCategoryLabels, settingImportanceLabels } from '../constants/labels'
import { summarizeChapter } from '../services/chapterTools'
import type {
  Chapter,
  ChapterStatus,
  Character,
  Setting,
  SettingCategory,
  SettingImportance,
  WebnovelIDEState,
} from '../types'
import { countWords, nowIso } from '../utils'
import { FormPanel, TextAreaField, TextField } from './forms'
import { Icon } from './Icon'

export function ChapterEditor(props: {
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
        <button
          type="button"
          className="button-with-icon"
          onClick={() => updateChapter({ summary: summarizeChapter(props.chapter) })}
        >
          <Icon name="sparkles" />
          <span>总结本章</span>
        </button>
        <button type="button" className="button-with-icon" onClick={() => props.onExportChapter('txt')}>
          <Icon name="download" />
          <span>导出 TXT</span>
        </button>
        <button type="button" className="button-with-icon" onClick={() => props.onExportChapter('md')}>
          <Icon name="download" />
          <span>导出 MD</span>
        </button>
        <button
          type="button"
          className="danger-button button-with-icon"
          onClick={() => props.onDeleteChapter(props.chapter.id)}
        >
          <Icon name="trash" />
          <span>删除</span>
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

export function CharacterEditor(props: {
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

export function SettingEditor(props: {
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
