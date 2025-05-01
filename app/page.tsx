import { Upload } from "@/components/upload"
import { VideoPreview } from "@/components/video-preview"

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-12 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Bilingual Lyrics Video Generator</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload an MP3 file and bilingual lyrics to create a video with synchronized captions and a bouncing ball
            animation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <Upload />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <VideoPreview />
          </div>
        </div>
      </div>
    </main>
  )
}
