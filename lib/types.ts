// lib/types.ts - Extended with cloud storage properties
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
  
  // Cloud storage properties
  cloudProvider?: string // 'dropbox', 'google_drive', etc.
  cloudFileId?: string // File ID in the cloud storage
  cloudUrl?: string // URL for streaming from cloud
  localCachePath?: string // Path to local cached file
  isProcessed?: boolean // If audio analysis is complete
}

export interface CloudStorageProvider {
  id: string
  type: 'dropbox' | 'google_drive'
  accountName: string
  accountEmail: string
  accessToken: string
  refreshToken: string
  expiresAt: Date
  isConnected: boolean
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
  offlineMode: boolean
  cacheSize: number // in MB
}