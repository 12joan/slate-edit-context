import { Editor, Node, Point, Range, Transforms, type Descendant } from 'slate'
import { DOMEditor } from './dom-editor'

export const EditContextEditor = {
  toSlatePoint(editor: Editor, offset: number): Point {
    const start = Editor.start(editor, [])
    if (offset === 0) return start

    const point = Editor.after(editor, start, {
      unit: 'character',
      distance: offset,
    })

    if (!point) throw new Error(`Could not resolve point for offset ${offset}`)
    return point
  },

  toOffset(editor: Editor, point: Point): number {
    const fragment = Editor.fragment(editor, {
      anchor: Editor.start(editor, []),
      focus: point,
    })

    return EditContextEditor.string(editor, fragment).length
  },

  string(editor: Editor, nodeOrDescendants: Node | Descendant[]): string {
    if (Array.isArray(nodeOrDescendants)) {
      const nodes = nodeOrDescendants
      if (!nodes.length) return ''

      const [firstNode] = nodes
      const nodesAreBlocks =
        Node.isElement(firstNode) && Editor.isBlock(editor, firstNode)

      return nodes
        .map((node) => EditContextEditor.string(editor, node))
        .join(nodesAreBlocks ? '\n' : '')
    }

    const node = nodeOrDescendants

    return Node.isText(node)
      ? node.text
      : EditContextEditor.string(editor, node.children)
  },

  toSlateRange(editor: Editor, start: number, end: number): Range {
    return {
      anchor: EditContextEditor.toSlatePoint(editor, start),
      focus: EditContextEditor.toSlatePoint(editor, end),
    }
  },

  toOffsetRange(editor: Editor, range: Range): [start: number, end: number] {
    return [
      EditContextEditor.toOffset(editor, range.anchor),
      EditContextEditor.toOffset(editor, range.focus),
    ]
  },
}

export function initEditContext(editor: Editor) {
  const editable = DOMEditor.getEditable(editor)

  const editContext = new EditContext({
    text: EditContextEditor.string(editor, editor),
  })

  editContext.addEventListener('textupdate', (event) => {
    Transforms.insertText(editor, event.text, {
      at: EditContextEditor.toSlateRange(
        editor,
        event.updateRangeStart,
        event.updateRangeEnd
      ),
    })

    Transforms.select(
      editor,
      EditContextEditor.toSlateRange(
        editor,
        event.selectionStart,
        event.selectionEnd
      )
    )
  })

  function handleEditorChange() {
    if (editor.selection) {
      const [start, end] = EditContextEditor.toOffsetRange(
        editor,
        editor.selection
      )

      editContext.updateSelection(start, end)
    }
  }

  editable.editContext = editContext
  editor.changeHandlers.add(handleEditorChange)

  return () => {
    editable.editContext = null
    editor.changeHandlers.delete(handleEditorChange)
  }
}
