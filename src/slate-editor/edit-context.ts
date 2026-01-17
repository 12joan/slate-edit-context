import { Editor, Node, Point, Range, Transforms, type Descendant } from 'slate'
import { DOMEditor } from './dom-editor'

type UnderlineStyle = TextFormat['underlineStyle']
type UnderlineThickness = TextFormat['underlineThickness']

type SpecUnderlineStyle = Exclude<
  UnderlineStyle,
  'None' | 'Solid' | 'Dotted' | 'Dashed' | 'Squiggle'
>

type SpecUnderlineThickness = Exclude<
  UnderlineThickness,
  'None' | 'Thin' | 'Thick'
>

/**
 * Required for compatibility with certain Chrome versions that use incorrect
 * values.
 */
const nonSpecToSpecUnderlineStyle: Record<UnderlineStyle, SpecUnderlineStyle> =
  {
    none: 'none',
    solid: 'solid',
    double: 'double',
    dotted: 'dotted',
    dashed: 'dashed',
    wavy: 'wavy',
    None: 'none',
    Solid: 'solid',
    Dotted: 'dotted',
    Dashed: 'dashed',
    Squiggle: 'wavy',
  }

const nonSpecToSpecUnderlineThickness: Record<
  UnderlineThickness,
  SpecUnderlineThickness
> = {
  none: 'none',
  thin: 'thin',
  thick: 'thick',
  None: 'none',
  Thin: 'thin',
  Thick: 'thick',
}

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

  underlineHighlightName(
    style: UnderlineStyle,
    thickness: UnderlineThickness
  ): string {
    return `underline-style-${nonSpecToSpecUnderlineStyle[style]}-${nonSpecToSpecUnderlineThickness[thickness]}`
  },
}

export function initEditContext(editor: Editor) {
  const editable = DOMEditor.getEditable(editor)
  const { editContext } = editor

  function updateEditContextText() {
    editContext.updateText(
      0,
      editContext.text.length,
      EditContextEditor.string(editor, editor)
    )
  }

  updateEditContextText()

  function handleTextUpdate(event: TextUpdateEvent) {
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
  }

  const activeHighlightNames = new Set<string>()

  function handleTextFormatUpdate(event: TextFormatUpdateEvent) {
    const textFormats = event.getTextFormats()

    clearActiveHighlights()

    const highlightsByName = new Map<string, Highlight>()

    for (const textFormat of textFormats) {
      const { rangeStart, rangeEnd, underlineStyle, underlineThickness } =
        textFormat

      const highlightName = EditContextEditor.underlineHighlightName(
        underlineStyle,
        underlineThickness
      )
      let highlight = highlightsByName.get(highlightName)

      if (!highlight) {
        highlight = new Highlight()
        highlightsByName.set(highlightName, highlight)
        activeHighlightNames.add(highlightName)
        CSS.highlights.set(highlightName, highlight)
      }

      const range = EditContextEditor.toSlateRange(editor, rangeStart, rangeEnd)
      const domRange = DOMEditor.toDOMRange(editor, range)
      highlight.add(domRange)
    }
  }

  function clearActiveHighlights() {
    for (const highlightName of activeHighlightNames) {
      CSS.highlights.delete(highlightName)
    }
  }

  function handleEditorChange() {
    updateEditContextText()

    if (editor.selection) {
      const [start, end] = EditContextEditor.toOffsetRange(
        editor,
        editor.selection
      )

      editContext.updateSelection(start, end)

      // Defer updating the selection bounds to give React time to update
      setTimeout(() => {
        if (!editor.selection) return
        const selectionDOMRange = DOMEditor.toDOMRange(editor, editor.selection)
        editContext.updateSelectionBounds(
          selectionDOMRange.getBoundingClientRect()
        )
      })
    }
  }

  function updateControlBounds() {
    editContext.updateControlBounds(editable.getBoundingClientRect())
  }

  const resizeObserver = new ResizeObserver(updateControlBounds)
  updateControlBounds()

  function updateCharacterBounds(event: CharacterBoundsUpdateEvent) {
    const range = EditContextEditor.toSlateRange(
      editor,
      event.rangeStart,
      event.rangeEnd
    )

    const domRange = DOMEditor.toDOMRange(editor, range)

    editContext.updateCharacterBounds(event.rangeStart, [
      domRange.getBoundingClientRect(),
    ])
  }

  editable.editContext = editContext
  editor.changeHandlers.add(handleEditorChange)
  editContext.addEventListener('textupdate', handleTextUpdate)
  editContext.addEventListener('textformatupdate', handleTextFormatUpdate)
  editContext.addEventListener('characterboundsupdate', updateCharacterBounds)
  resizeObserver.observe(editable)

  return () => {
    editable.editContext = null
    editor.changeHandlers.delete(handleEditorChange)
    editContext.removeEventListener('textupdate', handleTextUpdate)
    editContext.removeEventListener('textformatupdate', handleTextFormatUpdate)
    editContext.removeEventListener(
      'characterboundsupdate',
      updateCharacterBounds
    )
    resizeObserver.disconnect()
    clearActiveHighlights()
  }
}
