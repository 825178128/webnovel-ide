import type { Chapter, Volume, WebnovelIDEState } from '../../types'
import { countWords, createId, nowIso } from '../../utils'
import { touchState } from './stateHelpers'

export function createVolume(
  state: WebnovelIDEState,
  projectId: string,
  form: Pick<Volume, 'title' | 'summary'>,
): { state: WebnovelIDEState; volumeId: string } {
  const timestamp = nowIso()
  const volumeId = createId('volume')
  const projectVolumes = state.volumes.filter((volume) => volume.projectId === projectId)

  return {
    state: touchState(
      {
        ...state,
        volumes: [
          ...state.volumes,
          {
            id: volumeId,
            projectId,
            title: form.title,
            summary: form.summary,
            order: projectVolumes.length + 1,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      },
      timestamp,
    ),
    volumeId,
  }
}

export function createChapter(
  state: WebnovelIDEState,
  projectId: string,
  volumeId: string,
  form: Pick<Chapter, 'title' | 'goal'>,
): { state: WebnovelIDEState; chapterId: string } {
  const timestamp = nowIso()
  const chapterId = createId('chapter')
  const chaptersInVolume = state.chapters.filter((chapter) => chapter.volumeId === volumeId)
  const nextOrder = Math.max(0, ...chaptersInVolume.map((chapter) => chapter.order)) + 1

  return {
    state: touchState(
      {
        ...state,
        chapters: [
          ...state.chapters,
          {
            id: chapterId,
            projectId,
            volumeId,
            title: form.title,
            goal: form.goal,
            summary: '',
            content: '',
            status: 'draft',
            wordCount: 0,
            order: nextOrder,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      },
      timestamp,
    ),
    chapterId,
  }
}

export function renameVolume(
  state: WebnovelIDEState,
  volumeId: string,
  title: string,
): WebnovelIDEState {
  const timestamp = nowIso()

  return touchState(
    {
      ...state,
      volumes: state.volumes.map((volume) =>
        volume.id === volumeId ? { ...volume, title, updatedAt: timestamp } : volume,
      ),
    },
    timestamp,
  )
}

export function deleteVolume(state: WebnovelIDEState, volumeId: string): WebnovelIDEState {
  const chapterIds = state.chapters
    .filter((chapter) => chapter.volumeId === volumeId)
    .map((chapter) => chapter.id)

  return touchState({
    ...state,
    volumes: state.volumes.filter((volume) => volume.id !== volumeId),
    chapters: state.chapters.filter((chapter) => !chapterIds.includes(chapter.id)),
    chapterCharacters: state.chapterCharacters.filter((item) => !chapterIds.includes(item.chapterId)),
    chapterSettings: state.chapterSettings.filter((item) => !chapterIds.includes(item.chapterId)),
    aiRequests: state.aiRequests.filter((item) => !item.chapterId || !chapterIds.includes(item.chapterId)),
  })
}

export function renameChapter(
  state: WebnovelIDEState,
  chapterId: string,
  title: string,
): WebnovelIDEState {
  return updateChapter(state, chapterId, { title })
}

export function updateChapter(
  state: WebnovelIDEState,
  chapterId: string,
  patch: Partial<Chapter>,
): WebnovelIDEState {
  const timestamp = nowIso()

  return touchState(
    {
      ...state,
      chapters: state.chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              ...patch,
              wordCount:
                typeof patch.content === 'string' ? countWords(patch.content) : chapter.wordCount,
              updatedAt: timestamp,
            }
          : chapter,
      ),
    },
    timestamp,
  )
}

export function appendChapterContent(
  state: WebnovelIDEState,
  chapterId: string,
  content: string,
): WebnovelIDEState {
  const chapter = state.chapters.find((item) => item.id === chapterId)
  if (!chapter) return state

  const nextContent = `${chapter.content}${chapter.content ? '\n\n' : ''}${content}`
  return updateChapter(state, chapterId, { content: nextContent })
}

export function reorderChapter(
  state: WebnovelIDEState,
  sourceChapterId: string,
  targetChapterId: string,
): WebnovelIDEState {
  if (sourceChapterId === targetChapterId) return state

  const source = state.chapters.find((item) => item.id === sourceChapterId)
  const target = state.chapters.find((item) => item.id === targetChapterId)
  if (!source || !target || source.volumeId !== target.volumeId) return state

  const timestamp = nowIso()
  const siblings = state.chapters.filter((item) => item.volumeId === source.volumeId)
  const ordered = siblings.filter((item) => item.id !== sourceChapterId)
  const targetIndex = ordered.findIndex((item) => item.id === targetChapterId)
  ordered.splice(targetIndex, 0, source)

  const reorderedSiblings = ordered.map((item, index) => ({
    ...item,
    order: index + 1,
    updatedAt: timestamp,
  }))
  const firstSiblingIndex = state.chapters.findIndex((item) => item.volumeId === source.volumeId)
  const nextChapters = state.chapters.filter((item) => item.volumeId !== source.volumeId)
  nextChapters.splice(firstSiblingIndex, 0, ...reorderedSiblings)

  return touchState(
    {
      ...state,
      chapters: nextChapters,
    },
    timestamp,
  )
}

export function deleteChapter(state: WebnovelIDEState, chapterId: string): WebnovelIDEState {
  return touchState({
    ...state,
    chapters: state.chapters.filter((item) => item.id !== chapterId),
    chapterCharacters: state.chapterCharacters.filter((item) => item.chapterId !== chapterId),
    chapterSettings: state.chapterSettings.filter((item) => item.chapterId !== chapterId),
    aiRequests: state.aiRequests.filter((item) => item.chapterId !== chapterId),
  })
}
