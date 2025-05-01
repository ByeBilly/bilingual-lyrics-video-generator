"use client"

export interface AudioAnalysisResult {
  beats: number[]
  duration: number
}

export async function analyzeAudio(audioFile: File): Promise<AudioAnalysisResult> {
  return new Promise((resolve, reject) => {
    const audioContext = new AudioContext()
    const fileReader = new FileReader()

    fileReader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error("Failed to read audio file")
        }

        // Decode the audio data
        const arrayBuffer = event.target.result as ArrayBuffer
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Get audio data for analysis
        const audioData = audioBuffer.getChannelData(0)
        const duration = audioBuffer.duration

        // Detect beats using a simple energy-based algorithm
        const beats = detectBeats(audioData, audioBuffer.sampleRate)

        resolve({
          beats,
          duration,
        })
      } catch (error) {
        reject(error)
      }
    }

    fileReader.onerror = () => {
      reject(new Error("Error reading audio file"))
    }

    fileReader.readAsArrayBuffer(audioFile)
  })
}

function detectBeats(audioData: Float32Array, sampleRate: number): number[] {
  const beats: number[] = []

  // Parameters for beat detection
  const frameSize = 1024
  const hopSize = 512
  const energyThreshold = 0.01
  const minBeatInterval = 0.3 // Minimum time between beats in seconds

  let lastBeatTime = -minBeatInterval

  // Calculate the energy of each frame
  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    let energy = 0

    // Calculate energy in this frame
    for (let j = 0; j < frameSize; j++) {
      energy += audioData[i + j] * audioData[i + j]
    }
    energy /= frameSize

    // Convert frame index to time
    const currentTime = i / sampleRate

    // Check if this is a beat
    if (energy > energyThreshold && currentTime - lastBeatTime >= minBeatInterval) {
      beats.push(currentTime)
      lastBeatTime = currentTime
    }
  }

  return beats
}

