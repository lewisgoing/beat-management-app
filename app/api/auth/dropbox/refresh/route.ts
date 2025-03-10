// app/api/auth/dropbox/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json()
    
    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }
    
    // Get environment variables
    const clientId = process.env.DROPBOX_CLIENT_ID
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      console.error('Missing Dropbox credentials in environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    // Refresh the token
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        refresh_token,
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret
      })
    })
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Dropbox token refresh failed:', error)
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: tokenResponse.status }
      )
    }
    
    // Return the refreshed token data
    const tokenData = await tokenResponse.json()
    return NextResponse.json(tokenData)
    
  } catch (error) {
    console.error('Error in token refresh:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}