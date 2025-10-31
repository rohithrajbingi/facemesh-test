import { useEffect, useRef, useState } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { FilesetResolver } from '@mediapipe/tasks-vision'

export type LandmarkTriple = {
  leftEye?: NormalizedLandmark
  rightEye?: NormalizedLandmark
  nose?: NormalizedLandmark
}

export function useFaceLandmarker(video: HTMLVideoElement | null) {
  const lmRef = useRef<FaceLandmarker | null>(null)
  const [landmarks, setLandmarks] = useState<LandmarkTriple>({})

  useEffect(() => {
    let canceled = false
    let raf = 0

    async function setup() {
      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      const { FaceLandmarker } = await import('@mediapipe/tasks-vision')
      const faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      })
      if (canceled) return
      lmRef.current = faceLandmarker

      const loop = () => {
        if (canceled) return
        if (video && video.readyState >= 2) {
          const now = performance.now()
          const results = faceLandmarker.detectForVideo(video, now)
          const faces = results.faceLandmarks
          if (faces && faces[0]) {
            const pts = faces[0]
            // MediaPipe FaceLandmarker includes iris: indices 468 (left), 473 (right)
            const leftEye = pts[468] || pts[33]
            const rightEye = pts[473] || pts[263]
            const nose = pts[1] || pts[4]
            setLandmarks({ leftEye, rightEye, nose })
          }
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    setup()

    return () => {
      canceled = true
      if (raf) cancelAnimationFrame(raf)
      lmRef.current?.close()
      lmRef.current = null
    }
  }, [video])

  return landmarks
}
