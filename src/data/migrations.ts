import type { AppSettings, DataStoreMeta, WebnovelIDEState } from '../types'
import { nowIso } from '../utils'
import { CURRENT_SCHEMA_VERSION } from './schema'

type LegacyState = Omit<WebnovelIDEState, 'meta'> & {
  meta?: DataStoreMeta
  appSettings?: AppSettings
  activeProjectId?: string
  activeChapterId?: string
}

function createDefaultMeta(timestamp: string): DataStoreMeta {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function normalizeState(rawState: LegacyState): WebnovelIDEState {
  const timestamp = nowIso()
  const meta = rawState.meta
    ? {
        ...rawState.meta,
        schemaVersion: rawState.meta.schemaVersion || CURRENT_SCHEMA_VERSION,
        updatedAt: timestamp,
      }
    : createDefaultMeta(timestamp)

  return {
    ...rawState,
    meta,
    users: rawState.users ?? [],
    projects: rawState.projects ?? [],
    volumes: rawState.volumes ?? [],
    chapters: rawState.chapters ?? [],
    characters: rawState.characters ?? [],
    settings: rawState.settings ?? [],
    chapterCharacters: rawState.chapterCharacters ?? [],
    chapterSettings: rawState.chapterSettings ?? [],
    aiRequests: rawState.aiRequests ?? [],
    aiConfig: rawState.aiConfig ?? {
      provider: 'mock',
      apiKey: '',
      model: 'local-prototype',
      baseUrl: '',
      updatedAt: timestamp,
    },
    appSettings: rawState.appSettings ?? {
      theme: 'dark',
      updatedAt: timestamp,
    },
  }
}
