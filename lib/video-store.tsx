import { create } from "zustand"

interface VideoStore {
  videoUrl: string | null
  setVideoUrl: (url: string) => void
}

export const useVideoStore = create<VideoStore>((set) => ({
  videoUrl: null,
  setVideoUrl: (url) => set({ videoUrl: url }),
}))
