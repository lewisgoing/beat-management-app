"use client"

import type React from "react"

import { useState } from "react"
import { useMusic } from "@/components/providers/music-provider"
import type { Beat } from "@/lib/types"
import { formatDuration } from "@/lib/utils"
import { Play, Pause, Heart, MoreHorizontal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface RecentViewProps {
  onBeatClick: (beat: Beat) => void
}

export default function RecentView({ onBeatClick }: RecentViewProps) {
  const { beats, currentBeat, setCurrentBeat, isPlaying, togglePlay } = useMusic()
  const [hoveredBeatId, setHoveredBeatId] = useState<string | null>(null)

  // Sort beats by date (newest first) and take the first 10
  const recentBeats = [...beats]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

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
        <h1 className="text-2xl font-bold">Recently Added</h1>
      </div>

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
            {recentBeats.map((beat) => {
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
    </div>
  )
}

