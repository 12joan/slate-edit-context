import { BaseEditor, BaseElement, BaseText } from 'slate'
import { HistoryEditor } from 'slate-history'

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor &
      HistoryEditor & {
        changeHandlers: Set<() => void>
        editContext: EditContext
      }

    Element: BaseElement & { type: 'paragraph' | 'heading' }
    Text: BaseText & { bold?: true }
  }
}
