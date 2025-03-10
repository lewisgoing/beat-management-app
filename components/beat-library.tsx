"use client"

import { useState, useEffect } from "react"
import { useMusic } from "@/components/providers/music-provider"
import { Beat, Tag } from "@/lib/types"
import BeatGrid from "@/components/beat-grid"
import BeatList from "@/components/beat-list"
import TagFilter from "@/components/tag-filter"
import AudioPlayer from "@/components/audio-player"
import AppSidebar from "@/components/app-sidebar"
import BeatDetail from "@/components/beat-detail"
import CloudSyncStatus from "@/components/cloud-sync-status"
import ImportFromDropbox from "@/components/import-from-dropbox"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { LayoutGrid, List, SlidersHorizontal, ChevronDown, X, Cloud } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FavoritesView from "@/components/views/favorites-view"
import RecentView from "@/components/views/recent-view"
import TagsManagementView from "@/components/views/tags-management-view"
import CollectionView from "@/components/views/collection-view"

// Musical keys for filter
const MUSICAL_KEYS = [
  "C Major", "C Minor", 
  "C# Major", "C# Minor", 
  "D Major", "D Minor", 
  "D# Major", "D# Minor", 
  "E Major", "E Minor", 
  "F Major", "F Minor", 
  "F# Major", "F# Minor", 
  "G Major", "G Minor", 
  "G# Major", "G# Minor", 
  "A Major", "A Minor", 
  "A# Major", "A# Minor", 
  "B Major", "B Minor"
]

export default function BeatLibrary() {
  const { beats, tags, collections } = useMusic()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Filters
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 200])
  
  // Sort
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "artist" | "bpm" | "plays">("newest")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  // Beat detail modal
  const [selectedBeatForDetail, setSelectedBeatForDetail] = useState<Beat | null>(null)
  
  // Current view based on sidebar selection
  const [currentView, setCurrentView] = useState<string>("library")
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  
  // Cloud sync status
  const [showCloudStatus, setShowCloudStatus] = useState(false)
  
  const { openDropboxPicker } = useMusic()
  
  // Listen for sidebar navigation changes
  useEffect(() => {
    const handleSidebarNavChange = (e: CustomEvent) => {
      const { view, collectionId } = e.detail
      setCurrentView(view)
      setSelectedCollection(collectionId || null)
    }
    
    window.addEventListener('sidebar-nav-change' as any, handleSidebarNavChange)
    
    return () => {
      window.removeEventListener('sidebar-nav-change' as any, handleSidebarNavChange)
    }
  }, [])

  const filteredBeats = beats
    .filter(beat => {
      // Filter by tag if selected
      if (selectedTag && !beat.tagIds.includes(selectedTag)) {
        return false
      }
      
      // Filter by key if selected
      if (selectedKey && beat.key !== selectedKey) {
        return false
      }
      
      // Filter by BPM range
      if (beat.bpm < bpmRange[0] || beat.bpm > bpmRange[1]) {
        return false
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          beat.title.toLowerCase().includes(query) ||
          beat.artist.toLowerCase().includes(query)
        )
      }
      
      return true
    })
    .sort((a, b) => {
      // Sort based on selected sort option
      switch (sortBy) {
        case "newest":
          return sortDirection === "desc" 
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "oldest":
          return sortDirection === "desc"
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "title":
          return sortDirection === "desc"
            ? b.title.localeCompare(a.title)
            : a.title.localeCompare(b.title)
        case "artist":
          return sortDirection === "desc"
            ? b.artist.localeCompare(a.artist)
            : a.artist.localeCompare(b.artist)
        case "bpm":
          return sortDirection === "desc"
            ? b.bpm - a.bpm
            : a.bpm - b.bpm
        case "plays":
          return sortDirection === "desc"
            ? b.plays - a.plays
            : a.plays - b.plays
        default:
          return 0
      }
    })

  const resetFilters = () => {
    setSelectedTag(null)
    setSelectedKey(null)
    setBpmRange([60, 200])
    setSearchQuery("")
  }

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }
  
  const openBeatDetail = (beat: Beat) => {
    setSelectedBeatForDetail(beat)
  }
  
  const closeBeatDetail = () => {
    setSelectedBeatForDetail(null)
  }
  
  // Render the appropriate view based on sidebar selection
  const renderCurrentView = () => {
    switch (currentView) {
      case "home":
        return (
          <motion.div 
            className="p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="text-3xl font-bold mb-6">Welcome to <span className="text-primary">&lt;3&Soul</span></h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div 
                className="bg-card p-6 rounded-lg border"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
                <p className="text-muted-foreground">Your recent beats and activity will appear here.</p>
              </motion.div>
              <motion.div 
                className="bg-card p-6 rounded-lg border"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-semibold mb-2">Quick Stats</h2>
                <p className="text-muted-foreground">You have {beats.length} beats in your library.</p>
              </motion.div>
              <motion.div 
                className="bg-card p-6 rounded-lg border"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
                <p className="text-muted-foreground">Organize your beats with tags and collections.</p>
              </motion.div>
            </div>
          </motion.div>
        )
      case "library":
        return (
          <motion.div 
            className="flex flex-col flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Beat Library</h1>
                
                <div className="flex items-center space-x-2">
                  {/* Cloud sync button */}
                  <motion.button
                    className="relative p-2 rounded-full hover:bg-muted"
                    onClick={() => setShowCloudStatus(!showCloudStatus)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Cloud className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
                  </motion.button>
                  
                  {/* Search input */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search beats..."
                      className="w-64 px-4 py-2"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <motion.button 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setSearchQuery("")}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                  
                  {/* View mode toggle */}
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <motion.button
                      className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                      onClick={() => setViewMode("grid")}
                      title="Grid View"
                      whileHover={viewMode !== "grid" ? { backgroundColor: "rgba(0,0,0,0.05)" } : {}}
                      whileTap={{ scale: 0.95 }}
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                      onClick={() => setViewMode("list")}
                      title="List View"
                      whileHover={viewMode !== "list" ? { backgroundColor: "rgba(0,0,0,0.05)" } : {}}
                      whileTap={{ scale: 0.95 }}
                    >
                      <List className="w-5 h-5" />
                    </motion.button>
                  </div>
                  
                  {/* Sort dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        className="flex items-center gap-1 px-3 py-2 border rounded-md hover:bg-muted"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Sort
                        <ChevronDown className="w-4 h-4" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem 
                        checked={sortBy === "newest"}
                        onCheckedChange={() => setSortBy("newest")}
                      >
                        Newest
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem 
                        checked={sortBy === "oldest"}
                        onCheckedChange={() => setSortBy("oldest")}
                      >
                        Oldest
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem 
                        checked={sortBy === "title"}
                        onCheckedChange={() => setSortBy("title")}
                      >
                        Title
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem 
                        checked={sortBy === "artist"}
                        onCheckedChange={() => setSortBy("artist")}
                      >
                        Artist
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem 
                        checked={sortBy === "bpm"}
                        onCheckedChange={() => setSortBy("bpm")}
                      >
                        BPM
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem 
                        checked={sortBy === "plays"}
                        onCheckedChange={() => setSortBy("plays")}
                      >
                        Plays
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={toggleSortDirection}>
                        {sortDirection === "asc" ? "Ascending ↑" : "Descending ↓"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Filters sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <motion.button
                        className="flex items-center gap-1 px-3 py-2 border rounded-md hover:bg-muted"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <SlidersHorizontal className="w-4 h-4 mr-1" />
                        Filters
                      </motion.button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      
                      <div className="py-4 space-y-6">
                        {/* Key filter */}
                        <div className="space-y-2">
                          <Label htmlFor="key-filter">Key</Label>
                          <select
                            id="key-filter"
                            className="w-full p-2 border rounded-md"
                            value={selectedKey || ""}
                            onChange={(e) => setSelectedKey(e.target.value || null)}
                          >
                            <option value="">Any Key</option>
                            {MUSICAL_KEYS.map(key => (
                              <option key={key} value={key}>{key}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* BPM range filter */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>BPM Range</Label>
                            <span className="text-sm text-muted-foreground">
                              {bpmRange[0]} - {bpmRange[1]} BPM
                            </span>
                          </div>
                          <Slider
                            defaultValue={bpmRange}
                            min={60}
                            max={200}
                            step={1}
                            value={bpmRange}
                            onValueChange={(value) => setBpmRange(value as [number, number])}
                            className="py-4"
                          />
                        </div>
                      </div>
                      
                      <SheetFooter>
                        <Button variant="outline" onClick={resetFilters}>
                          Reset Filters
                        </Button>
                        <SheetClose asChild>
                          <Button>Apply Filters</Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              
              <TagFilter 
                tags={tags} 
                selectedTag={selectedTag} 
                onSelectTag={setSelectedTag} 
              />
              
              {/* Active filters display */}
              <div className="flex items-center flex-wrap gap-2 mt-2">
                {selectedKey && (
                  <motion.div 
                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    layout
                  >
                    <span>Key: {selectedKey}</span>
                    <motion.button 
                      onClick={() => setSelectedKey(null)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  </motion.div>
                )}
                
                {(bpmRange[0] !== 60 || bpmRange[1] !== 200) && (
                  <motion.div 
                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    layout
                  >
                    <span>BPM: {bpmRange[0]}-{bpmRange[1]}</span>
                    <motion.button 
                      onClick={() => setBpmRange([60, 200])}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  </motion.div>
                )}
                
                {(selectedTag || selectedKey || bpmRange[0] !== 60 || bpmRange[1] !== 200) && (
                  <motion.button 
                    className="text-xs text-primary hover:underline"
                    onClick={resetFilters}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear all filters
                  </motion.button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {viewMode === "grid" ? (
                  <motion.div
                    key="grid-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BeatGrid beats={filteredBeats} onBeatClick={openBeatDetail} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="list-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <BeatList 
                      beats={filteredBeats} 
                      sortBy={sortBy} 
                      sortDirection={sortDirection} 
                      onBeatClick={openBeatDetail}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {filteredBeats.length === 0 && (
                <motion.div 
                  className="flex flex-col items-center justify-center h-full text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-medium mb-2">No beats found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={resetFilters}>Clear all filters</Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )
      case "favorites":
        return <FavoritesView onBeatClick={openBeatDetail} />
      case "recent":
        return <RecentView onBeatClick={openBeatDetail} />
      case "tags":
        return <TagsManagementView />
      case "collection":
        return <CollectionView 
          collectionId={selectedCollection} 
          onBeatClick={openBeatDetail}
        />
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a view from the sidebar</p>
          </div>
        )
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {showCloudStatus && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CloudSyncStatus onClose={() => setShowCloudStatus(false)} />
                  <ImportFromDropbox />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex-1 overflow-auto flex flex-col min-h-0">
              {renderCurrentView()}
            </div>
          </div>
          
          <AudioPlayer />
        </div>
        
      </div>
      
      
      <AnimatePresence>
        {selectedBeatForDetail && (
          <BeatDetail 
            beat={selectedBeatForDetail} 
            onClose={closeBeatDetail} 
          />
        )}
      </AnimatePresence>

    </SidebarProvider>
  )
}