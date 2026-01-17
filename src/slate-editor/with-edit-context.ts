import type { Editor } from 'slate'

export function withEditContext(editor: Editor): Editor {
  const { onChange, apply } = editor

  editor.editContext = new EditContext()
  editor.changeHandlers = new Set()

  editor.onChange = (options) => {
    onChange(options)

    for (const handler of editor.changeHandlers) {
      handler()
    }
  }

  editor.apply = (operation) => {
    console.log(operation)
    apply(operation)
  }

  return editor
}
