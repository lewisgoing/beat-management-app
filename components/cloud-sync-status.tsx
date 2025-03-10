"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Cloud, Check, X, RefreshCw, Settings, Database } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface CloudSyncStatusProps {
  onClose: () => void
}

export default function CloudSyncStatus({ onClose }: CloudSyncStatusProps) {
  const [syncProgress, setSyncProgress] = useState(87)
  const [autoSync, setAutoSync] = useState(true)
  const [syncOnWifi, setSyncOnWifi] = useState(true)
  
  return (
    <motion.div 
      className="bg-card border-b p-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Cloud className="w-5 h-5 mr-2 text-primary" />
          <h3 className="font-medium">Cloud Sync Status</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/30 p-3 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Last Sync</span>
            <span className="text-xs text-muted-foreground">2 minutes ago</span>
          </div>
          <div className="flex items-center text-green-500">
            <Check className="w-4 h-4 mr-1" />
            <span className="text-sm">Sync Complete</span>
          </div>
        </div>
        
        <div className="bg-muted/30 p-3 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Storage Usage</span>
            <span className="text-xs text-muted-foreground">2.4 GB / 10 GB</span>
          </div>
          <Progress value={24} className="h-2" />
        </div>
        
        <div className="bg-muted/30 p-3 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Current Sync</span>
            <span className="text-xs text-muted-foreground">{syncProgress}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={syncProgress} className="h-2 flex-1" />
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-sync" 
              checked={autoSync} 
              onCheckedChange={setAutoSync} 
            />
            <Label htmlFor="auto-sync">Auto Sync</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="wifi-only" 
              checked={syncOnWifi} 
              onCheckedChange={setSyncOnWifi} 
            />
            <Label htmlFor="wifi-only">WiFi Only</Label>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Database className="w-4 h-4 mr-1" />
            <span>Manage Storage</span>
          </Button>
          <Button size="sm" className="h-8">
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Sync Now</span>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}