import type { Chapter, Project, Volume } from '../types'

export type ExportFormat = 'txt' | 'md'

function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function buildChapterExport(chapter: Chapter, format: ExportFormat): string {
  const text = plainText(chapter.content)

  if (format === 'md') {
    return `# ${chapter.title}\n\n${text}\n`
  }

  return `${chapter.title}\n\n${text}\n`
}

export function buildBookExport(
  project: Project,
  volumes: Volume[],
  chapters: Chapter[],
  format: ExportFormat,
): string {
  const sections = volumes
    .map((volume) => {
      const volumeChapters = chapters
        .filter((chapter) => chapter.volumeId === volume.id)

      const chapterText = volumeChapters
        .map((chapter) => buildChapterExport(chapter, format))
        .join('\n\n')

      if (format === 'md') {
        return `# ${volume.title}\n\n${chapterText}`
      }

      return `${volume.title}\n\n${chapterText}`
    })
    .join('\n\n')

  if (format === 'md') {
    return `# ${project.title}\n\n${sections}\n`
  }

  return `${project.title}\n\n${sections}\n`
}
