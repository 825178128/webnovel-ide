import type { Chapter } from '../types'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function summarizeChapter(chapter: Chapter): string {
  const text = stripHtml(chapter.content)
  if (!text) {
    return '本章尚未写入正文。'
  }

  const compact = text.replace(/\s+/g, ' ')
  return compact.length > 120 ? `${compact.slice(0, 120)}...` : compact
}
