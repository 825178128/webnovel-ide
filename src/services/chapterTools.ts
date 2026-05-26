import type { Chapter } from '../types'

export function summarizeChapter(chapter: Chapter): string {
  if (!chapter.content.trim()) {
    return '本章尚未写入正文。'
  }

  const compact = chapter.content.replace(/\s+/g, ' ').trim()
  return compact.length > 120 ? `${compact.slice(0, 120)}...` : compact
}
