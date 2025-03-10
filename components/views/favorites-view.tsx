"use client"

import type React from "react"

import { useState } from "react"
import { useMusic } from "@/components/providers/music-provider"
import type { Beat } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Heart, MoreHorizontal, Clock } from "lucide-react"
import { formatDuration } from "@/lib/utils"

interface FavoritesViewProps {
  onBeatClick: (beat: Beat) => void
}

export default function FavoritesView({ onBeatClick }: FavoritesViewProps) {
  const { beats, currentBeat, setCurrentBeat, isPlaying, togglePlay } = useMusic()
  const [hoveredBeatId, setHoveredBeatId] = useState<string | null>(null)

  // For demo purposes, we'll just show the first collection's beats
  // In a real app, you'd have a favorites system
  const favoriteBeats = beats.filter((beat) => beat.id === "beat1" || beat.id === "beat4" || beat.id === "beat6")

  const handlePlayPause = (beat: Beat, e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentBeat?.id === beat.id) {
      togglePlay()
    } else {
      setCurrentBeat(beat)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      {favoriteBeats.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favoriteBeats.map((beat) => {
            const isActive = currentBeat?.id === beat.id
            const isHovered = hoveredBeatId === beat.id

            return (
              <Card
                key={beat.id}
                className={`overflow-hidden transition-all duration-200 cursor-pointer ${
                  isActive ? "ring-2 ring-primary" : ""
                }`}
                onMouseEnter={() => setHoveredBeatId(beat.id)}
                onMouseLeave={() => setHoveredBeatId(null)}
                onClick={() => onBeatClick(beat)}
              >
                <div className="relative aspect-square">
                  <img
                    src={beat.imageUrl || "/placeholder.svg"}
                    alt={beat.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                      isHovered || isActive ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <button
                      onClick={(e) => handlePlayPause(beat, e)}
                      className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                    >
                      {isActive && isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                    </button>
                  </div>
                </div>

                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base truncate">{beat.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{beat.artist}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button className="p-1 rounded-full hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </button>
                      <button className="p-1 rounded-full hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(beat.duration)}
                    </div>
                    <div>{beat.bpm} BPM</div>
                    <div>{beat.key}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No favorites yet</h3>
          <p className="text-muted-foreground">Add beats to your favorites to see them here</p>
        </div>
      )}
    </div>
  )
}

