import type { WebnovelIDEState } from '../types'
import { nowIso } from '../utils'

export function toggleChapterCharacter(
  state: WebnovelIDEState,
  chapterId: string,
  characterId: string,
): WebnovelIDEState {
  const exists = state.chapterCharacters.some(
    (item) => item.chapterId === chapterId && item.characterId === characterId,
  )

  return {
    ...state,
    chapterCharacters: exists
      ? state.chapterCharacters.filter(
          (item) => !(item.chapterId === chapterId && item.characterId === characterId),
        )
      : [...state.chapterCharacters, { chapterId, characterId, createdAt: nowIso() }],
  }
}

export function toggleChapterSetting(
  state: WebnovelIDEState,
  chapterId: string,
  settingId: string,
): WebnovelIDEState {
  const exists = state.chapterSettings.some(
    (item) => item.chapterId === chapterId && item.settingId === settingId,
  )

  return {
    ...state,
    chapterSettings: exists
      ? state.chapterSettings.filter((item) => !(item.chapterId === chapterId && item.settingId === settingId))
      : [...state.chapterSettings, { chapterId, settingId, createdAt: nowIso() }],
  }
}
