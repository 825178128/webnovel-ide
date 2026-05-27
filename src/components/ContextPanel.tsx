import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import { aiTaskLabels, chapterStatusLabels } from '../constants/labels'
import { buildMockAIResult } from '../services/aiMock'
import { toggleChapterCharacter, toggleChapterSetting } from '../services/stateRelations'
import type { AITaskType, Chapter, ChapterStatus, Character, Project, Setting, WebnovelIDEState } from '../types'
import { countWords, createId, nowIso } from '../utils'

export function ContextPanel(props: {
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
          provider: props.state.aiConfig?.provider ?? 'mock',
          model: props.state.aiConfig?.model ?? 'local-prototype',
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

  function updateChapter(patch: Partial<Chapter>) {
    if (!props.chapter) return
    props.onPatchState((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === props.chapter?.id ? { ...chapter, ...patch, updatedAt: nowIso() } : chapter,
      ),
    }))
  }

  return (
    <aside className="context-panel">
      <section>
        <h2>当前章节</h2>
        {props.chapter ? (
          <div className="context-card chapter-inspector">
            <label className="field-block">
              章节标题
              <input
                value={props.chapter.title}
                onChange={(event) => updateChapter({ title: event.target.value })}
              />
            </label>
            <label className="field-block">
              状态
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
            </label>
            <label className="field-block">
              本章目标
              <textarea
                value={props.chapter.goal ?? ''}
                onChange={(event) => updateChapter({ goal: event.target.value })}
                placeholder="这一章要完成的推进、冲突或情绪目标"
              />
            </label>
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
        <div className="ai-panel-header">
          <div>
            <h2>
              <Icon name="sparkles" />
              <span>AI 助手</span>
            </h2>
            <p className="muted">当前模型：{props.state.aiConfig?.model ?? 'local-prototype'}</p>
          </div>
          <span>Copilot</span>
        </div>
        <label className="field-block">
          任务
        <select value={taskType} onChange={(event) => setTaskType(event.target.value as AITaskType)}>
          {Object.entries(aiTaskLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        </label>
        <label className="field-block">
          指令
        <textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="补充你的指令..."
        />
        </label>
        <button className="primary-button" onClick={generateMockAI} disabled={!props.chapter}>
          <Icon name="sparkles" />
          <span>生成模拟结果</span>
        </button>
        <div className="ai-output-block">
          <div className="ai-output-title">
            <span>输出</span>
            <button className="button-with-icon" onClick={insertResult} disabled={!result}>
              <Icon name="file" />
              <span>插入正文</span>
            </button>
          </div>
          <div className="ai-result">{result || 'AI 输出会显示在这里。'}</div>
        </div>
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
