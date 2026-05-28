import type { Setting, WebnovelIDEState } from '../../types'
import { createId, nowIso } from '../../utils'
import { touchState } from './stateHelpers'

export function createSetting(
  state: WebnovelIDEState,
  projectId: string,
  form: Pick<Setting, 'title' | 'category' | 'content' | 'importance'>,
): { state: WebnovelIDEState; settingId: string } {
  const timestamp = nowIso()
  const settingId = createId('setting')

  return {
    state: touchState(
      {
        ...state,
        settings: [
          ...state.settings,
          {
            id: settingId,
            projectId,
            title: form.title,
            category: form.category,
            content: form.content,
            importance: form.importance,
            notes: '',
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      },
      timestamp,
    ),
    settingId,
  }
}

export function renameSetting(
  state: WebnovelIDEState,
  settingId: string,
  title: string,
): WebnovelIDEState {
  const timestamp = nowIso()

  return touchState(
    {
      ...state,
      settings: state.settings.map((setting) =>
        setting.id === settingId ? { ...setting, title, updatedAt: timestamp } : setting,
      ),
    },
    timestamp,
  )
}

export function deleteSetting(state: WebnovelIDEState, settingId: string): WebnovelIDEState {
  return touchState({
    ...state,
    settings: state.settings.filter((setting) => setting.id !== settingId),
    chapterSettings: state.chapterSettings.filter((item) => item.settingId !== settingId),
  })
}
