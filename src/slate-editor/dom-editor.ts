import { Editor, Path, Range } from 'slate'

import DOMNode = globalThis.Node
import DOMElement = globalThis.Element
import DOMText = globalThis.Text
import DOMRange = globalThis.Range
import DOMStaticRange = globalThis.StaticRange
import DOMSelection = globalThis.Selection
export { DOMNode, DOMElement, DOMText, DOMRange, DOMSelection }

export const EDITOR_TO_ELEMENT = new WeakMap<Editor, HTMLElement>()

export const DOMEditor = {
  setEditable(editor: Editor, editable: HTMLElement | null) {
    if (editable) {
      EDITOR_TO_ELEMENT.set(editor, editable)
    } else {
      EDITOR_TO_ELEMENT.delete(editor)
    }
  },

  getEditable(editor: Editor): HTMLElement {
    const editable = EDITOR_TO_ELEMENT.get(editor)
    if (!editable) throw new Error('Could not get element for editor')
    return editable
  },

  toSlateRange(
    editor: Editor,
    domRange: DOMSelection | DOMStaticRange
  ): Range | null {
    const { anchorNode, anchorOffset, focusNode, focusOffset } =
      domRange instanceof window.Selection
        ? domRange
        : {
            anchorNode: domRange.endContainer,
            anchorOffset: domRange.startOffset,
            focusNode: domRange.endContainer,
            focusOffset: domRange.endOffset,
          }
    if (!anchorNode || !focusNode) return null

    const anchorPath = DOMEditor.toSlatePath(editor, anchorNode)
    const focusPath = DOMEditor.toSlatePath(editor, focusNode)
    if (!anchorPath || !focusPath) return null

    return {
      anchor: { path: anchorPath, offset: anchorOffset },
      focus: { path: focusPath, offset: focusOffset },
    }
  },

  toSlatePath(editor: Editor, node: DOMNode): Path | null {
    if (!(node instanceof window.Text)) return null

    const editable = DOMEditor.getEditable(editor)
    if (!editable.contains(node)) return null

    const textNodeEl = node.parentElement
    if (!textNodeEl) return null

    const pathString = textNodeEl.getAttribute('data-slate-path')
    if (!pathString) return null

    return JSON.parse(pathString)
  },

  toDOMText(editor: Editor, path: Path): DOMText {
    const editable = DOMEditor.getEditable(editor)

    const domNode = editable.querySelector(
      `[data-slate-path="${JSON.stringify(path)}"]`
    )?.firstChild

    if (!domNode || !(domNode instanceof window.Text))
      throw new Error(
        `Could not get text node for path: ${JSON.stringify(path)}`
      )

    return domNode
  },
}
