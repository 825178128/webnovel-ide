import type { Project, WebnovelIDEState } from '../../types'
import { createId, nowIso } from '../../utils'
import { seedProjectDefaults } from '../store'
import { touchState } from './stateHelpers'

export function createProject(
  state: WebnovelIDEState,
  form: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>,
): { state: WebnovelIDEState; projectId: string; firstChapterId: string } {
  const timestamp = nowIso()
  const projectId = createId('project')
  const withProject = touchState(
    {
      ...state,
      projects: [
        ...state.projects,
        {
          id: projectId,
          userId: 'user_local',
          title: form.title,
          genre: form.genre,
          synopsis: form.synopsis,
          targetPlatform: form.targetPlatform,
          status: 'writing',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    },
    timestamp,
  )
  const seeded = seedProjectDefaults(withProject, projectId)

  return {
    state: seeded.state,
    projectId,
    firstChapterId: seeded.chapterId,
  }
}
