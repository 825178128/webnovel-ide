import type { AIRequest, WebnovelIDEState } from '../../types'
import { createId, nowIso } from '../../utils'
import { touchState } from './stateHelpers'

export function recordSucceededAIRequest(
  state: WebnovelIDEState,
  request: Omit<AIRequest, 'id' | 'userId' | 'status' | 'createdAt' | 'completedAt'>,
): WebnovelIDEState {
  const timestamp = nowIso()

  return touchState(
    {
      ...state,
      aiRequests: [
        ...state.aiRequests,
        {
          ...request,
          id: createId('ai'),
          userId: 'user_local',
          status: 'succeeded',
          createdAt: timestamp,
          completedAt: timestamp,
        },
      ],
    },
    timestamp,
  )
}
