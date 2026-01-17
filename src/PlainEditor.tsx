import { useEffect, useRef } from 'react'
import { isHotkey } from 'is-hotkey'

export function PlainEditor() {
  const editorElRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { current: editorEl } = editorElRef
    if (!editorEl) return
    return initEditContext(editorEl)
  }, [])

  return (
    <div
      ref={editorElRef}
      style={{
        padding: 8,
        border: '1px solid lightgrey',
        borderRadius: 4,
        whiteSpace: 'pre-wrap',
      }}
    />
  )
}

function initEditContext(editorEl: HTMLElement) {
  const editContext = new EditContext({
    text: 'This is a plain text editor built using the Edit Context API, without Slate.',
  })

  editorEl.editContext = editContext

  function getEditorElTextNode() {
    let textNode = editorEl.firstChild

    if (!(textNode instanceof Text)) {
      textNode = document.createTextNode('')
      editorEl.prepend(textNode)
    }

    return textNode
  }

  function render(text: string, selectionStart: number, selectionEnd: number) {
    editorEl.textContent = text

    const textNode = getEditorElTextNode()

    document
      .getSelection()
      ?.setBaseAndExtent(textNode, selectionStart, textNode, selectionEnd)
  }

  editContext.addEventListener('textupdate', (event) =>
    render(editContext.text, event.selectionStart, event.selectionEnd)
  )

  render(editContext.text, editContext.selectionStart, editContext.selectionEnd)

  function updateControlBounds() {
    editContext.updateControlBounds(editorEl.getBoundingClientRect())
  }

  window.addEventListener('resize', updateControlBounds)
  updateControlBounds()

  editorEl.addEventListener('keydown', (event) => {
    if (isHotkey('enter', event)) {
      const start = Math.min(
        editContext.selectionStart,
        editContext.selectionEnd
      )

      const end = Math.max(editContext.selectionStart, editContext.selectionEnd)

      editContext.updateText(start, end, '\n')
      updateSelection(start + 1, start + 1)

      render(
        editContext.text,
        editContext.selectionStart,
        editContext.selectionEnd
      )
    }
  })

  function updateSelection(start: number, end: number) {
    editContext.updateSelection(start, end)

    const selectionBounds = document
      .getSelection()
      ?.getRangeAt(0)
      .getBoundingClientRect()

    if (selectionBounds) {
      editContext.updateSelectionBounds(selectionBounds)
    }
  }

  document.addEventListener('selectionchange', () => {
    const selection = document.getSelection()

    if (
      !selection ||
      !selection.anchorNode ||
      !editorEl.contains(selection.anchorNode) ||
      !selection.focusNode ||
      !editorEl.contains(selection.focusNode)
    )
      return

    updateSelection(selection.anchorOffset, selection.focusOffset)
  })

  editContext.addEventListener('characterboundsupdate', (event) => {
    const textNode = getEditorElTextNode()

    const range = document.createRange()
    range.setStart(textNode, event.rangeStart)
    range.setEnd(textNode, event.rangeEnd)
    const bounds = range.getBoundingClientRect()

    editContext.updateCharacterBounds(event.rangeStart, [bounds])
  })

  return () => {
    editorEl.editContext = null
  }
}
