import BeatLibrary from "@/components/beat-library"
import { MusicProvider } from "@/components/providers/music-provider"

export default function Home() {
  return (
    <MusicProvider>
      <div className="min-h-screen bg-background">
        <BeatLibrary />
      </div>
    </MusicProvider>
  )
}

