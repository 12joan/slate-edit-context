import { useState, type ReactElement } from 'react'
import { createEditor as createBaseEditor, Editor } from 'slate'
import { withHistory } from 'slate-history'
import {
  Editable,
  type RenderElementProps,
  type RenderLeafProps,
} from './slate-editor/Editable'
import { withEditContext } from './slate-editor/with-edit-context'
import { useEditorChildren } from './slate-editor/hooks'
import { DebugEditContext } from './DebugEditContext'
import { Pre } from './Pre'
import './text-format-highlights.css'

export function SlateEditor() {
  const [editor] = useState(createEditor)

  return (
    <>
      <Editable
        editor={editor}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        style={{
          padding: 8,
          border: '1px solid lightgrey',
          borderRadius: 4,
          whiteSpace: 'pre-wrap',
        }}
      />

      <Debug editor={editor} />
    </>
  )
}

function Debug({ editor }: { editor: Editor }) {
  const slateValue = useEditorChildren(editor)

  return (
    <>
      <Pre>{JSON.stringify(slateValue, null, 2)}</Pre>
      <DebugEditContext editContext={editor.editContext} />
    </>
  )
}

function createEditor() {
  const editor = withEditContext(withHistory(createBaseEditor()))

  editor.children = [
    {
      type: 'heading',
      children: [{ text: 'Hello, world!' }],
    },
    {
      type: 'paragraph',
      children: [
        { text: 'This editor is based on the ' },
        { text: 'Edit Context', bold: true },
        { text: ' API.' },
      ],
    },
  ]

  return editor
}

function renderElement(props: RenderElementProps): ReactElement {
  switch (props.element.type) {
    case 'paragraph':
      return <Paragraph {...props} />

    case 'heading':
      return <Heading {...props} />
  }
}

function renderLeaf({ leaf: { bold }, attributes, children }: RenderLeafProps) {
  return (
    <span {...attributes} style={{ fontWeight: bold ? 'bold' : 'normal' }}>
      {children}
    </span>
  )
}

function Paragraph({ attributes, children }: RenderElementProps) {
  return (
    <p {...attributes} style={{ margin: '0 0 8px 0' }}>
      {children}
    </p>
  )
}

function Heading({ attributes, children }: RenderElementProps) {
  return (
    <h1 {...attributes} style={{ margin: '0 0 8px 0' }}>
      {children}
    </h1>
  )
}
