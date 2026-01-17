import { type ReactNode, Fragment, type HTMLAttributes, useEffect } from 'react'
import {
  Editor,
  type Descendant,
  Path,
  Node,
  Transforms,
  Text,
  Element,
} from 'slate'
import { useEditorChildren } from './hooks'
import { initEditContext } from './edit-context'
import { DOMEditor } from './dom-editor'

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

      return (
        <Fragment key={index}>
          {renderLeaf({
            editor,
            leaf: descendant,
            attributes: {
              'data-slate-path': JSON.stringify([...parentPath, index]),
            } as HTMLAttributes<HTMLElement>,
            children: descendant.text,
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

    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
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
