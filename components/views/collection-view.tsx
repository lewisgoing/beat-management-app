"use client"

import type React from "react"

import { useState } from "react"
import { useMusic } from "@/components/providers/music-provider"
import type { Beat } from "@/lib/types"
import { formatDuration } from "@/lib/utils"
import { Play, Pause, Heart, MoreHorizontal, Edit, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CollectionViewProps {
  collectionId: string | null
  onBeatClick: (beat: Beat) => void
}

export default function CollectionView({ collectionId, onBeatClick }: CollectionViewProps) {
  const { beats, collections, currentBeat, setCurrentBeat, isPlaying, togglePlay } = useMusic()
  const [hoveredBeatId, setHoveredBeatId] = useState<string | null>(null)

  if (!collectionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No collection selected</p>
      </div>
    )
  }

  const collection = collections.find((c) => c.id === collectionId)

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Collection not found</p>
      </div>
    )
  }

  const collectionBeats = beats.filter((beat) => collection.beatIds.includes(beat.id))

  const handlePlayPause = (beat: Beat, e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentBeat?.id === beat.id) {
      togglePlay()
    } else {
      setCurrentBeat(beat)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{collection.name}</h1>
          <p className="text-muted-foreground">{collection.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Collection
          </Button>
          <Button variant="outline" className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {collectionBeats.length > 0 ? (
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead className="text-center">BPM</TableHead>
                <TableHead className="text-center">Key</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead className="text-right">Added</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectionBeats.map((beat) => {
                const isActive = currentBeat?.id === beat.id
                const isHovered = hoveredBeatId === beat.id

                return (
                  <TableRow
                    key={beat.id}
                    className={`${isActive ? "bg-muted/50" : ""} ${isHovered ? "bg-muted/30" : ""} cursor-pointer`}
                    onMouseEnter={() => setHoveredBeatId(beat.id)}
                    onMouseLeave={() => setHoveredBeatId(null)}
                    onClick={() => onBeatClick(beat)}
                  >
                    <TableCell>
                      <button
                        onClick={(e) => handlePlayPause(beat, e)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-primary/80 hover:text-primary-foreground"
                        }`}
                      >
                        {isActive && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <img
                          src={beat.imageUrl || "/placeholder.svg"}
                          alt={beat.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span>{beat.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{beat.artist}</TableCell>
                    <TableCell className="text-center">{beat.bpm}</TableCell>
                    <TableCell className="text-center">{beat.key}</TableCell>
                    <TableCell className="text-center">{formatDuration(beat.duration)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(beat.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <button className="p-1 rounded-full hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                          <Heart className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded-full hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-4xl mb-4">🎵</div>
          <h3 className="text-xl font-medium mb-2">No beats in this collection</h3>
          <p className="text-muted-foreground mb-4">Add beats to this collection to see them here</p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Beats
          </Button>
        </div>
      )}
    </div>
  )
}

