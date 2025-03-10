// components/audio-player.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useMusic } from "@/components/providers/music-provider"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Repeat, Shuffle, Maximize2, Minimize2, Cloud, Loader2 } from 'lucide-react'
import { Slider } from "@/components/ui/slider"
import { formatDuration } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DynamicBeatCover from "@/components/dynamic-beat-cover"
import { cn } from "@/lib/utils"

export default function AudioPlayer() {
  const { 
    currentBeat, 
    isPlaying, 
    togglePlay, 
    volume, 
    setVolume, 
    currentTime, 
    duration,
    setCurrentTime,
    isLoading
  } = useMusic()
  
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [expandedPlayer, setExpandedPlayer] = useState(false)
  const [activeTab, setActiveTab] = useState("waveform")
  
  const waveformRef = useRef<HTMLCanvasElement>(null)
  const spectrumRef = useRef<HTMLCanvasElement>(null)
  
  // Draw waveform
  useEffect(() => {
    if (!currentBeat || !waveformRef.current) return
    
    const canvas = waveformRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const waveformData = currentBeat.waveformData
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    
    const barWidth = canvasWidth / waveformData.length
    const barGap = 1
    
    // Draw played part
    const playedWidth = (currentTime / duration) * canvasWidth
    
    waveformData.forEach((value, index) => {
      const x = index * barWidth
      const barHeight = value * canvasHeight
      
      // Draw bar
      ctx.fillStyle = x < playedWidth ? '#22c55e' : '#e2e8f0'
      ctx.fillRect(
        x + barGap / 2, 
        (canvasHeight - barHeight) / 2, 
        barWidth - barGap, 
        barHeight
      )
    })
  }, [currentBeat, currentTime, duration])
  
  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0])
  }
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }
  
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX />
    if (volume < 0.5) return <Volume1 />
    return <Volume2 />
  }
  
  if (!currentBeat) {
    return (
      <div className="h-20 border-t bg-card flex items-center justify-center text-muted-foreground fixed bottom-0 left-0 right-0">
        No beat selected
      </div>
    )
  }
  
  return (
    <div 
      className={cn(
        "border-t bg-card transition-all fixed bottom-0 left-0 right-0 z-10",
        expandedPlayer ? 'h-80' : 'h-24'
      )}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center p-4">
          <div className="flex items-center w-1/4">
            {currentBeat.imageUrl && currentBeat.imageUrl.includes('/placeholder.svg') ? (
              <DynamicBeatCover beat={currentBeat} size={64} className="w-16 h-16 object-cover rounded-md mr-3" />
            ) : (
              <img 
                src={currentBeat.imageUrl || "/placeholder.svg"} 
                alt={currentBeat.title} 
                className="w-16 h-16 object-cover rounded-md mr-3"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-medium truncate">{currentBeat.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{currentBeat.artist}</p>
              
              {/* Cloud provider badge */}
              {currentBeat.cloudProvider && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Cloud className="w-3 h-3 mr-1" />
                  {currentBeat.cloudProvider === 'dropbox' ? 'Dropbox' : 'Cloud'}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center space-x-4 mb-2">
              <button 
                className="text-muted-foreground hover:text-foreground"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button 
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground relative"
                onClick={togglePlay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <button 
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button 
                className="text-muted-foreground hover:text-foreground"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>
            
            <div className="w-full flex items-center space-x-2">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatDuration(currentTime)}
              </span>
              
              <div className="flex-1 relative h-10 flex items-center">
                <canvas 
                  ref={waveformRef} 
                  width={500} 
                  height={40} 
                  className="w-full h-full absolute"
                />
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="relative z-10"
                  disabled={isLoading}
                />
              </div>
              
              <span className="text-xs text-muted-foreground w-10">
                {formatDuration(duration)}
              </span>
            </div>
          </div>
          
          <div className="w-1/4 flex justify-end items-center space-x-2">
            <div className="relative" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
              <button 
                className="p-2 rounded-full hover:bg-muted"
              >
                {getVolumeIcon()}
              </button>
              
              {showVolumeSlider && (
                <div 
                  className="absolute bottom-full right-0 p-3 bg-card rounded-md shadow-md mb-2 w-32"
                >
                  <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              )}
            </div>
            
            <button 
              className="p-2 rounded-full hover:bg-muted"
              onClick={() => setExpandedPlayer(!expandedPlayer)}
            >
              {expandedPlayer ? <Minimize2 /> : <Maximize2 />}
            </button>
          </div>
        </div>
        
        {/* Expanded player content */}
        {expandedPlayer && (
          <div 
            className="flex-1 p-4 pt-0"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="waveform">Waveform</TabsTrigger>
                <TabsTrigger value="info">Beat Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="waveform" className="h-full">
                <div className="h-32 bg-muted/30 rounded-md overflow-hidden">
                  <canvas 
                    ref={waveformRef} 
                    width={1000} 
                    height={128} 
                    className="w-full h-full"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="info" className="h-full">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{currentBeat.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Artist</p>
                    <p className="font-medium">{currentBeat.artist}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">BPM</p>
                    <p className="font-medium">{currentBeat.bpm}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Key</p>
                    <p className="font-medium">{currentBeat.key}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{formatDuration(currentBeat.duration)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plays</p>
                    <p className="font-medium">{currentBeat.plays.toLocaleString()}</p>
                  </div>
                  
                  {currentBeat.cloudProvider && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Source</p>
                      <div className="flex items-center">
                        <Cloud className="w-4 h-4 mr-1 text-primary" />
                        <p className="font-medium">
                          {currentBeat.cloudProvider === 'dropbox' ? 'Dropbox' : 'Cloud Storage'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}