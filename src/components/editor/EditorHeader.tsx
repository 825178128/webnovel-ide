import type { ChapterStatus } from '../../types'
import { chapterStatusLabels } from '../../constants/labels'

interface EditorHeaderProps {
  title: string
  goal: string
  wordCount: number
  status: ChapterStatus
  onTitleChange: (title: string) => void
  onGoalChange: (goal: string) => void
  onStatusChange: (status: ChapterStatus) => void
}

export function EditorHeader(props: EditorHeaderProps) {
  return (
    <div className="editor-header">
      <div className="editor-header-top">
        <input
          className="editor-title-input"
          type="text"
          value={props.title}
          onChange={(e) => props.onTitleChange(e.target.value)}
          placeholder="章节标题"
        />
        <select
          className="editor-status-select"
          value={props.status}
          onChange={(e) => props.onStatusChange(e.target.value as ChapterStatus)}
        >
          {Object.entries(chapterStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="editor-word-count">{props.wordCount} 字</span>
      </div>
      <textarea
        className="editor-goal-input"
        value={props.goal}
        onChange={(e) => props.onGoalChange(e.target.value)}
        placeholder="本章目标 — 这一章要完成的推进、冲突或情绪目标"
        rows={2}
      />
    </div>
  )
}
