import type { WebnovelIDEState } from '../../types'
import { nowIso } from '../../utils'

export function touchState(state: WebnovelIDEState, timestamp = nowIso()): WebnovelIDEState {
  return {
    ...state,
    meta: {
      ...state.meta,
      updatedAt: timestamp,
    },
  }
}
