"use client"

import { useState } from "react"
import { Beat } from "@/lib/types"
import { useMusic } from "@/components/providers/music-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Heart, MoreHorizontal, Clock, Info } from 'lucide-react'
import { formatDuration } from "@/lib/utils"
import { motion } from "framer-motion"
import DynamicBeatCover from "@/components/dynamic-beat-cover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface BeatGridProps {
  beats: Beat[]
  onBeatClick: (beat: Beat) => void
}

export default function BeatGrid({ beats, onBeatClick }: BeatGridProps) {
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
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {beats.map((beat) => {
        const isActive = currentBeat?.id === beat.id
        const isHovered = hoveredBeatId === beat.id
        const beatTags = getTagsForBeat(beat)
        
        return (
          <motion.div key={beat.id} variants={item}>
            <Card 
              className={`overflow-hidden transition-all duration-200 cursor-pointer ${
                isActive ? "ring-2 ring-primary" : ""
              }`}
              onMouseEnter={() => setHoveredBeatId(beat.id)}
              onMouseLeave={() => setHoveredBeatId(null)}
              onClick={() => onBeatClick(beat)}
            >
              <div className="relative aspect-square">
                {beat.imageUrl && beat.imageUrl.includes('/placeholder.svg') ? (
                  <DynamicBeatCover beat={beat} size={300} className="w-full h-full object-cover" />
                ) : (
                  <img 
                    src={beat.imageUrl || "/placeholder.svg"} 
                    alt={beat.title} 
                    className="w-full h-full object-cover"
                  />
                )}
                <motion.div 
                  className={`absolute inset-0 bg-black/50 flex items-center justify-center ${
                    isHovered || isActive ? "opacity-100" : "opacity-0"
                  }`}
                  initial={false}
                  animate={{ opacity: isHovered || isActive ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    onClick={(e) => handlePlayPause(beat, e)}
                    className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isActive && isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </motion.button>
                </motion.div>
                
                {/* Info button */}
                <motion.button
                  className={`absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onBeatClick(beat)
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Info className="w-4 h-4" />
                </motion.button>
              </div>
              
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base truncate">{beat.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{beat.artist}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <motion.button 
                      className="p-1 rounded-full hover:bg-muted"
                      onClick={(e) => e.stopPropagation()}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart className="w-4 h-4" />
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
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(beat.duration)}
                  </div>
                  <div>{beat.bpm} BPM</div>
                  <div>{beat.key}</div>
                </div>
                
                {beatTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {beatTags.slice(0, 3).map(tag => (
                      <span 
                        key={tag.id}
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{ 
                          backgroundColor: `${tag.color}20`, 
                          color: tag.color 
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {beatTags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-muted">
                        +{beatTags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}