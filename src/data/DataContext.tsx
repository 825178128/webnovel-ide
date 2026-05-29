import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react'
import type { WebnovelIDEState } from '../types'
import { loadState as loadDataState, saveState as saveDataState } from './store'

const DataContext = createContext<{
  state: WebnovelIDEState
  patchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
  isSaving: boolean
} | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    (prev: WebnovelIDEState, updater: (prev: WebnovelIDEState) => WebnovelIDEState) => updater(prev),
    undefined!,
    () => loadDataState(),
  )
  const [isSaving, setIsSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(saveTimer.current)
    setIsSaving(true)
    saveTimer.current = setTimeout(() => {
      saveDataState(state)
      setIsSaving(false)
      saveTimer.current = undefined
    }, 500)
    return () => clearTimeout(saveTimer.current)
  }, [state])

  return (
    <DataContext.Provider value={{ state, patchState: dispatch, isSaving }}>
      {children}
    </DataContext.Provider>
  )
}

export function useDataStore() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataStore must be inside DataProvider')
  return ctx
}
