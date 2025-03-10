// components/providers/music-provider.tsx
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Beat, Collection, Tag } from "@/lib/types"
import { createCloudStorageService } from "@/lib/services/cloud-storage"
import { useCloudStorage } from "@/hooks/use-cloud-storage"
import { getCacheManager } from "@/lib/services/cache-manager"
import { beatService, tagService, collectionService } from "@/lib/services/beat-service"

type MusicContextType = {
  beats: Beat[]
  collections: Collection[]
  tags: Tag[]
  currentBeat: Beat | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  isLoading: boolean
  loadingState: { [key: string]: boolean } // For tracking various loading states
  setCurrentBeat: (beat: Beat | null) => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  addBeat: (beat: Omit<Beat, 'id' | 'createdAt' | 'plays'>) => Promise<Beat | null>
  addBeats: (beats: Omit<Beat, 'id' | 'createdAt' | 'plays'>[]) => Promise<Beat[]>
  updateBeat: (id: string, beat: Partial<Beat>) => Promise<Beat | null>
  deleteBeat: (id: string) => Promise<boolean>
  addBeatToCollection: (beatId: string, collectionId: string) => Promise<boolean>
  removeBeatFromCollection: (beatId: string, collectionId: string) => Promise<boolean>
  addTagToBeat: (beatId: string, tagId: string) => Promise<boolean>
  removeTagFromBeat: (beatId: string, tagId: string) => Promise<boolean>
  addTag: (tag: Omit<Tag, 'id'>) => Promise<Tag | null>
  updateTag: (id: string, tag: Partial<Tag>) => Promise<Tag | null>
  deleteTag: (id: string) => Promise<boolean>
  filterBeatsByTag: (tagId: string | null) => Beat[]
  openDropboxPicker: () => void
  isDropboxPickerOpen: boolean
  closeDropboxPicker: () => void
  refreshData: () => Promise<void>
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [beats, setBeats] = useState<Beat[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingState, setLoadingState] = useState<{ [key: string]: boolean }>({
    beats: false,
    collections: false,
    tags: false
  })
  const [isDropboxPickerOpen, setIsDropboxPickerOpen] = useState(false)
  
  const { getProvider } = useCloudStorage()
  const cacheManager = getCacheManager()

  // Audio element ref
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  // Initial data loading
  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = async () => {
    try {
      // Load beats
      setLoadingState(prev => ({ ...prev, beats: true }))
      const beatsData = await beatService.getBeats()
      setBeats(beatsData)
      setLoadingState(prev => ({ ...prev, beats: false }))
      
      // Load tags
      setLoadingState(prev => ({ ...prev, tags: true }))
      const tagsData = await tagService.getTags()
      setTags(tagsData)
      setLoadingState(prev => ({ ...prev, tags: false }))
      
      // Load collections
      setLoadingState(prev => ({ ...prev, collections: true }))
      const collectionsData = await collectionService.getCollections()
      setCollections(collectionsData)
      setLoadingState(prev => ({ ...prev, collections: false }))
    } catch (error) {
      console.error('Error loading data:', error)
      setLoadingState({
        beats: false,
        collections: false,
        tags: false
      })
    }
  }

  useEffect(() => {
    // Initialize audio element
    if (!audioRef.current) {
      audioRef.current = new Audio()

      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      })

      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration)
        }
      })

      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false)
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  // Handle beat changes
  useEffect(() => {
    const loadAudio = async () => {
      if (!currentBeat || !audioRef.current) return
      
      setIsLoading(true)
      
      try {
        // Update play count in Supabase when a beat starts playing
        beatService.incrementPlayCount(currentBeat.id).catch(console.error)
        
        // Check if we have a cached version
        const cachedAudio = cacheManager?.getCachedAudio(currentBeat.id)
        
        if (cachedAudio) {
          // Use cached audio
          const cachedData = await cachedAudio
          if (cachedData) {
            const blob = new Blob([cachedData], { type: 'audio/mpeg' })
            const url = URL.createObjectURL(blob)
            audioRef.current.src = url
          } else {
            // Cache miss, continue with normal loading
            await loadFromSourceOrCloud()
          }
        } else {
          // No cache available
          await loadFromSourceOrCloud()
        }
        
        audioRef.current.load()
        
        if (isPlaying) {
          try {
            await audioRef.current.play()
          } catch (error) {
            console.error('Failed to play audio:', error)
            setIsPlaying(false)
          }
        }
      } catch (error) {
        console.error('Error loading audio:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    const loadFromSourceOrCloud = async () => {
      if (!currentBeat || !audioRef.current) return
      
      if (currentBeat.cloudProvider && currentBeat.cloudFileId) {
        // Stream from cloud storage
        const provider = await getProvider(currentBeat.cloudProvider)
        
        if (provider) {
          try {
            const cloudService = createCloudStorageService(provider)
            const streamUrl = await cloudService.getStreamUrl(currentBeat.cloudFileId)
            
            audioRef.current.src = streamUrl
            
            // Cache the audio for future use
            fetch(streamUrl)
              .then(response => response.arrayBuffer())
              .then(buffer => {
                cacheManager?.cacheAudio(currentBeat.id, buffer)
              })
              .catch(error => {
                console.error('Failed to cache audio:', error)
              })
          } catch (error) {
            console.error(`Failed to load from cloud: ${error}`)
            audioRef.current.src = currentBeat.audioUrl || ''
          }
        } else {
          console.error(`Cloud provider not connected: ${currentBeat.cloudProvider}`)
          audioRef.current.src = currentBeat.audioUrl || ''
        }
      } else {
        // Fallback to regular URL
        audioRef.current.src = currentBeat.audioUrl || ''
      }
    }
    
    loadAudio()
  }, [currentBeat, getProvider])

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Failed to play:', error)
          setIsPlaying(false)
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])
  
  // Handle current time changes
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime
    }
  }, [currentTime])

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])
  
  // CRUD Operations using Supabase
  const addBeat = useCallback(async (beat: Omit<Beat, 'id' | 'createdAt' | 'plays'>): Promise<Beat | null> => {
    const newBeat = await beatService.createBeat(beat)
    if (newBeat) {
      setBeats(prev => [...prev, newBeat])
    }
    return newBeat
  }, [])
  
  const addBeats = useCallback(async (newBeats: Omit<Beat, 'id' | 'createdAt' | 'plays'>[]): Promise<Beat[]> => {
    const addedBeats = await beatService.importBeats(newBeats)
    if (addedBeats.length > 0) {
      setBeats(prev => [...prev, ...addedBeats])
    }
    return addedBeats
  }, [])
  
  const updateBeat = useCallback(async (id: string, beatUpdates: Partial<Beat>): Promise<Beat | null> => {
    const updatedBeat = await beatService.updateBeat(id, beatUpdates)
    if (updatedBeat) {
      setBeats(prev => prev.map(b => b.id === id ? updatedBeat : b))
      
      // If this is the current beat, update it
      if (currentBeat?.id === id) {
        setCurrentBeat(updatedBeat)
      }
    }
    return updatedBeat
  }, [currentBeat])
  
  const deleteBeat = useCallback(async (id: string): Promise<boolean> => {
    const success = await beatService.deleteBeat(id)
    if (success) {
      setBeats(prev => prev.filter(b => b.id !== id))
      
      // If this is the current beat, clear it
      if (currentBeat?.id === id) {
        setCurrentBeat(null)
        setIsPlaying(false)
      }
    }
    return success
  }, [currentBeat])

  const addBeatToCollection = useCallback(async (beatId: string, collectionId: string): Promise<boolean> => {
    // Find the collection
    const collection = collections.find(c => c.id === collectionId)
    if (!collection) return false
    
    // Check if beat is already in collection
    if (collection.beatIds.includes(beatId)) return true
    
    try {
      // Get the next position
      const position = collection.beatIds.length
      
      // Add to collection in Supabase
      const { error } = await supabase
        .from('collection_beats')
        .insert({
          collectionId,
          beatId,
          position,
          createdAt: new Date().toISOString()
        })
      
      if (error) {
        console.error(`Error adding beat ${beatId} to collection ${collectionId}:`, error)
        return false
      }
      
      // Update local state
      setCollections(prev => 
        prev.map(c => c.id === collectionId 
          ? { ...c, beatIds: [...c.beatIds, beatId] }
          : c
        )
      )
      
      return true
    } catch (error) {
      console.error(`Error adding beat ${beatId} to collection ${collectionId}:`, error)
      return false
    }
  }, [collections])
  
  const removeBeatFromCollection = useCallback(async (beatId: string, collectionId: string): Promise<boolean> => {
    try {
      // Remove from collection in Supabase
      const { error } = await supabase
        .from('collection_beats')
        .delete()
        .eq('collectionId', collectionId)
        .eq('beatId', beatId)
      
      if (error) {
        console.error(`Error removing beat ${beatId} from collection ${collectionId}:`, error)
        return false
      }
      
      // Update local state
      setCollections(prev => 
        prev.map(c => c.id === collectionId 
          ? { ...c, beatIds: c.beatIds.filter(id => id !== beatId) }
          : c
        )
      )
      
      return true
    } catch (error) {
      console.error(`Error removing beat ${beatId} from collection ${collectionId}:`, error)
      return false
    }
  }, [])

  const addTagToBeat = useCallback(async (beatId: string, tagId: string): Promise<boolean> => {
    try {
      // Check if tag already exists on beat
      const beat = beats.find(b => b.id === beatId)
      if (!beat || beat.tagIds.includes(tagId)) return true
      
      // Add tag to beat in Supabase
      const { error } = await supabase
        .from('beat_tags')
        .insert({
          beatId,
          tagId,
          createdAt: new Date().toISOString()
        })
      
      if (error) {
        console.error(`Error adding tag ${tagId} to beat ${beatId}:`, error)
        return false
      }
      
      // Update local state
      setBeats(prev => 
        prev.map(b => b.id === beatId 
          ? { ...b, tagIds: [...b.tagIds, tagId] }
          : b
        )
      )
      
      // If this is the current beat, update it
      if (currentBeat?.id === beatId) {
        setCurrentBeat(prev => 
          prev ? { ...prev, tagIds: [...prev.tagIds, tagId] } : null
        )
      }
      
      return true
    } catch (error) {
      console.error(`Error adding tag ${tagId} to beat ${beatId}:`, error)
      return false
    }
  }, [beats, currentBeat])
  
  const removeTagFromBeat = useCallback(async (beatId: string, tagId: string): Promise<boolean> => {
    try {
      // Remove tag from beat in Supabase
      const { error } = await supabase
        .from('beat_tags')
        .delete()
        .eq('beatId', beatId)
        .eq('tagId', tagId)
      
      if (error) {
        console.error(`Error removing tag ${tagId} from beat ${beatId}:`, error)
        return false
      }
      
      // Update local state
      setBeats(prev => 
        prev.map(b => b.id === beatId 
          ? { ...b, tagIds: b.tagIds.filter(id => id !== tagId) }
          : b
        )
      )
      
      // If this is the current beat, update it
      if (currentBeat?.id === beatId) {
        setCurrentBeat(prev => 
          prev ? { ...prev, tagIds: prev.tagIds.filter(id => id !== tagId) } : null
        )
      }
      
      return true
    } catch (error) {
      console.error(`Error removing tag ${tagId} from beat ${beatId}:`, error)
      return false
    }
  }, [beats, currentBeat])
  
  const addTag = useCallback(async (tag: Omit<Tag, 'id'>): Promise<Tag | null> => {
    const newTag = await tagService.createTag(tag)
    if (newTag) {
      setTags(prev => [...prev, newTag])
    }
    return newTag
  }, [])
  
  const updateTag = useCallback(async (id: string, tagUpdates: Partial<Tag>): Promise<Tag | null> => {
    const updatedTag = await tagService.updateTag(id, tagUpdates)
    if (updatedTag) {
      setTags(prev => prev.map(t => t.id === id ? updatedTag : t))
    }
    return updatedTag
  }, [])
  
  const deleteTag = useCallback(async (id: string): Promise<boolean> => {
    const success = await tagService.deleteTag(id)
    if (success) {
      setTags(prev => prev.filter(t => t.id !== id))
      
      // Remove this tag from all beats
      setBeats(prev => 
        prev.map(beat => ({
          ...beat,
          tagIds: beat.tagIds.filter(tagId => tagId !== id)
        }))
      )
      
      // Update current beat if needed
      if (currentBeat?.tagIds.includes(id)) {
        setCurrentBeat(prev => 
          prev ? { ...prev, tagIds: prev.tagIds.filter(tagId => tagId !== id) } : null
        )
      }
    }
    return success
  }, [currentBeat])

  const filterBeatsByTag = useCallback((tagId: string | null) => {
    if (!tagId) return beats
    return beats.filter((beat) => beat.tagIds.includes(tagId))
  }, [beats])
  
  const openDropboxPicker = useCallback(() => {
    setIsDropboxPickerOpen(true)
  }, [])
  
  const closeDropboxPicker = useCallback(() => {
    setIsDropboxPickerOpen(false)
  }, [])

  return (
    <MusicContext.Provider
      value={{
        beats,
        collections,
        tags,
        currentBeat,
        isPlaying,
        volume,
        currentTime,
        duration,
        isLoading,
        loadingState,
        setCurrentBeat,
        togglePlay,
        setVolume,
        setCurrentTime,
        addBeat,
        addBeats,
        updateBeat,
        deleteBeat,
        addBeatToCollection,
        removeBeatFromCollection,
        addTagToBeat,
        removeTagFromBeat,
        addTag,
        updateTag,
        deleteTag,
        filterBeatsByTag,
        openDropboxPicker,
        isDropboxPickerOpen,
        closeDropboxPicker,
        refreshData
      }}
    >
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (context === undefined) {
    throw new Error("useMusic must be used within a MusicProvider")
  }
  return context
}