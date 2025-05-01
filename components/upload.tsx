"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { UploadIcon, Music, FileText, Loader2, Info } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { generateVideo } from "@/lib/generate-video"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function Upload() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [lyrics, setLyrics] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("")
  const { toast } = useToast()

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== "audio/mpeg" && !file.name.endsWith('.mp3')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an MP3 file",
          variant: "destructive",
        })
        return
      }
      setAudioFile(file)
    }
  }

  const handleLyricsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLyrics(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audioFile) {
      toast({
        title: "Missing audio file",
        description: "Please upload an MP3 file",
        variant: "destructive",
      })
      return
    }

    if (!lyrics.trim()) {
      toast({
        title: "Missing lyrics",
        description: "Please enter the bilingual lyrics",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingStatus("Analyzing audio...")

    try {
      // Set up a progress update function
      const updateProgress = (status: string) => {
        setProcessingStatus(status)
      }

      // Generate the video with progress updates
      setTimeout(() => updateProgress("Detecting beats..."), 1000)
      setTimeout(() => updateProgress("Synchronizing lyrics..."), 3000)
      setTimeout(() => updateProgress("Generating video..."), 5000)
      
      await generateVideo(audioFile, lyrics)
      
      toast({
        title: "Success!",
        description: "Your video has been generated with enhanced synchronization",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setIsProcessing(false)
      setProcessingStatus("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="audio-file">Upload MP3 File</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Upload an MP3 file. The audio will be analyzed to detect beats for better synchronization.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("audio-file")?.click()}
            className="w-full h-24 flex flex-col items-center justify-center border-dashed"
          >
            {audioFile ? (
              <>
                <Music className="h-6 w-6 mb-2 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[90%]">{audioFile.name}</span>
              </>
            ) : (
              <>
                <UploadIcon className="h-6 w-6 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload MP3</span>
              </>
            )}
          </Button>
          <Input id="audio-file" type="file" accept="audio/mpeg,.mp3" onChange={handleAudioChange} className="hidden" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="lyrics">Bilingual Lyrics</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Enter lyrics with English and translated lines alternating. Section markers like [Verse] or [Chorus] help with synchronization.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id="lyrics"
          placeholder="Enter bilingual lyrics here..."
          value={lyrics}
          onChange={handleLyricsChange}
          className="min-h-[200px] font-mono"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Format: English line followed by translation on the next line. Include section markers like [Verse], [Chorus] for better timing.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isProcessing}>
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {processingStatus || "Processing..."}
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Generate Video with Beat Detection
          </>
        )}
      </Button>
    </form>
  )
}
