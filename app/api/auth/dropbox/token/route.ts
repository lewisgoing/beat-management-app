// app/api/auth/dropbox/token/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, redirect_uri } = await request.json()
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
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
    
    // Exchange code for token
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirect_uri
      })
    })
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Dropbox token exchange failed:', error)
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: tokenResponse.status }
      )
    }
    
    // Return the token response
    const tokenData = await tokenResponse.json()
    return NextResponse.json(tokenData)
    
  } catch (error) {
    console.error('Error in token exchange:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}