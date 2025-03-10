// app/page.tsx
import BeatLibrary from "@/components/beat-library"
import { MusicProvider } from "@/components/providers/music-provider"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <MusicProvider>
        <div className="min-h-screen bg-background">
          <BeatLibrary />
        </div>
      </MusicProvider>
    </ThemeProvider>
  )
}