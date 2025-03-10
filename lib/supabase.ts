// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Check if we're in development and if mock mode is enabled
const isMockMode = process.env.NEXT_PUBLIC_MOCK_DB === 'true'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock Supabase client that doesn't actually do anything
const createMockClient = () => {
  console.warn('Using mock Supabase client - no actual database operations will be performed')
  
  // This doesn't actually connect to Supabase - it's just a shell
  // that matches the structure and will fail gracefully
  return {
    from: () => ({
      select: () => ({
        order: () => ({
          in: () => ({
            single: () => ({ data: null, error: { message: 'Mock mode' } }),
            eq: () => ({ data: null, error: { message: 'Mock mode' } }),
          }),
          eq: () => ({ data: null, error: { message: 'Mock mode' } }),
          single: () => ({ data: null, error: { message: 'Mock mode' } }),
        }),
        eq: () => ({ data: null, error: { message: 'Mock mode' } }),
        in: () => ({ data: null, error: { message: 'Mock mode' } }),
        single: () => ({ data: null, error: { message: 'Mock mode' } }),
      }),
      insert: () => ({
        select: () => ({ data: null, error: { message: 'Mock mode' } }),
      }),
      update: () => ({
        eq: () => ({ data: null, error: { message: 'Mock mode' } }),
        select: () => ({ data: null, error: { message: 'Mock mode' } }),
      }),
      delete: () => ({
        eq: () => ({ data: null, error: { message: 'Mock mode' } }),
      }),
    }),
    rpc: () => ({ data: null, error: { message: 'Mock mode' } }),
  }
}

// Create the client or use mock mode
export const supabase = isMockMode ? 
  (createMockClient() as any) : 
  (supabaseUrl && supabaseAnonKey ? 
    createClient<Database>(supabaseUrl, supabaseAnonKey) : 
    createMockClient() as any)