import { useMemo, useState } from 'react'
import { aiTaskLabels, chapterStatusLabels } from '../constants/labels'
import { buildMockAIResult } from '../services/aiMock'
import { toggleChapterCharacter, toggleChapterSetting } from '../services/stateRelations'
import type { AITaskType, Chapter, Character, Project, Setting, WebnovelIDEState } from '../types'
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
