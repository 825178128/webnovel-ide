import type { WebnovelIDEState } from '../types'
import { createId, nowIso } from '../utils'
import type { StorageAdapter } from './adapters/localStorageAdapter'
import { localStorageAdapter } from './adapters/localStorageAdapter'
import { normalizeState } from './migrations'
import { CURRENT_SCHEMA_VERSION } from './schema'

export function createInitialState(): WebnovelIDEState {
  const timestamp = nowIso()

  return {
    meta: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
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
    aiConfig: {
      provider: 'mock',
      apiKey: '',
      model: 'local-prototype',
      baseUrl: '',
      updatedAt: timestamp,
    },
    appSettings: {
      theme: 'dark',
      editorFont: 'system-ui',
      editorFontSize: 16,
      editorLineHeight: 2,
      updatedAt: timestamp,
    },
  }
}

export function loadState(adapter: StorageAdapter = localStorageAdapter): WebnovelIDEState {
  const raw = adapter.read()

  if (!raw) {
    return createInitialState()
  }

  try {
    return normalizeState(JSON.parse(raw))
  } catch {
    return createInitialState()
  }
}

export function saveState(
  state: WebnovelIDEState,
  adapter: StorageAdapter = localStorageAdapter,
): void {
  adapter.write(
    JSON.stringify({
      ...state,
      meta: {
        ...state.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        updatedAt: nowIso(),
      },
    }),
  )
}

export function resetState(adapter: StorageAdapter = localStorageAdapter): WebnovelIDEState {
  adapter.clear()
  return createInitialState()
}

export function seedProjectDefaults(
  state: WebnovelIDEState,
  projectId: string,
): { state: WebnovelIDEState; volumeId: string; chapterId: string } {
  const timestamp = nowIso()
  const volumeId = createId('volume')
  const chapterId = createId('chapter')

  return {
    state: {
      ...state,
      meta: {
        ...state.meta,
        updatedAt: timestamp,
      },
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
    },
    volumeId,
    chapterId,
  }
}
