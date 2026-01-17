import type { Editor } from 'slate'

export function withEditContext(editor: Editor): Editor {
  const { onChange } = editor

  editor.changeHandlers = new Set()

  editor.onChange = (options) => {
    onChange(options)

    for (const handler of editor.changeHandlers) {
      handler()
    }
  }

  return editor
}
