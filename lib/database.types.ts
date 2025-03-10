// lib/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      beats: {
        Row: {
          id: string
          title: string
          artist: string
          bpm: number
          key: string
          duration: number
          audioUrl: string
          imageUrl: string
          cloudProvider: string | null
          cloudFileId: string | null
          cloudUrl: string | null
          createdAt: string
          updatedAt: string | null
          plays: number
          isProcessed: boolean
          userId: string | null
        }
        Insert: {
          id?: string
          title: string
          artist: string
          bpm: number
          key: string
          duration: number
          audioUrl: string
          imageUrl?: string
          cloudProvider?: string | null
          cloudFileId?: string | null
          cloudUrl?: string | null
          createdAt?: string
          updatedAt?: string | null
          plays?: number
          isProcessed?: boolean
          userId?: string | null
        }
        Update: {
          id?: string
          title?: string
          artist?: string
          bpm?: number
          key?: string
          duration?: number
          audioUrl?: string
          imageUrl?: string
          cloudProvider?: string | null
          cloudFileId?: string | null
          cloudUrl?: string | null
          createdAt?: string
          updatedAt?: string | null
          plays?: number
          isProcessed?: boolean
          userId?: string | null
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string
          createdAt: string
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          id?: string
          name: string
          color: string
          createdAt?: string
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          id?: string
          name?: string
          color?: string
          createdAt?: string
          updatedAt?: string | null
          userId?: string | null
        }
      }
      beat_tags: {
        Row: {
          id: string
          beatId: string
          tagId: string
          createdAt: string
        }
        Insert: {
          id?: string
          beatId: string
          tagId: string
          createdAt?: string
        }
        Update: {
          id?: string
          beatId?: string
          tagId?: string
          createdAt?: string
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          description: string
          createdAt: string
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string
          createdAt?: string
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          createdAt?: string
          updatedAt?: string | null
          userId?: string | null
        }
      }
      collection_beats: {
        Row: {
          id: string
          collectionId: string
          beatId: string
          position: number
          createdAt: string
        }
        Insert: {
          id?: string
          collectionId: string
          beatId: string
          position?: number
          createdAt?: string
        }
        Update: {
          id?: string
          collectionId?: string
          beatId?: string
          position?: number
          createdAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}