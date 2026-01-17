import { type HTMLAttributes } from 'react'

export function Pre(props: HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      {...props}
      style={{
        whiteSpace: 'pre',
        background: '#f8f8f8',
        padding: 8,
        margin: 0,
        borderRadius: 4,
        border: '1px solid lightgrey',
        ...props.style,
      }}
    />
  )
}
