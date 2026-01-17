import { useSyncExternalStore } from 'react'
import type { Editor } from 'slate'

export function useEditorChildren(editor: Editor) {
  return useSyncExternalStore(
    (onChange) => {
      editor.changeHandlers.add(onChange)
      return () => editor.changeHandlers.delete(onChange)
    },
    () => editor.children
  )
}
