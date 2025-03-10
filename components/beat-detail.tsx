"use client"

import { useState } from "react"
import { Beat } from "@/lib/types"
import { useMusic } from "@/components/providers/music-provider"
import { formatDuration } from "@/lib/utils"
import { X, Play, Pause, Heart, Share2, Download, Plus, Edit, TagIcon, FolderPlus } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import DynamicBeatCover from "@/components/dynamic-beat-cover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BeatDetailProps {
  beat: Beat
  onClose: () => void
}

export default function BeatDetail({ beat, onClose }: BeatDetailProps) {
  const { currentBeat, setCurrentBeat, isPlaying, togglePlay, tags, addTagToBeat, removeTagFromBeat } = useMusic()
  const [activeTab, setActiveTab] = useState("overview")
  const [editMode, setEditMode] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  
  const isCurrentlyPlaying = currentBeat?.id === beat.id && isPlaying
  
  const handlePlayPause = () => {
    if (currentBeat?.id === beat.id) {
      togglePlay()
    } else {
      setCurrentBeat(beat)
    }
  }
  
  const beatTags = tags.filter(tag => beat.tagIds.includes(tag.id))
  const availableTags = tags.filter(tag => !beat.tagIds.includes(tag.id))
  
  const handleAddTag = (tagId: string) => {
    addTagToBeat(beat.id, tagId)
  }
  
  const handleRemoveTag = (tagId: string) => {
    removeTagFromBeat(beat.id, tagId)
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{beat.title}</DialogTitle>
            <motion.button 
              className="rounded-full h-8 w-8 inline-flex items-center justify-center border border-transparent hover:bg-muted"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
          <DialogDescription>
            By {beat.artist}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="aspect-square rounded-md overflow-hidden relative group">
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
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                whileHover={{ opacity: 1 }}
              >
                <motion.button 
                  className="rounded-full w-16 h-16 bg-primary flex items-center justify-center text-primary-foreground"
                  onClick={handlePlayPause}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </motion.button>
              </motion.div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1 mr-2">
                <Button variant="outline" className="w-full">
                  <Heart className="mr-2 h-4 w-4" />
                  Favorite
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1 mr-2">
                <Button variant="outline" className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </motion.div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="overview">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">BPM</Label>
                        <p className="text-lg font-medium">{beat.bpm}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Key</Label>
                        <p className="text-lg font-medium">{beat.key}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Duration</Label>
                        <p className="text-lg font-medium">{formatDuration(beat.duration)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Plays</Label>
                        <p className="text-lg font-medium">{beat.plays.toLocaleString()}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Added On</Label>
                        <p className="text-lg font-medium">{formatDate(beat.createdAt)}</p>
                      </div>
                      
                      <div className="col-span-2 mt-4">
                        <Label className="text-muted-foreground">Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {beatTags.length > 0 ? (
                            beatTags.map(tag => (
                              <motion.div
                                key={tag.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Badge 
                                  style={{ 
                                    backgroundColor: `${tag.color}20`, 
                                    color: tag.color,
                                    borderColor: tag.color
                                  }}
                                >
                                  {tag.name}
                                </Badge>
                              </motion.div>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No tags added</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <Label className="text-muted-foreground">Waveform</Label>
                      <div className="h-24 bg-muted/30 rounded-md mt-1">
                        {/* Waveform visualization would go here */}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tags">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Current Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {beatTags.length > 0 ? (
                            beatTags.map(tag => (
                              <motion.div
                                key={tag.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Badge 
                                  variant="outline"
                                  style={{ 
                                    backgroundColor: `${tag.color}20`, 
                                    color: tag.color,
                                    borderColor: tag.color
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5"
                                >
                                  {tag.name}
                                  <motion.button 
                                    className="h-4 w-4 ml-1 hover:bg-transparent rounded-full inline-flex items-center justify-center"
                                    onClick={() => handleRemoveTag(tag.id)}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <X className="h-3 w-3" />
                                  </motion.button>
                                </Badge>
                              </motion.div>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No tags added yet</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Add Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {availableTags.length > 0 ? (
                            availableTags.map(tag => (
                              <motion.div
                                key={tag.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Badge 
                                  variant="outline"
                                  style={{ 
                                    color: tag.color,
                                    borderColor: tag.color
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 cursor-pointer hover:bg-muted"
                                  onClick={() => handleAddTag(tag.id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {tag.name}
                                </Badge>
                              </motion.div>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No more tags available</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Create New Tag</h3>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Tag name" 
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                          />
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button>
                              <TagIcon className="h-4 w-4 mr-2" />
                              Create Tag
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="collections">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Current Collections</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {/* This would show collections that contain this beat */}
                          <motion.div 
                            className="flex items-center justify-between p-3 border rounded-md"
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          >
                            <div className="flex items-center">
                              <FolderPlus className="h-5 w-5 mr-2 text-muted-foreground" />
                              <span>Favorites</span>
                            </div>
                            <motion.button 
                              className="p-1 rounded-full hover:bg-muted"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="h-4 w-4" />
                            </motion.button>
                          </motion.div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Add to Collection</h3>
                        <div className="grid grid-cols-1 gap-2">
                          <motion.div 
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          >
                            <div className="flex items-center">
                              <FolderPlus className="h-5 w-5 mr-2 text-muted-foreground" />
                              <span>For Recording</span>
                            </div>
                            <motion.button 
                              className="p-1 rounded-full hover:bg-muted"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Plus className="h-4 w-4" />
                            </motion.button>
                          </motion.div>
                          <motion.div 
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          >
                            <div className="flex items-center">
                              <FolderPlus className="h-5 w-5 mr-2 text-muted-foreground" />
                              <span>Inspiration</span>
                            </div>
                            <motion.button 
                              className="p-1 rounded-full hover:bg-muted"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Plus className="h-4 w-4" />
                            </motion.button>
                          </motion.div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Create New Collection</h3>
                        <div className="flex gap-2">
                          <Input placeholder="Collection name" />
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button>
                              <FolderPlus className="h-4 w-4 mr-2" />
                              Create
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={() => setEditMode(!editMode)}>
              <Edit className="h-4 w-4 mr-2" />
              {editMode ? "Save Changes" : "Edit Beat"}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}