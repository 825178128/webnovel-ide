import type { Character, WebnovelIDEState } from '../../types'
import { createId, nowIso } from '../../utils'
import { touchState } from './stateHelpers'

export function createCharacter(
  state: WebnovelIDEState,
  projectId: string,
  form: Pick<Character, 'name' | 'role' | 'faction'>,
): { state: WebnovelIDEState; characterId: string } {
  const timestamp = nowIso()
  const characterId = createId('character')

  return {
    state: touchState(
      {
        ...state,
        characters: [
          ...state.characters,
          {
            id: characterId,
            projectId,
            name: form.name,
            role: form.role,
            faction: form.faction,
            personality: '',
            desire: '',
            abilities: '',
            speechStyle: '',
            currentState: '',
            notes: '',
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      },
      timestamp,
    ),
    characterId,
  }
}

export function renameCharacter(
  state: WebnovelIDEState,
  characterId: string,
  name: string,
): WebnovelIDEState {
  const timestamp = nowIso()

  return touchState(
    {
      ...state,
      characters: state.characters.map((character) =>
        character.id === characterId ? { ...character, name, updatedAt: timestamp } : character,
      ),
    },
    timestamp,
  )
}

export function deleteCharacter(state: WebnovelIDEState, characterId: string): WebnovelIDEState {
  return touchState({
    ...state,
    characters: state.characters.filter((character) => character.id !== characterId),
    chapterCharacters: state.chapterCharacters.filter((item) => item.characterId !== characterId),
  })
}
