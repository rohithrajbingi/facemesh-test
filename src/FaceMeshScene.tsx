import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, Text } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import { useUserMediaVideo } from './hooks/useUserMediaVideo'
import { useFaceLandmarker } from './hooks/useFaceLandmarker'

function VideoPlane({ video }: { video: HTMLVideoElement }) {
  const texture = useMemo(() => new THREE.VideoTexture(video), [video])
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[video.videoWidth || 1280, video.videoHeight || 720]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

function AMarkers({
  width,
  height,
  getPositions,
}: {
  width: number
  height: number
  getPositions: () => { left?: THREE.Vector3; right?: THREE.Vector3; nose?: THREE.Vector3 }
}) {
  const leftRef = useRef<THREE.Group>(null)
  const rightRef = useRef<THREE.Group>(null)
  const noseRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const { left, right, nose } = getPositions()
    if (left && leftRef.current) leftRef.current.position.copy(left)
    if (right && rightRef.current) rightRef.current.position.copy(right)
    if (nose && noseRef.current) noseRef.current.position.copy(nose)
  })

  const fontProps = { fontSize: Math.max(width, height) * 0.03, color: '#ffcc00' }

  return (
    <>
      <group ref={leftRef}>
        <Text {...fontProps} anchorX="center" anchorY="middle">A</Text>
      </group>
      <group ref={rightRef}>
        <Text {...fontProps} anchorX="center" anchorY="middle">A</Text>
      </group>
      <group ref={noseRef}>
        <Text {...fontProps} anchorX="center" anchorY="middle">A</Text>
      </group>
    </>
  )
}

export function FaceMeshScene() {
  const { video, ready, size } = useUserMediaVideo()
  const lm = useFaceLandmarker(ready ? video : null)
  const [camKey, setCamKey] = useState(0)

  const project = (x: number, y: number, z = 0) => {
    // Convert normalized landmark to plane space centered at (0,0)
    const w = size.width
    const h = size.height
    const px = x * w - w / 2
    const py = (1 - y) * h - h / 2
    return new THREE.Vector3(px, py, 1) // in front of plane
  }

  const getPositions = () => {
    const left = lm.leftEye ? project(lm.leftEye.x, lm.leftEye.y, lm.leftEye.z) : undefined
    const right = lm.rightEye ? project(lm.rightEye.x, lm.rightEye.y, lm.rightEye.z) : undefined
    const nose = lm.nose ? project(lm.nose.x, lm.nose.y, lm.nose.z) : undefined
    return { left, right, nose }
  }

  // When video size known, bump camera key to refresh camera bounds
  const camera = (
    <OrthographicCamera
      key={camKey}
      makeDefault
      left={-size.width / 2}
      right={size.width / 2}
      top={size.height / 2}
      bottom={-size.height / 2}
      near={-100}
      far={100}
      position={[0, 0, 10]}
    />
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas onCreated={() => setCamKey((k) => k + 1)}>
        {camera}
        {ready && video && <VideoPlane video={video} />}
        {ready && (
          <AMarkers width={size.width} height={size.height} getPositions={getPositions} />
        )}
      </Canvas>
    </div>
  )
}
