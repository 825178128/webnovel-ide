import type { Chapter, Project, Volume } from '../types'

export type ExportFormat = 'txt' | 'md'

export function buildChapterExport(chapter: Chapter, format: ExportFormat): string {
  if (format === 'md') {
    return `# ${chapter.title}\n\n${chapter.content.trim()}\n`
  }

  return `${chapter.title}\n\n${chapter.content.trim()}\n`
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
