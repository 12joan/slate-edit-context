interface HTMLElement {
  editContext: EditContext | null
}

interface EditContext extends EventTarget {
  /**
   * The editable content of the element.
   */
  readonly text: string

  /**
   * The offset, within the editable text content, of the start of the current
   * selection.
   */
  readonly selectionStart: number

  /**
   * The offset, within the editable text content, of the end of the current
   * selection.
   */
  readonly selectionEnd: number

  /**
   * The offset, within the editable text content, where the last IME
   * composition started.
   */
  readonly characterBoundsRangeStart: number

  /**
   * An Array containing one HTMLElement object which is the element that's
   * associated with the EditContext object.
   */
  attachedElements(): [HTMLElement]

  /**
   * The list of bounding rectangles for the characters in the EditContext
   * object.
   */
  characterBounds(): DOMRect[]

  /**
   * Updates the internal text content of the EditContext object.
   */
  updateText(rangeStart: number, rangeEnd: number, text: string): void

  /**
   * Updates the internal state of the selection within the editable text
   * context.
   */
  updateSelection(start: number, end: number): void

  /**
   * Informs the operating system about the position and size of the editable
   * text region.
   */
  updateControlBounds(controlBounds: DOMRect): void

  /**
   * Informs the operating system about the position and size of the selection
   * within the editable text region.
   */
  updateSelectionBounds(selectionBounds: DOMRect): void

  /**
   * Informs the operating system about the position and size of the selection
   * within the editable text region.
   */
  updateCharacterBounds(rangeStart: number, characterBounds: DOMRect[]): void

  addEventListener<K extends keyof EditContextEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: EditContext, ev: EditContextEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void

  removeEventListener<K extends keyof EditContextEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: VTTCue, ev: EditContextEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
}

declare const EditContext: {
  prototype: EditContext
  new(): EditContext
  new(options: EditContextOptions): EditContext
}

interface EditContextOptions {
  /**
   * A string to set the initial text of the EditContext.
   */
  text?: string

  /**
   * A number to set the initial selection start of the EditContext.
   */
  selectionStart?: number

  /**
   * A number to set the initial selection end of the EditContext.
   */
  selectionEnd?: number
}

interface EditContextEventMap {
  textupdate: TextUpdateEvent
  textformatupdate: TextFormatUpdateEvent
  characterboundsupdate: CharacterBoundsUpdateEvent
  compositionstart: CompositionEvent
  compositionend: CompositionEvent
}

interface TextUpdateEvent extends Event {
  /**
   * Returns the index of the first character in the range of text that was
   * updated.
   */
  readonly updateRangeStart: number

  /**
   * Returns the index of the last character in the range of text that was
   * updated.
   */
  readonly updateRangeEnd: number

  /**
   * Returns the text that was inserted in the updated range.
   */
  readonly text: string

  /**
   * Returns the index of the first character in the new selection range, after
   * the update.
   */
  readonly selectionStart: number

  /**
   * Returns the index of the last character in the new selection range, after
   * the update.
   */
  readonly selectionEnd: number
}

interface TextFormatUpdateEvent extends Event {
  /**
   * Returns the list of text formats that the IME window wants to apply to the
   * text.
   */
  getTextFormats(): TextFormat[]
}

interface CharacterBoundsUpdateEvent extends Event {
  /**
   * The offset of the first character within the editable region text for
   * which the operating system needs the bounds.
   */
  readonly rangeStart: number

  /**
   * The offset of the last character within the editable region text for which
   * the operating system needs the bounds.
   */
  readonly rangeEnd: number
}

interface TextFormat {
  /**
   * The start position of the text range that needs to be formatted with the
   * given text format.
   */
  readonly rangeStart: number

  /**
   * The end position of the text range that needs to be formatted with the
   * given text format.
   */
  readonly rangeEnd: number

  /**
   * The style of the underline that needs to be applied to the text range that
   * is being formatted.
   */
  readonly underlineStyle:
    | 'none'
    | 'solid'
    | 'double'
    | 'dotted'
    | 'dashed'
    | 'wavy'

  /**
   * The thickness of the underline that needs to be applied to the text range
   * that is being formatted.
   */
  readonly underlineThickness: 'none' | 'thin' | 'thick'
}

declare const TextFormat: {
  new(): TextFormat
}
