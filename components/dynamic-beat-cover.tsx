"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Beat } from "@/lib/types"

interface DynamicBeatCoverProps {
  beat: Beat
  size?: number
  className?: string
}

export default function DynamicBeatCover({ beat, size = 300, className = "" }: DynamicBeatCoverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Generate a unique pattern based on beat metadata
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size)
    
    // Create a gradient background based on the beat's key
    const keyColors: Record<string, [string, string]> = {
      "C Major": ["#FF5733", "#FFC300"],
      "C Minor": ["#900C3F", "#581845"],
      "D Major": ["#33FF57", "#00C9FF"],
      "D Minor": ["#1E8449", "#117864"],
      "E Major": ["#3357FF", "#9933FF"],
      "E Minor": ["#273746", "#1F618D"],
      "F Major": ["#FF33F5", "#FF5733"],
      "F Minor": ["#8E44AD", "#3498DB"],
      "G Major": ["#33FFF5", "#33FF57"],
      "G Minor": ["#117A65", "#1E8449"],
      "A Major": ["#FF3393", "#3357FF"],
      "A Minor": ["#5B2C6F", "#2471A3"],
      "B Major": ["#F4D03F", "#FF5733"],
      "B Minor": ["#7D6608", "#B7950B"],
    }
    
    // Default colors if key not found
    const [color1, color2] = keyColors[beat.key] || ["#3498DB", "#2ECC71"]
    
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, color1)
    gradient.addColorStop(1, color2)
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    
    // Draw patterns based on BPM
    const patternCount = Math.floor(beat.bpm / 20)
    
    // Create a unique pattern based on the beat's title (for consistency)
    const seed = beat.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const random = (min: number, max: number) => {
      const x = Math.sin(seed * 9999) * 10000
      return min + (x - Math.floor(x)) * (max - min)
    }
    
    // Pattern style based on BPM range
    if (beat.bpm < 90) {
      // Slow beats: Circles
      ctx.globalAlpha = 0.6
      for (let i = 0; i < patternCount; i++) {
        const x = random(0, size)
        const y = random(0, size)
        const radius = random(10, 40)
        
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fill()
      }
    } else if (beat.bpm < 120) {
      // Medium beats: Lines
      ctx.globalAlpha = 0.5
      for (let i = 0; i < patternCount; i++) {
        const x1 = random(0, size)
        const y1 = random(0, size)
        const x2 = random(0, size)
        const y2 = random(0, size)
        const lineWidth = random(1, 5)
        
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = lineWidth
        ctx.stroke()
      }
    } else {
      // Fast beats: Squares/rectangles
      ctx.globalAlpha = 0.5
      for (let i = 0; i < patternCount; i++) {
        const x = random(0, size)
        const y = random(0, size)
        const width = random(10, 50)
        const height = random(10, 50)
        const rotation = random(0, Math.PI * 2)
        
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rotation)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(-width/2, -height/2, width, height)
        ctx.restore()
      }
    }
    
    // Add artist initial and title initial as a watermark
    const artistInitial = beat.artist.charAt(0).toUpperCase()
    const titleInitial = beat.title.charAt(0).toUpperCase()
    
    ctx.globalAlpha = 0.8
    ctx.font = `bold ${size/3}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillText(`${artistInitial}${titleInitial}`, size/2, size/2)
    
    // Add BPM text
    ctx.globalAlpha = 1
    ctx.font = `bold ${size/10}px sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillText(`${beat.bpm} BPM`, size - 10, size - 10)
    
    // Add key text
    ctx.textAlign = 'left'
    ctx.fillText(beat.key, 10, size - 10)
    
  }, [beat, size])
  
  return (
    <motion.canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-md ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    />
  )
}