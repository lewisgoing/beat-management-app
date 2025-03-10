// hooks/use-cloud-storage.ts
"use client"

import { useState, useEffect } from 'react'
import { CloudStorageProvider } from '../lib/types'

type ProviderType = 'dropbox' | 'google_drive'

interface AuthResponse {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  name?: string
  email?: string
}

export function useCloudStorage() {
  const [connectedProviders, setConnectedProviders] = useState<CloudStorageProvider[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Load saved providers from localStorage on mount
    loadSavedProviders()
  }, [])
  
  const loadSavedProviders = () => {
    try {
      const savedProvidersJson = localStorage.getItem('cloudStorageProviders')
      if (savedProvidersJson) {
        const providers = JSON.parse(savedProvidersJson)
        
        // Convert string dates back to Date objects
        providers.forEach((provider: CloudStorageProvider) => {
          provider.expiresAt = new Date(provider.expiresAt)
        })
        
        setConnectedProviders(providers)
      }
    } catch (err) {
      console.error('Failed to load saved providers:', err)
      setError('Failed to load saved authentication data')
    }
  }
  
  const saveProviders = (providers: CloudStorageProvider[]) => {
    try {
      localStorage.setItem('cloudStorageProviders', JSON.stringify(providers))
    } catch (err) {
      console.error('Failed to save providers:', err)
      setError('Failed to save authentication data')
    }
  }
  
  const connectToDropbox = async (): Promise<AuthResponse> => {
    // Dropbox OAuth flow
    const clientId = process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID
    if (!clientId) {
      throw new Error('Dropbox client ID not configured')
    }
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2)
    localStorage.setItem('dropboxAuthState', state)
    
    // Build redirect URI
    const redirectUri = `${window.location.origin}/auth/dropbox/callback`
    
    // Create OAuth URL
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&token_access_type=offline`
    
    // Open popup window
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    const authWindow = window.open(
      authUrl,
      'Connect to Dropbox',
      `width=${width},height=${height},left=${left},top=${top}`
    )
    
    if (!authWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.')
    }
    
    // Wait for auth result via message passing
    return new Promise((resolve, reject) => {
      const handleMessage = async (event: MessageEvent) => {
        // Only accept messages from our own origin
        if (event.origin !== window.location.origin) return
        
        // Check if this is from our auth window
        if (event.data?.type !== 'dropbox_auth_callback') return
        
        // Remove listener
        window.removeEventListener('message', handleMessage)
        
        // Check for error
        if (event.data.error) {
          reject(new Error(event.data.error))
          return
        }
        
        // Check for auth code
        const code = event.data.code
        if (!code) {
          reject(new Error('No authorization code received'))
          return
        }
        
        try {
          // Exchange code for tokens
          const response = await fetch('/api/auth/dropbox/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code,
              redirect_uri: redirectUri
            })
          })
          
          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.statusText}`)
          }
          
          const tokens = await response.json()
          
          // Get user info
          const userInfoResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`
            }
          })
          
          if (!userInfoResponse.ok) {
            throw new Error(`Failed to get user info: ${userInfoResponse.statusText}`)
          }
          
          const userInfo = await userInfoResponse.json()
          
          resolve({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in || 14400, // Default 4 hours
            name: userInfo.name?.display_name,
            email: userInfo.email
          })
        } catch (err) {
          console.error('Authentication error:', err)
          reject(err)
        }
      }
      
      // Listen for the auth result
      window.addEventListener('message', handleMessage)
    })
  }
  
  const connectProvider = async (type: ProviderType): Promise<CloudStorageProvider> => {
    setIsConnecting(true)
    setError(null)
    
    try {
      let authResponse: AuthResponse
      
      // Handle different provider types
      if (type === 'dropbox') {
        authResponse = await connectToDropbox()
      } else {
        throw new Error(`Unsupported provider type: ${type}`)
      }
      
      // Create provider object
      const newProvider: CloudStorageProvider = {
        id: `${type}_${Date.now()}`,
        type,
        accountName: authResponse.name || 'Unknown',
        accountEmail: authResponse.email || 'Unknown',
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken || '',
        expiresAt: new Date(Date.now() + (authResponse.expiresIn * 1000)),
        isConnected: true
      }
      
      // Update state
      setConnectedProviders(prev => {
        // Replace if provider of same type exists
        const updated = prev.filter(p => p.type !== type)
        return [...updated, newProvider]
      })
      
      // Save to localStorage
      saveProviders([...connectedProviders.filter(p => p.type !== type), newProvider])
      
      return newProvider
    } catch (err) {
      console.error('Failed to connect provider:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect')
      throw err
    } finally {
      setIsConnecting(false)
    }
  }
  
  const disconnectProvider = async (providerId: string): Promise<void> => {
    setError(null)
    try {
      const provider = connectedProviders.find(p => p.id === providerId)
      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`)
      }
      
      // Revoke token (if provider API supports it)
      if (provider.type === 'dropbox') {
        try {
          await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider.accessToken}`
            }
          })
        } catch (err) {
          console.warn('Failed to revoke token:', err)
          // Continue with disconnection even if revoke fails
        }
      }
      
      // Update state
      const updatedProviders = connectedProviders.filter(p => p.id !== providerId)
      setConnectedProviders(updatedProviders)
      
      // Save to localStorage
      saveProviders(updatedProviders)
      
    } catch (err) {
      console.error('Failed to disconnect provider:', err)
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
      throw err
    }
  }
  
  const refreshAuth = async (providerId: string): Promise<void> => {
    setError(null)
    try {
      const provider = connectedProviders.find(p => p.id === providerId)
      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`)
      }
      
      if (!provider.refreshToken) {
        throw new Error('No refresh token available')
      }
      
      // Token refresh API call
      const response = await fetch('/api/auth/dropbox/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: provider.refreshToken
        })
      })
      
      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`)
      }
      
      const tokens = await response.json()
      
      // Update provider
      const updatedProvider = {
        ...provider,
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + (tokens.expires_in * 1000))
      }
      
      // Update state
      setConnectedProviders(prev => 
        prev.map(p => p.id === providerId ? updatedProvider : p)
      )
      
      // Save to localStorage
      saveProviders(
        connectedProviders.map(p => p.id === providerId ? updatedProvider : p)
      )
      
    } catch (err) {
      console.error('Failed to refresh authentication:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh authentication')
      throw err
    }
  }
  
  const getProvider = async (typeOrId: string): Promise<CloudStorageProvider | null> => {
    // Try to find by ID first
    let provider = connectedProviders.find(p => p.id === typeOrId)
    
    // Then try by type
    if (!provider) {
      provider = connectedProviders.find(p => p.type === typeOrId)
    }
    
    if (!provider) {
      return null
    }
    
    // Check if token needs refresh (1 minute buffer)
    if (provider.expiresAt.getTime() < Date.now() + 60000) {
      try {
        await refreshAuth(provider.id)
        // Get the refreshed provider
        return connectedProviders.find(p => p.id === provider?.id) || null
      } catch (err) {
        console.error('Failed to refresh token:', err)
        return null
      }
    }
    
    return provider
  }
  
  return {
    connectedProviders,
    isConnecting,
    error,
    connectProvider,
    disconnectProvider,
    refreshAuth,
    getProvider
  }
}