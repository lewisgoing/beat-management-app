// app/auth/dropbox/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function DropboxCallback() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    // Verify state to prevent CSRF
    const savedState = localStorage.getItem('dropboxAuthState')
    
    if (errorParam || errorDescription) {
      const errorMessage = errorDescription || errorParam || 'Authentication failed'
      setStatus('Authentication failed')
      setError(errorMessage)
      
      // Send error back to opener if available
      if (window.opener) {
        window.opener.postMessage({
          type: 'dropbox_auth_callback',
          error: errorMessage
        }, window.location.origin)
        
        // Close this window after a short delay
        setTimeout(() => window.close(), 2000)
      }
      return
    }
    
    if (!code) {
      setStatus('Authentication failed')
      setError('No authorization code received')
      
      // Send error back to opener if available
      if (window.opener) {
        window.opener.postMessage({
          type: 'dropbox_auth_callback',
          error: 'No authorization code received'
        }, window.location.origin)
        
        // Close this window after a short delay
        setTimeout(() => window.close(), 2000)
      }
      return
    }
    
    if (state !== savedState) {
      setStatus('Authentication failed')
      setError('State mismatch. Possible security risk.')
      
      // Send error back to opener if available
      if (window.opener) {
        window.opener.postMessage({
          type: 'dropbox_auth_callback',
          error: 'State mismatch. Possible CSRF attack.'
        }, window.location.origin)
        
        // Close this window after a short delay
        setTimeout(() => window.close(), 2000)
      }
      return
    }
    
    // Authentication was successful
    setStatus('Authentication successful!')
    
    // Send success message with auth code back to opener window
    if (window.opener) {
      try {
        window.opener.postMessage({
          type: 'dropbox_auth_callback',
          code
        }, window.location.origin)
        
        // Close this window after a short delay
        setTimeout(() => window.close(), 1500)
      } catch (err) {
        console.error('Error posting message to opener:', err)
        setError('Failed to communicate with parent window')
      }
    } else {
      setError('Opener window not found. Please close this window and try again.')
    }
  }, [searchParams])
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">{status}</h1>
        
        {error ? (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        ) : (
          <div className="text-center mb-4">
            <p className="text-muted-foreground">
              This window will close automatically once authentication is complete.
            </p>
          </div>
        )}
        
        <div className="text-center">
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Close Manually
          </button>
        </div>
      </div>
    </div>
  )
}