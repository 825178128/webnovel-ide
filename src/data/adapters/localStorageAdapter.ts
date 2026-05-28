import { STORAGE_KEY } from '../schema'

export interface StorageAdapter {
  read(): string | null
  write(value: string): void
  clear(): void
}

export const localStorageAdapter: StorageAdapter = {
  read() {
    return window.localStorage.getItem(STORAGE_KEY)
  },
  write(value) {
    window.localStorage.setItem(STORAGE_KEY, value)
  },
  clear() {
    window.localStorage.removeItem(STORAGE_KEY)
  },
}
