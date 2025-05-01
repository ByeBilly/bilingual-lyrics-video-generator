"use client"

import { useVideoStore } from "./video-store"
import { parseLyrics } from "./parse-lyrics"
import { analyzeAudio, type AudioAnalysisResult } from "./audio-analyzer"

export async function generateVideo(audioFile: File, lyricsText: string) {
  // First, analyze the audio to detect beats and energy points
  const audioAnalysis = await analyzeAudio(audioFile)
  console.log("Audio analysis complete:", audioAnalysis)

  // Parse the lyrics with timing information from audio analysis
  const parsedLyrics = parseLyrics(lyricsText, {
    beats: audioAnalysis.beats,
    duration: audioAnalysis.duration,
  })
  console.log("Parsed lyrics with timing:", parsedLyrics)

  // Create an audio element to play the audio
  const audioUrl = URL.createObjectURL(audioFile)
  const audio = new Audio(audioUrl)

  // Wait for audio metadata to load
  await new Promise((resolve) => {
    audio.addEventListener("loadedmetadata", resolve)
  })

  // Create a canvas for rendering the video frames
  const canvas = document.createElement("canvas")
  canvas.width = 1280
  canvas.height = 720
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  // Create a MediaRecorder to capture the canvas as video
  const stream = canvas.captureStream(30) // 30 FPS
  const audioContext = new AudioContext()
  const audioSource = audioContext.createMediaElementSource(audio)
  const audioDestination = audioContext.createMediaStreamDestination()
  audioSource.connect(audioDestination)
  audioSource.connect(audioContext.destination)

  // Combine audio and video streams
  const combinedStream = new MediaStream([...stream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()])

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: "video/webm; codecs=vp9,opus",
    videoBitsPerSecond: 3000000,
  })

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data)
    }
  }

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/mp4" })
    const videoUrl = URL.createObjectURL(blob)
    useVideoStore.getState().setVideoUrl(videoUrl)
  }

  // Create an analyzer for real-time audio visualization
  const analyzer = audioContext.createAnalyser()
  analyzer.fftSize = 256
  audioSource.connect(analyzer)
  const bufferLength = analyzer.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  // Start recording
  recorder.start()
  audio.play()

  // Animation loop for rendering frames
  let currentLine = 0
  let lastBeatTime = 0
  let beatActive = false

  const animate = () => {
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Get current audio data for visualization
    analyzer.getByteFrequencyData(dataArray)
    
    // Calculate average energy for visualization
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i]
    }
    const averageEnergy = sum / bufferLength

    // Draw audio visualization
    drawAudioVisualization(ctx, dataArray, canvas.width, canvas.height)

    // Calculate current time and find the current lyric line
    const currentTime = audio.currentTime

    // Check if we need to move to the next line
    while (currentLine < parsedLyrics.length - 1 && parsedLyrics[currentLine + 1].startTime <= currentTime) {
      currentLine++
    }

    // Check if we're on a beat
    const isOnBeat = audioAnalysis.beats.some(beat => {
      const timeDiff = Math.abs(currentTime - beat)
      return timeDiff < 0.1 // Within 100ms of a beat
    })

    if (isOnBeat && currentTime - lastBeatTime > 0.2) {
      beatActive = true
      lastBeatTime = currentTime
      setTimeout(() => {
        beatActive = false
      }, 100)
    }

    // Draw lyrics
    const currentLyricPair = parsedLyrics[currentLine]
    if (currentLyricPair) {
      // Draw English line
      ctx.font = "bold 40px Arial"
      ctx.fillStyle = "white"
      ctx.textAlign = "center"
      ctx.fillText(currentLyricPair.englishText, canvas.width / 2, canvas.height / 2 - 60)

      // Draw Arabic/translated line
      ctx.font = "bold 40px Arial"
      ctx.fillText(currentLyricPair.translatedText, canvas.width / 2, canvas.height / 2 + 60)

      // Calculate progress within the current line
      const lineProgress = Math.min(
        1,
        (currentTime - currentLyricPair.startTime) / 
        (currentLyricPair.endTime - currentLyricPair.startTime || 1)
      )

      // Draw bouncing ball
      const textWidth = ctx.measureText(currentLyricPair.englishText).width
      const startX = (canvas.width - textWidth) / 2
      const ballX = startX + textWidth * lineProgress

      // Add a bouncing effect enhanced by audio energy
      const baseHeight = 20
      const energyFactor = averageEnergy / 128 // Normalize to 0-1 range
      const beatBoost = beatActive ? 15 : 0
      const bounceHeight = Math.abs(Math.sin(lineProgress * Math.PI * 3)) * baseHeight * (1 + energyFactor) + beatBoost

      // Draw glow effect for the ball
      const gradient = ctx.createRadialGradient(
        ballX, canvas.height / 2 - 90 - bounceHeight, 0,
        ballX, canvas.height / 2 - 90 - bounceHeight, 20
      )
      gradient.addColorStop(0, "rgba(255, 107, 107, 1)")
      gradient.addColorStop(1, "rgba(255, 107, 107, 0)")
      
      ctx.beginPath()
      ctx.arc(ballX, canvas.height / 2 - 90 - bounceHeight, 12, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Draw the solid ball
      ctx.beginPath()
      ctx.arc(ballX, canvas.height / 2 - 90 - bounceHeight, 8, 0, Math.PI * 2)
      ctx.fillStyle = "#ff6b6b"
      ctx.fill()
    }

    // Continue animation if audio is still playing
    if (!audio.ended && !audio.paused) {
      requestAnimationFrame(animate)
    } else if (audio.ended) {
      recorder.stop()
    }
  }

  // Start animation
  animate()

  // Set up a timeout to stop recording if the audio doesn't end naturally
  const timeout = setTimeout(
    () => {
      if (recorder.state === "recording") {
        audio.pause()
        recorder.stop()
      }
    },
    audio.duration * 1000 + 1000,
  ) // Add 1 second buffer

  // Return a promise that resolves when recording is complete
  return new Promise<void>((resolve) => {
    recorder.onstop = () => {
      clearTimeout(timeout)
      const blob = new Blob(chunks, { type: "video/mp4" })
      const videoUrl = URL.createObjectURL(blob)
      useVideoStore.getState().setVideoUrl(videoUrl)
      resolve()
    }
  })
}

// Function to draw audio visualization
function drawAudioVisualization(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number
) {
  const barWidth = width / dataArray.length
  
  // Draw bars for frequency data
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * (height / 4)
    
    // Create gradient for bars
    const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
    gradient.addColorStop(0, "rgba(66, 133, 244, 0.8)")
    gradient.addColorStop(1, "rgba(66, 133, 244, 0.2)")
    
    ctx.fillStyle = gradient
    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
  }
  
  // Draw mirrored bars at the top
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * (height / 4)
    
    // Create gradient for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, barHeight)
    gradient.addColorStop(0, "rgba(66, 133, 244, 0.2)")
    gradient.addColorStop(1, "rgba(66, 133, 244, 0.8)")
    
    ctx.fillStyle = gradient
    ctx.fillRect(i * barWidth, 0, barWidth - 1, barHeight)
  }
}
