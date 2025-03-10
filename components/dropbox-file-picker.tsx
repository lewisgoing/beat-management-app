// components/dropbox-file-picker.tsx
'use client'

import { useState, useEffect } from 'react'
import { useCloudStorage } from '@/hooks/use-cloud-storage'
import { createCloudStorageService } from '@/lib/services/cloud-storage'
import { Beat } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Cloud, 
  Loader2, 
  Search, 
  Music, 
  Folder, 
  ArrowLeft,
  FileMusic,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface FileItem {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  isAudio: boolean
}

interface DropboxFilePickerProps {
  onFilesSelected: (files: Beat[]) => void
  onClose: () => void
}

export default function DropboxFilePicker({ onFilesSelected, onClose }: DropboxFilePickerProps) {
  const { connectedProviders, connectProvider, isConnecting, error: authError } = useCloudStorage()
  const [currentTab, setCurrentTab] = useState('browse')
  const [isLoading, setIsLoading] = useState(false)
  const [fileList, setFileList] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [pathHistory, setPathHistory] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  
  // Check if Dropbox is connected
  const dropboxProvider = connectedProviders.find(p => p.type === 'dropbox')
  
  // Load initial file list when component mounts or provider changes
  useEffect(() => {
    if (dropboxProvider && currentTab === 'browse') {
      loadFiles(currentPath)
    }
  }, [dropboxProvider, currentTab])
  
  // Load files from specified path
  const loadFiles = async (path: string) => {
    if (!dropboxProvider) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const service = createCloudStorageService(dropboxProvider)
      console.log(`Loading files from path: ${path || 'root'}`)
      
      try {
        const files = await service.listAudioFiles(path)
        
        // Transform to our internal format
        const transformedFiles: FileItem[] = files.map(file => ({
          id: file.id || file.path_lower,
          name: file.name,
          path: file.path_lower,
          type: file['.tag'] as 'file' | 'folder',
          size: file.size,
          isAudio: file['.tag'] === 'file' && /\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(file.name)
        }))
        
        // Sort: folders first, then by name
        const sortedFiles = transformedFiles.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })
        
        console.log(`Loaded ${sortedFiles.length} files (${sortedFiles.filter(f => f.type === 'folder').length} folders, ${sortedFiles.filter(f => f.isAudio).length} audio files)`)
        setFileList(sortedFiles)
        setCurrentPath(path)
      } catch (apiError) {
        console.error('API error loading files:', apiError)
        setError(`Failed to load files: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`)
        setFileList([])
      }
    } catch (error) {
      console.error('Failed to load files:', error)
      setError(`Failed to load files: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setFileList([])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Navigate to a folder
  const navigateToFolder = (path: string) => {
    setPathHistory(prev => [...prev, currentPath])
    loadFiles(path)
  }
  
  // Go back to previous folder
  const goBack = () => {
    if (pathHistory.length === 0) return
    
    const previousPath = pathHistory[pathHistory.length - 1]
    setPathHistory(prev => prev.slice(0, -1))
    loadFiles(previousPath)
  }
  
  // Search for files
  const handleSearch = async () => {
    if (!searchQuery.trim() || !dropboxProvider) return
    
    try {
      setSearching(true)
      setError(null)
      
      const service = createCloudStorageService(dropboxProvider)
      console.log(`Searching for: "${searchQuery}"`)
      
      try {
        const results = await service.searchFiles(searchQuery)
        
        // Transform to our internal format
        const transformedFiles: FileItem[] = results.map(file => ({
          id: file.id || file.path_lower,
          name: file.name,
          path: file.path_lower,
          type: 'file',
          size: file.size,
          isAudio: /\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(file.name)
        }))
        
        console.log(`Found ${transformedFiles.length} results (${transformedFiles.filter(f => f.isAudio).length} audio files)`)
        setFileList(transformedFiles)
      } catch (apiError) {
        console.error('API error searching files:', apiError)
        setError(`Search failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`)
        setFileList([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setFileList([])
    } finally {
      setSearching(false)
    }
  }
  
  // Toggle file selection
  const toggleFileSelection = (file: FileItem) => {
    if (!file.isAudio) return
    
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id)
      
      if (isSelected) {
        return prev.filter(f => f.id !== file.id)
      } else {
        return [...prev, file]
      }
    })
  }
  
  // Connect to Dropbox
  const handleConnectDropbox = async () => {
    setError(null)
    try {
      await connectProvider('dropbox')
    } catch (error) {
      console.error('Failed to connect to Dropbox:', error)
      setError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // Import selected files as beats
  const importSelectedFiles = async () => {
    if (selectedFiles.length === 0 || !dropboxProvider) return
    
    try {
      setImportLoading(true)
      setError(null)
      console.log(`Importing ${selectedFiles.length} files`)
      
      const service = createCloudStorageService(dropboxProvider)
      
      // Convert selected files to beats
      const beats: Beat[] = await Promise.all(
        selectedFiles.map(async (file, index) => {
          console.log(`Processing file ${index + 1}/${selectedFiles.length}: ${file.name}`)
          try {
            // Get streaming URL
            const streamUrl = await service.getStreamUrl(file.path)
            console.log(`Got stream URL for ${file.name}`, streamUrl)
            
            // Extract file name without extension as title
            const title = file.name.replace(/\.[^/.]+$/, '')
            
            // Try to get some basic file duration (can be enhanced later)
            // For now we'll use a placeholder
            const duration = 180 // 3 minutes as a default
            
            // TODO: We could analyze the file for BPM, key, etc. here
            // For now, use placeholders
            return {
              id: `dropbox_${Date.now()}_${file.id}`,
              title,
              artist: 'Unknown Artist', // This could be extracted from ID3 tags
              bpm: 120, // Placeholder
              key: 'C Major', // Placeholder
              duration, 
              waveformData: Array(100).fill(0.5), // Placeholder waveform
              audioUrl: streamUrl,
              imageUrl: '/placeholder.svg',
              tagIds: [],
              createdAt: new Date().toISOString(),
              plays: 0,
              cloudProvider: 'dropbox',
              cloudFileId: file.path,
              cloudUrl: streamUrl,
              isProcessed: false
            }
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError)
            // Return a default beat with error indication
            return {
              id: `dropbox_error_${Date.now()}_${file.id}`,
              title: `${file.name} (Error)`,
              artist: 'Import Error',
              bpm: 120,
              key: 'Unknown',
              duration: 0,
              waveformData: Array(100).fill(0.5),
              audioUrl: '',
              imageUrl: '/placeholder.svg',
              tagIds: [],
              createdAt: new Date().toISOString(),
              plays: 0,
              cloudProvider: 'dropbox',
              cloudFileId: file.path,
              cloudUrl: '',
              isProcessed: false
            }
          }
        })
      )
      
      console.log(`Successfully prepared ${beats.length} beats for import`)
      
      // Pass beats to parent component
      onFilesSelected(beats)
      onClose()
      
    } catch (error) {
      console.error('Failed to import files:', error)
      setError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setImportLoading(false)
    }
  }
  
  // Display not connected state
  if (!dropboxProvider) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Connect to Dropbox</h2>
        
        <p className="mb-6 text-muted-foreground">
          Connect your Dropbox account to browse and import your music files.
        </p>
        
        {authError && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {authError}
          </div>
        )}
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <Button 
          onClick={handleConnectDropbox} 
          disabled={isConnecting}
          className="flex items-center"
        >
          {isConnecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Cloud className="mr-2 h-4 w-4" />
          )}
          Connect Dropbox
        </Button>
        
        {isConnecting && (
          <div className="mt-4 text-sm text-muted-foreground">
            A popup window should appear. If it was blocked, please allow popups for this site and try again.
            <br />
            After authenticating in the popup, you'll be redirected back here automatically.
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="p-0">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <div className="border-b px-4">
          <TabsList className="mb-0">
            <TabsTrigger value="browse">
              <Folder className="mr-2 h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="p-4">
          <TabsContent value="browse" className="m-0">
            {/* Navigation bar */}
            <div className="flex items-center mb-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={goBack}
                disabled={pathHistory.length === 0 || isLoading}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="bg-muted text-muted-foreground px-3 py-2 rounded-md text-sm flex-1 truncate">
                {currentPath || 'Root'}
              </div>
            </div>
            
            {/* File list */}
            <div className="border rounded-md overflow-hidden mb-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-4 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Error loading files</p>
                      <p>{error}</p>
                      <div className="mt-2">
                        <Button variant="outline" size="sm" onClick={() => loadFiles('')} className="flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : fileList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Music className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No files found in this location</p>
                </div>
              ) : (
                <div className="divide-y">
                  {fileList.map((file) => (
                    <div 
                      key={file.id}
                      className={`flex items-center p-3 hover:bg-muted/50 transition-colors ${
                        file.type === 'folder' ? 'cursor-pointer' : 
                        file.isAudio ? 'cursor-pointer' : 'opacity-50'
                      }`}
                      onClick={() => file.type === 'folder' 
                        ? navigateToFolder(file.path)
                        : file.isAudio && toggleFileSelection(file)
                      }
                    >
                      {file.type === 'folder' ? (
                        <Folder className="h-5 w-5 text-muted-foreground mr-3" />
                      ) : file.isAudio ? (
                        <FileMusic className="h-5 w-5 text-primary mr-3" />
                      ) : (
                        <FileMusic className="h-5 w-5 text-muted-foreground mr-3" />
                      )}
                      
                      <div className="flex-1 truncate">
                        <span>{file.name}</span>
                      </div>
                      
                      {file.isAudio && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center
                          ${selectedFiles.some(f => f.id === file.id) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'border border-muted-foreground/30'
                          }`}
                        >
                          {selectedFiles.some(f => f.id === file.id) && (
                            <Check className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="search" className="m-0">
            {/* Search form */}
            <div className="flex items-center mb-4">
              <Input
                type="text"
                placeholder="Search for audio files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 mr-2"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch} 
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
            
            {/* Error message */}
            {error && currentTab === 'search' && (
              <div className="bg-destructive/10 text-destructive p-4 text-sm rounded-md mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Search error</p>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Search results */}
            {fileList.length > 0 && currentTab === 'search' && (
              <div className="border rounded-md overflow-hidden mb-4">
                <div className="divide-y">
                  {fileList.map((file) => (
                    <div 
                      key={file.id}
                      className={`flex items-center p-3 hover:bg-muted/50 transition-colors ${
                        file.isAudio ? 'cursor-pointer' : 'opacity-50'
                      }`}
                      onClick={() => file.isAudio && toggleFileSelection(file)}
                    >
                      {file.isAudio ? (
                        <FileMusic className="h-5 w-5 text-primary mr-3" />
                      ) : (
                        <FileMusic className="h-5 w-5 text-muted-foreground mr-3" />
                      )}
                      
                      <div className="flex-1 truncate">
                        <span>{file.name}</span>
                        <div className="text-xs text-muted-foreground truncate">
                          {file.path}
                        </div>
                      </div>
                      
                      {file.isAudio && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center
                          ${selectedFiles.some(f => f.id === file.id) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'border border-muted-foreground/30'
                          }`}
                        >
                          {selectedFiles.some(f => f.id === file.id) && (
                            <Check className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {searching && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {!searching && fileList.length === 0 && currentTab === 'search' && searchQuery && (
              <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audio files found matching "{searchQuery}"</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Selected files summary */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{selectedFiles.length}</span> files selected
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <Button 
              onClick={importSelectedFiles}
              disabled={selectedFiles.length === 0 || importLoading}
            >
              {importLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>Import Selected</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}