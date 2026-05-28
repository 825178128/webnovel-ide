import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import { aiTaskLabels, chapterStatusLabels } from '../constants/labels'
import { recordSucceededAIRequest } from '../data/repositories/aiRepository'
import { appendChapterContent, updateChapter as updateChapterRecord } from '../data/repositories/chapterRepository'
import { useDataStore } from '../data/DataContext'
import { buildMockAIResult } from '../services/aiMock'
import { toggleChapterCharacter, toggleChapterSetting } from '../data/repositories/relationRepository'
import type { AITaskType, Chapter, ChapterStatus, Character, Project, Setting } from '../types'

type ContextPanelTab = 'properties' | 'context' | 'ai'
type ContextPanelView = 'chapter' | 'character' | 'setting'

export function ContextPanel(props: {
  project: Project
  mainView: ContextPanelView
  chapter?: Chapter
  character?: Character
  setting?: Setting
  characters: Character[]
  settings: Setting[]
}) {
  const { state, patchState } = useDataStore()
  const [activeTab, setActiveTab] = useState<ContextPanelTab>('properties')
  const [taskType, setTaskType] = useState<AITaskType>('continue')
  const [instruction, setInstruction] = useState('')
  const [result, setResult] = useState('')

  const relatedCharacters = useMemo(() => {
    if (!props.chapter) return []
    const ids = state.chapterCharacters
      .filter((item) => item.chapterId === props.chapter?.id)
      .map((item) => item.characterId)
    return props.characters.filter((character) => ids.includes(character.id))
  }, [props.chapter, props.characters, state.chapterCharacters])

  const relatedSettings = useMemo(() => {
    if (!props.chapter) return []
    const ids = state.chapterSettings
      .filter((item) => item.chapterId === props.chapter?.id)
      .map((item) => item.settingId)
    return props.settings.filter((setting) => ids.includes(setting.id))
  }, [props.chapter, props.settings, state.chapterSettings])

  function generateMockAI() {
    if (!props.chapter) return
    const output = buildMockAIResult(taskType, props.chapter, instruction)

    patchState((current) =>
      recordSucceededAIRequest(current, {
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
        provider: state.aiConfig?.provider ?? 'mock',
        model: state.aiConfig?.model ?? 'local-prototype',
      }),
    )
    setResult(output)
  }

  function insertResult() {
    if (!props.chapter || !result) return

    patchState((current) => appendChapterContent(current, props.chapter!.id, result))
  }

  function updateChapter(patch: Partial<Chapter>) {
    if (!props.chapter) return
    patchState((current) => updateChapterRecord(current, props.chapter!.id, patch))
  }

  const assistantTitle =
    props.mainView === 'chapter' ? '章节助手' : props.mainView === 'character' ? '人物助手' : '资料助手'
  const assistantDescription =
    props.mainView === 'chapter'
      ? '基于当前章节和上下文生成辅助内容'
      : props.mainView === 'character'
        ? '人物视图下保留后续角色分析、口吻检查和关系建议入口'
        : '资料视图下保留后续设定一致性、规则冲突和补全建议入口'

  return (
    <aside className="context-panel">
      <div className="context-tabs" role="tablist" aria-label="右侧面板">
        <button
          className={activeTab === 'properties' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'properties'}
          onClick={() => setActiveTab('properties')}
        >
          属性
        </button>
        <button
          className={activeTab === 'context' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'context'}
          onClick={() => setActiveTab('context')}
        >
          上下文
        </button>
        <button
          className={activeTab === 'ai' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'ai'}
          onClick={() => setActiveTab('ai')}
        >
          AI
        </button>
      </div>

      <div className="context-panel-body">
        {activeTab === 'properties' && (
          <section>
            <h2>
              {props.mainView === 'chapter' && '当前章节'}
              {props.mainView === 'character' && '当前人物'}
              {props.mainView === 'setting' && '当前资料'}
            </h2>
            {props.mainView === 'chapter' && props.chapter ? (
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
              <>
                {props.mainView === 'chapter' && <p className="muted">未选择章节</p>}
                {props.mainView === 'character' && (
                  <div className="context-card entity-inspector">
                    <strong>{props.character?.name ?? '未选择人物'}</strong>
                    <p>{props.character?.role || '尚未填写身份'}</p>
                    <small>{props.character?.faction || '暂无阵营/势力'}</small>
                  </div>
                )}
                {props.mainView === 'setting' && (
                  <div className="context-card entity-inspector">
                    <strong>{props.setting?.title ?? '未选择资料'}</strong>
                    <p>{props.setting?.content || '尚未填写资料内容'}</p>
                    <small>资料详情在主编辑区维护</small>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'context' && (
          <>
            {props.mainView === 'chapter' ? (
              <>
                <section>
                  <h2>相关人物</h2>
                  <RelationPicker
                    items={props.characters}
                    activeIds={relatedCharacters.map((character) => character.id)}
                    getLabel={(character) => character.name}
                    onToggle={(characterId) => {
                      if (!props.chapter) return
                      patchState((current) => toggleChapterCharacter(current, props.chapter!.id, characterId))
                    }}
                  />
                </section>

                <section>
                  <h2>相关资料</h2>
                  <RelationPicker
                    items={props.settings}
                    activeIds={relatedSettings.map((setting) => setting.id)}
                    getLabel={(setting) => setting.title}
                    onToggle={(settingId) => {
                      if (!props.chapter) return
                      patchState((current) => toggleChapterSetting(current, props.chapter!.id, settingId))
                    }}
                  />
                </section>
              </>
            ) : (
              <section>
                <h2>上下文</h2>
                <div className="context-card entity-inspector">
                  <strong>后续联动入口</strong>
                  <p>这里会承载角色关系、出场章节、设定引用和一致性检查。</p>
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'ai' && (
          <section className="ai-panel">
            <div className="ai-panel-header">
              <div>
                <h2>
                  <Icon name="sparkles" />
                  <span>{assistantTitle}</span>
                </h2>
                <p className="muted">{assistantDescription}</p>
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
            <button className="primary-button" onClick={generateMockAI} disabled={props.mainView !== 'chapter' || !props.chapter}>
              <Icon name="sparkles" />
              <span>生成模拟结果</span>
            </button>
            <div className="ai-output-block">
              <div className="ai-output-title">
                <span>输出</span>
                <button className="button-with-icon" onClick={insertResult} disabled={props.mainView !== 'chapter' || !result}>
                  <Icon name="file" />
                  <span>插入正文</span>
                </button>
              </div>
              <div className="ai-result">{result || 'AI 输出会显示在这里。'}</div>
            </div>
          </section>
        )}
      </div>
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
