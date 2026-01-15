import { PlainEditor } from './PlainEditor'
import { SlateEditor } from './SlateEditor'

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <PlainEditor />
      <SlateEditor />
    </div>
  )
}

export default App
