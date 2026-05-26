import type { WebnovelIDEState } from './types'
import { createId, nowIso } from './utils'

const STORAGE_KEY = 'webnovel-ide:v1'

export function createInitialState(): WebnovelIDEState {
  const timestamp = nowIso()

  return {
    users: [
      {
        id: 'user_local',
        name: '本地作者',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    projects: [],
    volumes: [],
    chapters: [],
    characters: [],
    settings: [],
    chapterCharacters: [],
    chapterSettings: [],
    aiRequests: [],
  }
}

export function loadState(): WebnovelIDEState {
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return createInitialState()
  }

  try {
    return JSON.parse(raw) as WebnovelIDEState
  } catch {
    return createInitialState()
  }
}

export function saveState(state: WebnovelIDEState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function seedProjectDefaults(state: WebnovelIDEState, projectId: string): WebnovelIDEState {
  const timestamp = nowIso()
  const volumeId = createId('volume')
  const chapterId = createId('chapter')

  return {
    ...state,
    volumes: [
      ...state.volumes,
      {
        id: volumeId,
        projectId,
        title: '第一卷',
        summary: '',
        order: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    chapters: [
      ...state.chapters,
      {
        id: chapterId,
        projectId,
        volumeId,
        title: '第 1 章',
        goal: '',
        summary: '',
        content: '',
        status: 'draft',
        wordCount: 0,
        order: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    activeProjectId: projectId,
    activeChapterId: chapterId,
  }
}
