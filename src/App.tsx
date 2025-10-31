import { Suspense } from 'react'
import { FaceMeshScene } from './FaceMeshScene'

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid' }}>
      <Suspense fallback={<div style={{ margin: 'auto' }}>Loading?</div>}>
        <FaceMeshScene />
      </Suspense>
    </div>
  )
}
