// lib/services/cloud-storage.ts
import { CloudStorageProvider } from '../types'

// Abstract class for all cloud storage providers
export abstract class CloudStorageService {
  protected accessToken: string
  protected refreshToken: string
  protected expiresAt: Date
  
  constructor(provider: CloudStorageProvider) {
    this.accessToken = provider.accessToken
    this.refreshToken = provider.refreshToken
    this.expiresAt = provider.expiresAt
  }
  
  abstract refreshAuth(): Promise<void>
  abstract getFileMetadata(fileId: string): Promise<any>
  abstract getStreamUrl(fileId: string): Promise<string>
  abstract getDownloadUrl(fileId: string): Promise<string>
  abstract listAudioFiles(folderId?: string): Promise<any[]>
  abstract searchFiles(query: string): Promise<any[]>
}

// Dropbox implementation
export class DropboxService extends CloudStorageService {
  async refreshAuth(): Promise<void> {
    try {
      // Refresh token implementation
      const response = await fetch('/api/auth/dropbox/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        })
      })
      
      if (!response.ok) {
        throw new Error(`Refresh token failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      this.accessToken = data.access_token
      this.expiresAt = new Date(Date.now() + (data.expires_in * 1000))
    } catch (error) {
      console.error('Failed to refresh auth token:', error)
      throw error
    }
  }
  
  async getFileMetadata(fileId: string): Promise<any> {
    try {
      console.log(`Getting metadata for file: ${fileId}`)
      // Call Dropbox API to get file metadata
      const response = await fetch(
        'https://api.dropboxapi.com/2/files/get_metadata',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: fileId,
            include_media_info: true
          })
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Metadata API error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Failed to get file metadata: ${response.status} ${response.statusText}`)
      }
      
      return response.json()
    } catch (error) {
      console.error('Failed to get file metadata:', error)
      throw error
    }
  }
  
  async getStreamUrl(fileId: string): Promise<string> {
    try {
      console.log(`Getting stream URL for file: ${fileId}`)
      // Get temporary link for streaming
      const response = await fetch(
        'https://api.dropboxapi.com/2/files/get_temporary_link',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: fileId
          })
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Stream URL API error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Failed to get stream URL: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Got temporary link:', data.link ? 'success' : 'failed')
      return data.link
    } catch (error) {
      console.error('Failed to get streaming URL:', error)
      throw error
    }
  }
  
  async getDownloadUrl(fileId: string): Promise<string> {
    // Same as stream URL for Dropbox
    return this.getStreamUrl(fileId)
  }
  
  async listAudioFiles(folderId?: string): Promise<any[]> {
    try {
      // List audio files from Dropbox folder
      const path = folderId || ''
      console.log(`Listing files in folder: ${path || 'root'}`)
      
      const reqBody = {
        path: path,
        recursive: false,
        include_media_info: true,
        include_deleted: false,
        include_has_explicit_shared_members: false
      }
      
      console.log('Request body:', JSON.stringify(reqBody))
      
      const response = await fetch(
        'https://api.dropboxapi.com/2/files/list_folder',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reqBody)
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`List files API error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Failed to list files: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`Got ${data.entries?.length || 0} entries from Dropbox`)
      
      // Filter only audio files
      const audioFiles = data.entries.filter((entry: any) => 
        entry['.tag'] === 'file' && 
        /\.(mp3|wav|aac|flac|m4a|ogg)$/i.test(entry.name)
      )
      
      const folders = data.entries.filter((entry: any) => 
        entry['.tag'] === 'folder'
      )
      
      console.log(`Found ${audioFiles.length} audio files and ${folders.length} folders`)
      
      return data.entries
    } catch (error) {
      console.error('Failed to list audio files:', error)
      throw error
    }
  }
  
  async searchFiles(query: string): Promise<any[]> {
    try {
      console.log(`Searching for files matching query: "${query}"`)
      // Search for files matching query
      const response = await fetch(
        'https://api.dropboxapi.com/2/files/search_v2',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query,
            options: {
              file_extensions: ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg']
            }
          })
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Search API error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Search failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`Found ${data.matches?.length || 0} matching files`)
      return data.matches?.map((match: any) => match.metadata.metadata) || []
    } catch (error) {
      console.error('Failed to search files:', error)
      throw error
    }
  }
}

// Factory to create appropriate service based on provider type
export function createCloudStorageService(provider: CloudStorageProvider): CloudStorageService {
  switch (provider.type) {
    case 'dropbox':
      return new DropboxService(provider)
    default:
      throw new Error(`Unsupported provider: ${provider.type}`)
  }
}