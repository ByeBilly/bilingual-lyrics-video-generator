"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Play, Pause } from 'lucide-react'
import { useVideoStore } from "@/lib/video-store"

export function VideoPreview() {
  const { videoUrl } = useVideoStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoElement) {
      if (isPlaying) {
        videoElement.play().catch((error) => {
          console.error("Error playing video:", error)
          setIsPlaying(false)
        })
      } else {
        videoElement.pause()
      }
    }
  }, [isPlaying, videoElement])

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement("a")
      a.href = videoUrl
      a.download = "lyrics-video.mp4"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Video Preview</h2>

      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
        {videoUrl ? (
          <video ref={setVideoElement} src={videoUrl} className="w-full h-full" controls={false} />
        ) : (
          <div className="text-gray-400 dark:text-gray-500 text-center p-4">
            <p>Your video will appear here</p>
            <p className="text-sm mt-2">Upload an MP3 and lyrics to get started</p>
          </div>
        )}
      </div>

      {videoUrl && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={togglePlayback}>
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>

          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      )}
    </div>
  )
}
