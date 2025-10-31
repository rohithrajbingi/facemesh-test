import { useEffect, useMemo, useRef, useState } from 'react'

export function useUserMediaVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [ready, setReady] = useState(false)
  const [size, setSize] = useState({ width: 1280, height: 720 })

  const video = useMemo(() => {
    const el = document.createElement('video')
    el.autoplay = true
    el.muted = true
    el.playsInline = true
    el.style.display = 'none'
    return el
  }, [])

  useEffect(() => {
    videoRef.current = video
    document.body.appendChild(video)

    let active = true
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        if (!active) return
        video.srcObject = stream
        await video.play()
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2 && video.videoWidth) return resolve()
          video.onloadedmetadata = () => resolve()
        })
        setSize({ width: video.videoWidth || 1280, height: video.videoHeight || 720 })
        setReady(true)
      } catch (e) {
        console.error('Camera error', e)
      }
    })()

    return () => {
      active = false
      const tracks = (video.srcObject as MediaStream | null)?.getTracks() || []
      tracks.forEach((t) => t.stop())
      video.pause()
      video.srcObject = null
      video.remove()
    }
  }, [video])

  return { video, ready, size }
}
