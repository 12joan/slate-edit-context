import { type ReactNode, Fragment, type HTMLAttributes, useEffect } from 'react'
import {
  Editor,
  type Descendant,
  Path,
  Node,
  Transforms,
  Text,
  Element,
  Range,
} from 'slate'
import { useEditorChildren } from './hooks'
import { initEditContext } from './edit-context'
import { DOMEditor } from './dom-editor'
import { HistoryEditor } from 'slate-history'
import { Hotkeys } from 'slate-dom'

export interface RenderLeafProps {
  editor: Editor
  leaf: Text
  attributes: HTMLAttributes<HTMLElement>
  children: ReactNode
}

export interface RenderElementProps<T extends Element = Element> {
  editor: Editor
  element: T
  attributes: HTMLAttributes<HTMLElement>
  children: ReactNode
}

export function Editable({
  editor,
  renderElement,
  renderLeaf,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  editor: Editor
  renderElement(props: RenderElementProps): ReactNode
  renderLeaf(props: RenderLeafProps): ReactNode
}) {
  const editorChildren = useEditorChildren(editor)

  function callbackRef(editable: HTMLElement | null) {
    DOMEditor.setEditable(editor, editable)
  }

  function renderDescendants(
    descendants: Descendant[],
    parentPath: Path = []
  ): ReactNode {
    return descendants.map((descendant, index) => {
      if (Node.isElement(descendant)) {
        return (
          <Fragment key={index}>
            {renderElement({
              editor,
              element: descendant,
              attributes: {},
              children: renderDescendants(descendant.children, [
                ...parentPath,
                index,
              ]),
            })}
          </Fragment>
        )
      }

      let { text } = descendant
      if (text.endsWith('\n')) text += '\n'
      text ||= '\n'

      return (
        <Fragment key={index}>
          {renderLeaf({
            editor,
            leaf: descendant,
            attributes: {
              'data-slate-path': JSON.stringify([...parentPath, index]),
            } as HTMLAttributes<HTMLElement>,
            children: text,
          })}
        </Fragment>
      )
    })
  }

  useEffect(() => {
    return initEditContext(editor)
  }, [editor])

  useEffect(() => {
    function handleSelectionChange() {
      const domSelection = document.getSelection()
      if (!domSelection) return
      const selection = DOMEditor.toSlateRange(editor, domSelection)
      if (!selection) return
      Transforms.select(editor, selection)
    }

    function handleBeforeInput(event: InputEvent) {
      const inputType = event.inputType as InputEventType
      console.log(inputType, event)

      if (
        editor.selection &&
        Range.isExpanded(editor.selection) &&
        inputType.startsWith('delete')
      ) {
        Editor.deleteFragment(editor, {
          direction: inputType.endsWith('Backward') ? 'backward' : 'forward',
        })
        return
      }

      switch (inputType) {
        case 'insertParagraph':
          event.preventDefault()
          Editor.insertBreak(editor)
          break

        case 'insertLineBreak':
          event.preventDefault()
          Editor.insertText(editor, '\n')
          break

        case 'insertFromDrop': {
          event.preventDefault()

          const text = event.dataTransfer?.getData('text/plain')
          if (!text) break

          const [domRange] = event.getTargetRanges()
          const slateRange = DOMEditor.toSlateRange(editor, domRange)
          if (!slateRange) break
          Transforms.select(editor, slateRange)

          Editor.insertText(editor, text)
          break
        }

        case 'deleteWordBackward':
          event.preventDefault()
          Editor.deleteBackward(editor, { unit: 'word' })
          break

        case 'deleteWordForward':
          event.preventDefault()
          Editor.deleteForward(editor, { unit: 'word' })
          break

        case 'deleteSoftLineBackward':
          event.preventDefault()
          Editor.deleteBackward(editor, { unit: 'line' })
          break

        case 'deleteSoftLineForward':
          event.preventDefault()
          Editor.deleteForward(editor, { unit: 'line' })
          break

        case 'deleteEntireSoftLine':
          event.preventDefault()
          Editor.deleteBackward(editor, { unit: 'line' })
          Editor.deleteForward(editor, { unit: 'line' })
          break

        case 'deleteHardLineBackward':
          event.preventDefault()
          Editor.deleteBackward(editor, { unit: 'block' })
          break

        case 'deleteHardLineForward':
          event.preventDefault()
          Editor.deleteForward(editor, { unit: 'block' })
          break

        case 'deleteContentBackward':
          event.preventDefault()
          Editor.deleteBackward(editor)
          break

        case 'deleteContent':
        case 'deleteContentForward':
          event.preventDefault()
          Editor.deleteForward(editor)
          break

        case 'deleteByDrag':
        case 'deleteByCut':
          event.preventDefault()
          Editor.deleteFragment(editor)
          break

        case 'historyUndo':
          event.preventDefault()
          HistoryEditor.undo(editor)
          break

        case 'historyRedo':
          event.preventDefault()
          HistoryEditor.redo(editor)
          break
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (Hotkeys.isUndo(event)) {
        event.preventDefault()
        HistoryEditor.undo(editor)
        return
      }

      if (Hotkeys.isRedo(event)) {
        event.preventDefault()
        HistoryEditor.redo(editor)
        return
      }
    }

    function handlePaste(event: ClipboardEvent) {
      event.preventDefault()

      const text = event.clipboardData?.getData('text/plain')
      if (!text) return

      const lines = text.split(/\r\n|\r|\n/)
      let split = false

      for (const line of lines) {
        if (split) {
          Transforms.splitNodes(editor, { always: true })
        }

        Editor.insertText(editor, line)
        split = true
      }
    }

    const editable = DOMEditor.getEditable(editor)
    document.addEventListener('selectionchange', handleSelectionChange)
    editable.addEventListener('beforeinput', handleBeforeInput)
    editable.addEventListener('keydown', handleKeyDown)
    editable.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      editable.removeEventListener('beforeinput', handleBeforeInput)
      editable.removeEventListener('keydown', handleKeyDown)
      editable.removeEventListener('paste', handlePaste)
    }
  }, [editor])

  useEffect(() => {
    if (!editor.selection) return
    const { anchor, focus } = editor.selection

    const anchorNode = DOMEditor.toDOMText(editor, anchor.path)
    const focusNode = DOMEditor.toDOMText(editor, focus.path)

    document
      .getSelection()
      ?.setBaseAndExtent(anchorNode, anchor.offset, focusNode, focus.offset)
  }, [editor, editor.selection])

  return (
    <div {...props} ref={callbackRef}>
      {renderDescendants(editorChildren)}
    </div>
  )
}
