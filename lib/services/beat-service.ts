// lib/services/beat-service.ts
import { supabase } from '../supabase'
import { Beat, Tag, Collection } from '../types'
import { v4 as uuidv4 } from 'uuid'

// Utility function to convert Supabase beat to our Beat type
const convertToBeat = (supabaseBeat: any): Beat => {
  return {
    id: supabaseBeat.id,
    title: supabaseBeat.title,
    artist: supabaseBeat.artist,
    bpm: supabaseBeat.bpm,
    key: supabaseBeat.key,
    duration: supabaseBeat.duration,
    waveformData: [], // We'll need to load this separately
    audioUrl: supabaseBeat.audioUrl,
    imageUrl: supabaseBeat.imageUrl,
    tagIds: [], // We'll need to load this separately
    createdAt: supabaseBeat.createdat,
    plays: supabaseBeat.plays,
    cloudProvider: supabaseBeat.cloudProvider,
    cloudFileId: supabaseBeat.cloudFileId,
    cloudUrl: supabaseBeat.cloudUrl,
    isProcessed: supabaseBeat.isProcessed || false
  }
}

// Fallback mock data in case Supabase isn't set up
const mockBeats: Beat[] = [
  {
    id: "beat1",
    title: "Midnight Demo",
    artist: "Demo Artist",
    bpm: 140,
    key: "C Minor",
    duration: 185,
    waveformData: Array(100).fill(0.5),
    audioUrl: "",
    imageUrl: "/placeholder.svg",
    tagIds: [],
    createdAt: new Date().toISOString(),
    plays: 0,
    cloudProvider: null,
    cloudFileId: null,
    cloudUrl: null,
    isProcessed: false
  }
]

const mockTags: Tag[] = [
  {
    id: "tag1",
    name: "Demo",
    color: "#FF5733"
  }
]

const mockCollections: Collection[] = [
  {
    id: "collection1",
    name: "Demo Collection",
    description: "Demo collection for testing",
    beatIds: ["beat1"],
    createdAt: new Date().toISOString()
  }
]

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  try {
    return Boolean(supabase)
  } catch (error) {
    console.warn('Supabase not configured, using mock data', error)
    return false
  }
}

export const beatService = {
  // Get all beats
  async getBeats(): Promise<Beat[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('Using mock beats data')
        return mockBeats
      }
      
      const { data: beats, error } = await supabase
        .from('beats')
        .select('*')
        .order('createdat', { ascending: false })
      
      if (error) {
        console.error('Error fetching beats:', error)
        return []
      }
      
      if (!beats || beats.length === 0) {
        console.log('No beats found in database')
        return []
      }
      
      // Get tag IDs for each beat
      const beatIds = beats.map(beat => beat.id)
      let beatTags = []
      
      try {
        const { data, error: tagError } = await supabase
          .from('beat_tags')
          .select('beatid, tagid')
          .in('beatid', beatIds)
        
        if (tagError) {
          console.error('Error fetching beat tags:', tagError)
        } else {
          beatTags = data || []
        }
      } catch (tagFetchError) {
        console.error('Exception fetching beat tags:', tagFetchError)
      }
      
      // Create a map of beatId to tagIds
      const tagMap: Record<string, string[]> = {}
      beatTags.forEach(bt => {
        if (!tagMap[bt.beatId]) {
          tagMap[bt.beatId] = []
        }
        tagMap[bt.beatId].push(bt.tagId)
      })
      
      // Convert to our Beat type and include tagIds
      return beats.map(beat => ({
        ...convertToBeat(beat),
        tagIds: tagMap[beat.id] || []
      }))
    } catch (error) {
      console.error('Exception in getBeats:', error)
      return mockBeats
    }
  },
  
  // Get a single beat by ID
  async getBeat(id: string): Promise<Beat | null> {
    try {
      if (!isSupabaseConfigured()) {
        const mockBeat = mockBeats.find(b => b.id === id)
        return mockBeat || null
      }
      
      const { data: beat, error } = await supabase
        .from('beats')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error(`Error fetching beat ${id}:`, error)
        return null
      }
      
      // Get tags for this beat
      let beatTags = []
      try {
        const { data, error: tagError } = await supabase
          .from('beat_tags')
          .select('tagId')
          .eq('beatId', id)
        
        if (tagError) {
          console.error(`Error fetching tags for beat ${id}:`, tagError)
        } else {
          beatTags = data || []
        }
      } catch (tagFetchError) {
        console.error('Exception fetching beat tags:', tagFetchError)
      }
      
      return {
        ...convertToBeat(beat),
        tagIds: beatTags?.map(bt => bt.tagId) || []
      }
    } catch (error) {
      console.error(`Exception in getBeat for ID ${id}:`, error)
      return null
    }
  },
  
  // Create a new beat
  async createBeat(beat: Omit<Beat, 'id' | 'createdAt' | 'plays'>): Promise<Beat | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, cannot create beat')
        return null
      }
      
      const newBeat = {
        id: uuidv4(),
        ...beat,
        createdAt: new Date().toISOString(),
        plays: 0
      }
      
      const { data, error } = await supabase
        .from('beats')
        .insert([
          {
            id: newBeat.id,
            title: newBeat.title,
            artist: newBeat.artist,
            bpm: newBeat.bpm,
            key: newBeat.key,
            duration: newBeat.duration,
            audioUrl: newBeat.audioUrl,
            imageUrl: newBeat.imageUrl,
            cloudProvider: newBeat.cloudProvider,
            cloudFileId: newBeat.cloudFileId,
            cloudUrl: newBeat.cloudUrl,
            createdAt: newBeat.createdAt,
            plays: newBeat.plays,
            isProcessed: newBeat.isProcessed
          }
        ])
        .select()
      
      if (error) {
        console.error('Error creating beat:', error)
        return null
      }
      
      // If we have tags, add them
      if (newBeat.tagIds.length > 0) {
        const beatTagsToInsert = newBeat.tagIds.map(tagId => ({
          beatId: newBeat.id,
          tagId,
          createdAt: new Date().toISOString()
        }))
        
        try {
          const { error: tagError } = await supabase
            .from('beat_tags')
            .insert(beatTagsToInsert)
          
          if (tagError) {
            console.error('Error adding tags to beat:', tagError)
          }
        } catch (tagError) {
          console.error('Exception adding tags to beat:', tagError)
        }
      }
      
      return {
        ...newBeat,
        id: data?.[0]?.id || newBeat.id
      }
    } catch (error) {
      console.error('Exception in createBeat:', error)
      return null
    }
  },
  
  // Update a beat
  async updateBeat(id: string, beat: Partial<Beat>): Promise<Beat | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, cannot update beat')
        return null
      }
      
      const { tagIds, ...beatData } = beat
      
      const { data, error } = await supabase
        .from('beats')
        .update({
          ...beatData,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (error) {
        console.error(`Error updating beat ${id}:`, error)
        return null
      }
      
      // If we're updating tags, remove existing ones and add new ones
      if (tagIds) {
        try {
          // First, remove existing tags
          const { error: deleteError } = await supabase
            .from('beat_tags')
            .delete()
            .eq('beatid', id)
          
          if (deleteError) {
            console.error(`Error removing tags from beat ${id}:`, deleteError)
          }
          
          // Then add new ones
          if (tagIds.length > 0) {
            const beatTagsToInsert = tagIds.map(tagId => ({
              beatId: id,
              tagId,
              createdAt: new Date().toISOString()
            }))
            
            const { error: insertError } = await supabase
              .from('beat_tags')
              .insert(beatTagsToInsert)
            
            if (insertError) {
              console.error(`Error adding tags to beat ${id}:`, insertError)
            }
          }
        } catch (tagError) {
          console.error('Exception updating beat tags:', tagError)
        }
      }
      
      // Get the updated beat with tags
      return this.getBeat(id)
    } catch (error) {
      console.error(`Exception in updateBeat for ID ${id}:`, error)
      return null
    }
  },
  
  // Delete a beat
  async deleteBeat(id: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, cannot delete beat')
        return false
      }
      
      try {
        // First delete relations in beat_tags and collection_beats
        const { error: tagError } = await supabase
          .from('beat_tags')
          .delete()
          .eq('beatid', id)
        
        if (tagError) {
          console.error(`Error deleting tags for beat ${id}:`, tagError)
        }
      } catch (tagError) {
        console.error('Exception deleting beat tags:', tagError)
      }
      
      try {
        const { error: collectionError } = await supabase
          .from('collection_beats')
          .delete()
          .eq('beatid', id)
        
        if (collectionError) {
          console.error(`Error deleting collection relationships for beat ${id}:`, collectionError)
        }
      } catch (collectionError) {
        console.error('Exception deleting collection beats:', collectionError)
      }
      
      // Then delete the beat
      const { error } = await supabase
        .from('beats')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error(`Error deleting beat ${id}:`, error)
        return false
      }
      
      return true
    } catch (error) {
      console.error(`Exception in deleteBeat for ID ${id}:`, error)
      return false
    }
  },
  
  // Add a play count to a beat
  async incrementPlayCount(id: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        return true // Pretend it worked in mock mode
      }
      
      try {
        const { error } = await supabase.rpc('increment_play_count', {
          beat_id: id
        })
        
        if (error) {
          console.error(`Error incrementing play count for beat ${id}:`, error)
          
          // Fallback if the RPC function doesn't exist
          try {
            const { data, error: fetchError } = await supabase
              .from('beats')
              .select('plays')
              .eq('id', id)
              .single()
            
            if (fetchError) {
              console.error(`Error fetching play count for beat ${id}:`, fetchError)
              return false
            }
            
            const { error: updateError } = await supabase
              .from('beats')
              .update({ plays: (data.plays || 0) + 1 })
              .eq('id', id)
            
            if (updateError) {
              console.error(`Error updating play count for beat ${id}:`, updateError)
              return false
            }
          } catch (fallbackError) {
            console.error('Exception in play count fallback:', fallbackError)
            return false
          }
        }
      } catch (rpcError) {
        console.error('Exception calling increment_play_count RPC:', rpcError)
        return false
      }
      
      return true
    } catch (error) {
      console.error(`Exception in incrementPlayCount for ID ${id}:`, error)
      return false
    }
  },
  
  // Import multiple beats (for Dropbox import)
  async importBeats(beats: Omit<Beat, 'id' | 'createdAt' | 'plays'>[]): Promise<Beat[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, cannot import beats')
        return []
      }
      
      console.log('Attempting to import beats with RLS bypass:', beats.length)
      
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
      
      console.log('Auth status:', userId ? 'Authenticated' : 'Not authenticated')
      
      const processedBeats: Beat[] = []
      
      // Process each beat individually using the RLS bypass function
      for (let i = 0; i < beats.length; i++) {
        const beat = beats[i]
        const newId = uuidv4()
        
        try {
          console.log(`Processing beat ${i+1}/${beats.length}: ${beat.title}`)
          
          // Create an audio URL if one isn't provided
          const audioUrl = beat.audioUrl || beat.cloudUrl || 'https://placeholder.com/audio.mp3'
          
          // Use our RLS bypass function
          const { data, error } = await supabase.rpc('insert_beat_bypass_rls', {
            p_id: newId,
            p_title: beat.title || 'Untitled Beat',
            p_artist: beat.artist || 'Unknown Artist',
            p_bpm: beat.bpm || 120,
            p_key: beat.key || 'C Major',
            p_duration: beat.duration || 180,
            p_audio_url: audioUrl,
            p_user_id: userId
          })
          
          if (error) {
            console.error(`Error inserting beat ${i+1}:`, error)
            continue // Skip this beat but continue with others
          }
          
          console.log(`Successfully inserted beat ${i+1} with ID:`, data || newId)
          
          // Now update additional fields that aren't in the initial insert
          if (beat.cloudProvider || beat.cloudFileId || beat.cloudUrl || beat.imageUrl) {
            console.log(`Updating additional fields for beat ${i+1}`)
            
            const { error: updateError } = await supabase
              .from('beats')
              .update({
                cloudProvider: beat.cloudProvider,
                cloudFileId: beat.cloudFileId,
                cloudUrl: beat.cloudUrl,
                imageUrl: beat.imageUrl || '/placeholder.svg'
              })
              .eq('id', data || newId)
            
            if (updateError) {
              console.warn(`Could not update additional fields for beat ${i+1}:`, updateError)
            }
          }
          
          // Add to our processed list
          processedBeats.push({
            id: data || newId,
            title: beat.title || 'Untitled Beat',
            artist: beat.artist || 'Unknown Artist',
            bpm: beat.bpm || 120,
            key: beat.key || 'C Major',
            duration: beat.duration || 180,
            waveformData: [],
            audioUrl: audioUrl,
            imageUrl: beat.imageUrl || '/placeholder.svg',
            tagIds: [],
            createdAt: new Date().toISOString(),
            plays: 0,
            cloudProvider: beat.cloudProvider,
            cloudFileId: beat.cloudFileId,
            cloudUrl: beat.cloudUrl,
            isProcessed: beat.isProcessed || false
          })
          
        } catch (beatError) {
          console.error(`Exception processing beat ${i+1}:`, beatError)
        }
      }
      
      console.log(`Successfully imported ${processedBeats.length} of ${beats.length} beats`)
      return processedBeats
    } catch (error) {
      console.error('Error importing beats:', 
        error instanceof Error ? error.message : error, 
        error instanceof Error ? error.stack : ''
      )
      return []
    }
  }
}


// Tag service
export const tagService = {
  // Get all tags
  async getTags(): Promise<Tag[]> {
    try {
      if (!isSupabaseConfigured()) {
        return mockTags
      }
      
      const { data: tags, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Error fetching tags:', error)
        return []
      }
      
      return tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      }))
    } catch (error) {
      console.error('Exception in getTags:', error)
      return mockTags
    }
  },
  
  // Create a new tag
  async createTag(tag: Omit<Tag, 'id'>): Promise<Tag | null> {
    try {
      if (!isSupabaseConfigured()) {
        return null
      }
      
      const newTag = {
        id: uuidv4(),
        ...tag
      }
      
      const { data, error } = await supabase
        .from('tags')
        .insert([{
          id: newTag.id,
          name: newTag.name,
          color: newTag.color,
          createdAt: new Date().toISOString()
        }])
        .select()
      
      if (error) {
        console.error('Error creating tag:', error)
        return null
      }
      
      return {
        id: data?.[0]?.id || newTag.id,
        name: newTag.name,
        color: newTag.color
      }
    } catch (error) {
      console.error('Exception in createTag:', error)
      return null
    }
  },
  
  // Update a tag
  async updateTag(id: string, tag: Partial<Tag>): Promise<Tag | null> {
    try {
      if (!isSupabaseConfigured()) {
        return null
      }
      
      const { data, error } = await supabase
        .from('tags')
        .update({
          ...tag,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (error) {
        console.error(`Error updating tag ${id}:`, error)
        return null
      }
      
      return data?.[0] ? {
        id: data[0].id,
        name: data[0].name,
        color: data[0].color
      } : null
    } catch (error) {
      console.error(`Exception in updateTag for ID ${id}:`, error)
      return null
    }
  },
  
  // Delete a tag
  async deleteTag(id: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        return false
      }
      
      // First delete beat_tags
      try {
        const { error: tagError } = await supabase
          .from('beat_tags')
          .delete()
          .eq('tagid', id)
        
        if (tagError) {
          console.error(`Error deleting beat relationships for tag ${id}:`, tagError)
        }
      } catch (tagError) {
        console.error(`Exception deleting tag relationships for tag ${id}:`, tagError)
      }
      
      // Then delete the tag
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error(`Error deleting tag ${id}:`, error)
        return false
      }
      
      return true
    } catch (error) {
      console.error(`Exception in deleteTag for ID ${id}:`, error)
      return false
    }
  }
}

// Collection service
export const collectionService = {
  // Get all collections
  async getCollections(): Promise<Collection[]> {
    try {
      if (!isSupabaseConfigured()) {
        return mockCollections
      }
      
      const { data: collections, error } = await supabase
        .from('collections')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Error fetching collections:', error)
        return []
      }
      
      if (!collections || collections.length === 0) {
        return []
      }
      
      // Get beatIds for each collection
      const collectionIds = collections.map(collection => collection.id)
      let collectionBeats = []
      
      try {
        const { data, error: beatsError } = await supabase
          .from('collection_beats')
          .select('collectionid, beatid')
          .in('collectionid', collectionIds)
          .order('position')
        
        if (beatsError) {
          console.error('Error fetching collection beats:', beatsError)
        } else {
          collectionBeats = data || []
        }
      } catch (beatsError) {
        console.error('Exception fetching collection beats:', beatsError)
      }
      
      // Create a map of collectionId to beatIds
      const beatMap: Record<string, string[]> = {}
      collectionBeats.forEach(cb => {
        if (!beatMap[cb.collectionId]) {
          beatMap[cb.collectionId] = []
        }
        beatMap[cb.collectionId].push(cb.beatId)
      })
      
      return collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        description: collection.description || '',
        beatIds: beatMap[collection.id] || [],
        createdAt: collection.createdAt
      }))
    } catch (error) {
      console.error('Exception in getCollections:', error)
      return mockCollections
    }
  },
  
  // Create a collection
  async createCollection(collection: Omit<Collection, 'id' | 'createdAt'>): Promise<Collection | null> {
    try {
      if (!isSupabaseConfigured()) {
        return null
      }
      
      const newCollection = {
        id: uuidv4(),
        ...collection,
        createdAt: new Date().toISOString(),
      }
      
      const { data, error } = await supabase
        .from('collections')
        .insert([{
          id: newCollection.id,
          name: newCollection.name,
          description: newCollection.description,
          createdAt: newCollection.createdAt
        }])
        .select()
      
      if (error) {
        console.error('Error creating collection:', error)
        return null
      }
      
      // Add beats to collection if provided
      if (newCollection.beatIds.length > 0) {
        const collectionBeatsToInsert = newCollection.beatIds.map((beatId, index) => ({
          collectionId: newCollection.id,
          beatId,
          position: index,
          createdAt: new Date().toISOString()
        }))
        
        try {
          const { error: beatsError } = await supabase
            .from('collection_beats')
            .insert(collectionBeatsToInsert)
          
          if (beatsError) {
            console.error('Error adding beats to collection:', beatsError)
          }
        } catch (beatsError) {
          console.error('Exception adding beats to collection:', beatsError)
        }
      }
      
      return {
        ...newCollection,
        id: data?.[0]?.id || newCollection.id
      }
    } catch (error) {
      console.error('Exception in createCollection:', error)
      return null
    }
  }
}