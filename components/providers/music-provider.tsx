"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { Beat, Collection, Tag } from "@/lib/types"
import { dummyBeats, dummyCollections, dummyTags } from "@/lib/dummy-data"

type MusicContextType = {
  beats: Beat[]
  collections: Collection[]
  tags: Tag[]
  currentBeat: Beat | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  setCurrentBeat: (beat: Beat | null) => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  addBeatToCollection: (beatId: string, collectionId: string) => void
  addTagToBeat: (beatId: string, tagId: string) => void
  removeTagFromBeat: (beatId: string, tagId: string) => void
  filterBeatsByTag: (tagId: string | null) => Beat[]
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [beats, setBeats] = useState<Beat[]>(dummyBeats)
  const [collections, setCollections] = useState<Collection[]>(dummyCollections)
  const [tags, setTags] = useState<Tag[]>(dummyTags)
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Audio element ref
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

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
    if (currentBeat && audioRef.current) {
      audioRef.current.src = currentBeat.audioUrl
      audioRef.current.load()
      if (isPlaying) {
        audioRef.current.play()
      }
    }
  }, [currentBeat])

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
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

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const addBeatToCollection = (beatId: string, collectionId: string) => {
    setCollections(
      collections.map((collection) => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            beatIds: [...collection.beatIds, beatId],
          }
        }
        return collection
      }),
    )
  }

  const addTagToBeat = (beatId: string, tagId: string) => {
    setBeats(
      beats.map((beat) => {
        if (beat.id === beatId) {
          return {
            ...beat,
            tagIds: [...beat.tagIds, tagId],
          }
        }
        return beat
      }),
    )
  }

  const removeTagFromBeat = (beatId: string, tagId: string) => {
    setBeats(
      beats.map((beat) => {
        if (beat.id === beatId) {
          return {
            ...beat,
            tagIds: beat.tagIds.filter((id) => id !== tagId),
          }
        }
        return beat
      }),
    )
  }

  const filterBeatsByTag = (tagId: string | null) => {
    if (!tagId) return beats
    return beats.filter((beat) => beat.tagIds.includes(tagId))
  }

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
        setCurrentBeat,
        togglePlay,
        setVolume,
        setCurrentTime,
        addBeatToCollection,
        addTagToBeat,
        removeTagFromBeat,
        filterBeatsByTag,
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

