// lib/services/cache-manager.ts
'use client'

class CacheManager {
  private dbName = 'beatCacheDB'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private isInitialized = false
  private isClient = typeof window !== 'undefined'
  
  constructor() {
    // Don't initialize in constructor to avoid SSR issues
    // Will initialize on first use instead
  }
  
  private async initDatabase(): Promise<void> {
    // Skip if not in browser or already initialized
    if (!this.isClient || this.isInitialized) {
      return Promise.resolve()
    }
    
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported - caching unavailable')
        this.isInitialized = true
        resolve()
        return
      }
      
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('audioFiles')) {
          db.createObjectStore('audioFiles', { keyPath: 'id' })
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' })
          metadataStore.createIndex('lastAccessed', 'lastAccessed', { unique: false })
          metadataStore.createIndex('size', 'size', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('waveforms')) {
          db.createObjectStore('waveforms', { keyPath: 'id' })
        }
      }
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        this.isInitialized = true
        console.log('Cache database initialized')
        resolve()
      }
      
      request.onerror = (event) => {
        console.error('Database error:', (event.target as IDBOpenDBRequest).error)
        reject((event.target as IDBOpenDBRequest).error)
      }
    })
  }
  
  async getCacheSize(): Promise<number> {
    if (!this.isClient) return 0
    if (!this.isInitialized) await this.initDatabase()
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(0)
        return
      }
      
      const transaction = this.db.transaction(['metadata'], 'readonly')
      const store = transaction.objectStore('metadata')
      const countRequest = store.openCursor()
      
      let totalSize = 0
      
      countRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          totalSize += cursor.value.size || 0
          cursor.continue()
        } else {
          resolve(totalSize)
        }
      }
      
      countRequest.onerror = () => {
        reject(new Error('Failed to calculate cache size'))
      }
    })
  }
  
  async cacheAudio(beatId: string, audioData: ArrayBuffer): Promise<void> {
    if (!this.isClient) return
    if (!this.isInitialized) await this.initDatabase()
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }
      
      const transaction = this.db.transaction(['audioFiles', 'metadata'], 'readwrite')
      
      // Store audio data
      const audioStore = transaction.objectStore('audioFiles')
      audioStore.put({
        id: beatId,
        data: audioData,
        timestamp: Date.now()
      })
      
      // Update metadata
      const metadataStore = transaction.objectStore('metadata')
      metadataStore.put({
        id: beatId,
        lastAccessed: Date.now(),
        size: audioData.byteLength
      })
      
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
  
  async cacheWaveform(beatId: string, waveformData: number[]): Promise<void> {
    if (!this.isClient) return
    if (!this.isInitialized) await this.initDatabase()
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }
      
      const transaction = this.db.transaction(['waveforms'], 'readwrite')
      const store = transaction.objectStore('waveforms')
      
      store.put({
        id: beatId,
        data: waveformData,
        timestamp: Date.now()
      })
      
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
  
  async getCachedAudio(beatId: string): Promise<ArrayBuffer | null> {
    if (!this.isClient) return null
    if (!this.isInitialized) await this.initDatabase()
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null)
        return
      }
      
      const transaction = this.db.transaction(['audioFiles', 'metadata'], 'readwrite')
      const audioStore = transaction.objectStore('audioFiles')
      const metadataStore = transaction.objectStore('metadata')
      
      const request = audioStore.get(beatId)
      
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          // Update last accessed timestamp
          metadataStore.get(beatId).onsuccess = (event) => {
            const metadata = (event.target as IDBRequest).result
            if (metadata) {
              metadata.lastAccessed = Date.now()
              metadataStore.put(metadata)
            }
          }
          
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }
  
  async getCachedWaveform(beatId: string): Promise<number[] | null> {
    if (!this.isClient) return null
    if (!this.isInitialized) await this.initDatabase()
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null)
        return
      }
      
      const transaction = this.db.transaction(['waveforms'], 'readonly')
      const store = transaction.objectStore('waveforms')
      
      const request = store.get(beatId)
      
      request.onsuccess = () => {
        resolve(request.result?.data || null)
      }
      
      request.onerror = () => reject(request.error)
    })
  }
  
  async clearCache(): Promise<void> {
    if (!this.isClient) return
    if (!this.isInitialized) await this.initDatabase()
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }
      
      const transaction = this.db.transaction(['audioFiles', 'metadata', 'waveforms'], 'readwrite')
      transaction.objectStore('audioFiles').clear()
      transaction.objectStore('metadata').clear()
      transaction.objectStore('waveforms').clear()
      
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
  
  async removeCachedBeat(beatId: string): Promise<void> {
    if (!this.isClient) return
    if (!this.isInitialized) await this.initDatabase()
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }
      
      const transaction = this.db.transaction(['audioFiles', 'metadata', 'waveforms'], 'readwrite')
      transaction.objectStore('audioFiles').delete(beatId)
      transaction.objectStore('metadata').delete(beatId)
      transaction.objectStore('waveforms').delete(beatId)
      
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
  
  async getCacheStats(): Promise<{ size: number, count: number }> {
    if (!this.isClient) return { size: 0, count: 0 }
    if (!this.isInitialized) await this.initDatabase()
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve({ size: 0, count: 0 })
        return
      }
      
      const transaction = this.db.transaction(['metadata'], 'readonly')
      const store = transaction.objectStore('metadata')
      const countRequest = store.count()
      
      countRequest.onsuccess = async () => {
        const count = countRequest.result
        const size = await this.getCacheSize()
        
        resolve({
          size,
          count
        })
      }
      
      countRequest.onerror = () => reject(countRequest.error)
    })
  }
}

// Only create the singleton instance on the client side
const cacheManager = typeof window !== 'undefined' ? new CacheManager() : null

// Export a function that safely accesses the cache manager
export function getCacheManager() {
  return cacheManager
}