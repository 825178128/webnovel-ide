export type ProjectStatus = 'planning' | 'writing' | 'paused' | 'completed' | 'archived'

export type ChapterStatus = 'draft' | 'writing' | 'revision' | 'completed'

export type SettingCategory =
  | 'world'
  | 'faction'
  | 'power_system'
  | 'item'
  | 'location'
  | 'rule'
  | 'other'

export type SettingImportance = 'low' | 'medium' | 'high'

export type AITaskType = 'continue' | 'polish' | 'summarize' | 'rewrite'

export type AIRequestStatus = 'pending' | 'running' | 'succeeded' | 'failed'

export interface AIConfig {
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
  updatedAt?: string
}

export interface User {
  id: string
  name?: string
  email?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  userId: string
  title: string
  genre?: string
  synopsis?: string
  targetPlatform?: string
  targetWordCount?: number
  dailyWordTarget?: number
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface Volume {
  id: string
  projectId: string
  title: string
  summary?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Chapter {
  id: string
  projectId: string
  volumeId: string
  title: string
  goal?: string
  summary?: string
  content: string
  status: ChapterStatus
  wordCount: number
  order: number
  createdAt: string
  updatedAt: string
}

export interface Character {
  id: string
  projectId: string
  name: string
  role?: string
  faction?: string
  personality?: string
  desire?: string
  abilities?: string
  speechStyle?: string
  currentState?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Setting {
  id: string
  projectId: string
  title: string
  category: SettingCategory
  content: string
  importance: SettingImportance
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ChapterCharacter {
  chapterId: string
  characterId: string
  roleInChapter?: string
  createdAt: string
}

export interface ChapterSetting {
  chapterId: string
  settingId: string
  usageNote?: string
  createdAt: string
}

export interface AIRequest {
  id: string
  userId: string
  projectId: string
  chapterId?: string
  taskType: AITaskType
  instruction?: string
  inputSnapshot: string
  output?: string
  provider?: string
  model?: string
  status: AIRequestStatus
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export interface WebnovelIDEState {
  users: User[]
  projects: Project[]
  volumes: Volume[]
  chapters: Chapter[]
  characters: Character[]
  settings: Setting[]
  chapterCharacters: ChapterCharacter[]
  chapterSettings: ChapterSetting[]
  aiRequests: AIRequest[]
  aiConfig?: AIConfig
  activeProjectId?: string
  activeChapterId?: string
}
