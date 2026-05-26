import type { AITaskType, Chapter } from '../types'
import { summarizeChapter } from './chapterTools'

export function buildMockAIResult(
  taskType: AITaskType,
  chapter: Chapter,
  instruction: string,
): string {
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
