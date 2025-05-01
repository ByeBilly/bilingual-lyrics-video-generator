export interface AudioAnalysisResult {
  beats: number[]
  duration: number
}

export async function analyzeAudio(audioFile: File): Promise<AudioAnalysisResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = async (event) => {
      if (!event.target?.result) {
        resolve({ beats: [], duration: 0 })
        return
      }

      const audioContext = new AudioContext()
      try {
        const audioBuffer = await audioContext.decodeAudioData(event.target.result as ArrayBuffer)
        const duration = audioBuffer.duration

        // Basic beat detection (simplified)
        const bufferData = audioBuffer.getChannelData(0)
        const sampleRate = audioBuffer.sampleRate
        const threshold = 0.5 // Adjust this value
        const minInterval = 0.1 // Minimum time between beats in seconds
        const minSamples = minInterval * sampleRate

        const beats: number[] = []
        let lastBeatTime = -minInterval

        for (let i = 0; i < bufferData.length; i++) {
          if (bufferData[i] > threshold && i / sampleRate > lastBeatTime + minInterval) {
            beats.push(i / sampleRate)
            lastBeatTime = i / sampleRate
          }
        }

        resolve({ beats: beats, duration: duration })
      } catch (error) {
        console.error("Error decoding audio data", error)
        resolve({ beats: [], duration: 0 })
      }
    }

    reader.onerror = (error) => {
      console.error("Error reading audio file", error)
      resolve({ beats: [], duration: 0 })
    }

    reader.readAsArrayBuffer(audioFile)
  })
}
