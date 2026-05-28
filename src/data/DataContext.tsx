import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import type { WebnovelIDEState } from '../types'
import { loadState as loadDataState, saveState as saveDataState } from './store'

const DataContext = createContext<{
  state: WebnovelIDEState
  patchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
} | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    (prev: WebnovelIDEState, updater: (prev: WebnovelIDEState) => WebnovelIDEState) => updater(prev),
    undefined!,
    () => loadDataState(),
  )
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDataState(state), 500)
    return () => clearTimeout(saveTimer.current)
  }, [state])

  return (
    <DataContext.Provider value={{ state, patchState: dispatch }}>
      {children}
    </DataContext.Provider>
  )
}

export function useDataStore() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataStore must be inside DataProvider')
  return ctx
}
