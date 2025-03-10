"use client"

import { useState } from "react"
import { Beat } from "@/lib/types"
import { useMusic } from "@/components/providers/music-provider"
import { formatDuration } from "@/lib/utils"
import { Play, Pause, Heart, MoreHorizontal, Info } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import DynamicBeatCover from "@/components/dynamic-beat-cover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface BeatListProps {
  beats: Beat[]
  sortBy: string
  sortDirection: "asc" | "desc"
  onBeatClick: (beat: Beat) => void
}

export default function BeatList({ beats, sortBy, sortDirection, onBeatClick }: BeatListProps) {
  const { currentBeat, setCurrentBeat, isPlaying, togglePlay, tags } = useMusic()
  const [hoveredBeatId, setHoveredBeatId] = useState<string | null>(null)

  const handlePlayPause = (beat: Beat, e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentBeat?.id === beat.id) {
      togglePlay()
    } else {
      setCurrentBeat(beat)
    }
  }

  const getTagsForBeat = (beat: Beat) => {
    return tags.filter(tag => beat.tagIds.includes(tag.id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
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
            <TableHead className="text-center">Tags</TableHead>
            <TableHead className="text-center">Plays</TableHead>
            <TableHead className="text-right">Added</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {beats.map((beat) => {
              const isActive = currentBeat?.id === beat.id
              const isHovered = hoveredBeatId === beat.id
              const beatTags = getTagsForBeat(beat)
              
              return (
                <motion.tr 
                  key={beat.id}
                  className={`${isActive ? "bg-muted/50" : ""} ${isHovered ? "bg-muted/30" : ""} cursor-pointer`}
                  onMouseEnter={() => setHoveredBeatId(beat.id)}
                  onMouseLeave={() => setHoveredBeatId(null)}
                  onClick={() => onBeatClick(beat)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <TableCell>
                    <motion.button
                      onClick={(e) => handlePlayPause(beat, e)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-primary/80 hover:text-primary-foreground"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isActive && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </motion.button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {beat.imageUrl && beat.imageUrl.includes('/placeholder.svg') ? (
                        <DynamicBeatCover beat={beat} size={40} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <img 
                          src={beat.imageUrl || "/placeholder.svg"} 
                          alt={beat.title} 
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <span>{beat.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{beat.artist}</TableCell>
                  <TableCell className="text-center">{beat.bpm}</TableCell>
                  <TableCell className="text-center">{beat.key}</TableCell>
                  <TableCell className="text-center">{formatDuration(beat.duration)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-center gap-1">
                      {beatTags.slice(0, 2).map(tag => (
                        <motion.span 
                          key={tag.id}
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{ 
                            backgroundColor: `${tag.color}20`, 
                            color: tag.color 
                          }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {tag.name}
                        </motion.span>
                      ))}
                      {beatTags.length > 2 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-muted">
                          +{beatTags.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{beat.plays.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(beat.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <motion.button 
                        className="p-1 rounded-full hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Heart className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        className="p-1 rounded-full hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation()
                          onBeatClick(beat)
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Info className="w-4 h-4" />
                      </motion.button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <motion.button 
                            className="p-1 rounded-full hover:bg-muted"
                            onClick={(e) => e.stopPropagation()}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem>Add to collection</DropdownMenuItem>
                          <DropdownMenuItem>Edit tags</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuItem>Download</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </motion.tr>
              )
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  )
}