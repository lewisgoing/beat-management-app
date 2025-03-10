"use client"

import { useState, useRef, useEffect } from "react"
import { useMusic } from "@/components/providers/music-provider"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Repeat, Shuffle, Maximize2, Minimize2 } from 'lucide-react'
import { Slider } from "@/components/ui/slider"
import { formatDuration } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import DynamicBeatCover from "@/components/dynamic-beat-cover"

export default function AudioPlayer() {
  const { 
    currentBeat, 
    isPlaying, 
    togglePlay, 
    volume, 
    setVolume, 
    currentTime, 
    duration,
    setCurrentTime
  } = useMusic()
  
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [expandedPlayer, setExpandedPlayer] = useState(false)
  const [activeTab, setActiveTab] = useState("waveform")
  
  const waveformRef = useRef<HTMLCanvasElement>(null)
  const spectrumRef = useRef<HTMLCanvasElement>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Initialize audio analyzer for visualizations
  useEffect(() => {
    if (!currentBeat) return
    
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyzerRef.current = audioContextRef.current.createAnalyser()
      analyzerRef.current.fftSize = 256
    }
    
    // Clean up on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [currentBeat])
  
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
  
  // Draw frequency spectrum
  useEffect(() => {
    if (!currentBeat || !spectrumRef.current || !analyzerRef.current || !isPlaying) return
    
    const canvas = spectrumRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    
    const bufferLength = analyzerRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const drawSpectrum = () => {
      if (!analyzerRef.current) return
      
      analyzerRef.current.getByteFrequencyData(dataArray)
      
      // Clear canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      
      const barWidth = (canvasWidth / bufferLength) * 2.5
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvasHeight
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvasHeight, 0, 0)
        gradient.addColorStop(0, '#22c55e')
        gradient.addColorStop(0.5, '#eab308')
        gradient.addColorStop(1, '#ef4444')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight)
        
        x += barWidth + 1
      }
      
      animationFrameRef.current = requestAnimationFrame(drawSpectrum)
    }
    
    drawSpectrum()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [currentBeat, isPlaying])
  
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
    <motion.div 
      className={`border-t bg-card transition-all fixed bottom-0 left-0 right-0 z-10 ${
        expandedPlayer ? 'h-80' : 'h-24'
      }`}
      layout
      transition={{ duration: 0.3 }}
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
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center space-x-4 mb-2">
              <motion.button 
                className="text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Shuffle className="w-4 h-4" />
              </motion.button>
              <motion.button 
                className="text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <SkipBack className="w-5 h-5" />
              </motion.button>
              <motion.button 
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                onClick={togglePlay}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </motion.button>
              <motion.button 
                className="text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <SkipForward className="w-5 h-5" />
              </motion.button>
              <motion.button 
                className="text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Repeat className="w-4 h-4" />
              </motion.button>
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
                  max={duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="relative z-10"
                />
              </div>
              
              <span className="text-xs text-muted-foreground w-10">
                {formatDuration(duration)}
              </span>
            </div>
          </div>
          
          <div className="w-1/4 flex justify-end items-center space-x-2">
            <div className="relative" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
              <motion.button 
                className="p-2 rounded-full hover:bg-muted"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {getVolumeIcon()}
              </motion.button>
              
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div 
                    className="absolute bottom-full right-0 p-3 bg-card rounded-md shadow-md mb-2 w-32"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <Slider
                      value={[volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.button 
              className="p-2 rounded-full hover:bg-muted"
              onClick={() => setExpandedPlayer(!expandedPlayer)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {expandedPlayer ? <Minimize2 /> : <Maximize2 />}
            </motion.button>
          </div>
        </div>
        
        {/* Expanded player content */}
        <AnimatePresence>
          {expandedPlayer && (
            <motion.div 
              className="flex-1 p-4 pt-0"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="waveform">Waveform</TabsTrigger>
                  <TabsTrigger value="spectrum">Spectrum</TabsTrigger>
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
                
                <TabsContent value="spectrum" className="h-full">
                  <div className="h-32 bg-muted/30 rounded-md overflow-hidden">
                    <canvas 
                      ref={spectrumRef} 
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
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}