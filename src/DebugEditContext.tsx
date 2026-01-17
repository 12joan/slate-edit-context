import { useEffect, useReducer } from 'react'
import { Pre } from './Pre'

export function DebugEditContext({
  editContext,
}: {
  editContext: EditContext
}) {
  const { text, selectionStart, selectionEnd } = editContext
  const [, rerender] = useReducer((x) => 1 - x, 0)

  useEffect(() => {
    const timer = setInterval(rerender, 50)
    return () => clearInterval(timer)
  })

  return (
    <>
      <p style={{ margin: 0 }}>Selection start: {selectionStart}</p>
      <p style={{ margin: 0 }}>Selection end: {selectionEnd}</p>
      <p style={{ margin: 0 }}>Text:</p>
      <Pre>{text.replaceAll('\n', '⏎\n')}</Pre>
    </>
  )
}
