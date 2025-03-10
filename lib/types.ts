export interface Beat {
  id: string
  title: string
  artist: string
  bpm: number
  key: string
  duration: number
  waveformData: number[]
  audioUrl: string
  imageUrl: string
  tagIds: string[]
  createdAt: string
  plays: number
}

export interface Collection {
  id: string
  name: string
  description: string
  beatIds: string[]
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface UserPreferences {
  theme: "light" | "dark"
  gridView: "compact" | "comfortable" | "spacious"
  autoplay: boolean
}

