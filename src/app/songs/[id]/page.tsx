'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChordProRenderer, ChordDisplay } from '@/components/songs/chord-pro-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Edit, Trash2, Maximize2, Key, Music } from 'lucide-react'
import { toast } from 'sonner'
import { KEYS } from '@/lib/chords/transposer'

interface Song {
  id: string
  title: string
  key: string | null
  content: string
  public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export default function SongPage() {
  const params = useParams()
  const router = useRouter()
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [transpose, setTranspose] = useState(0)
  const [currentKey, setCurrentKey] = useState<string>('')
  const [chordDisplay, setChordDisplay] = useState<ChordDisplay>('above')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(70) // percentage
  const [currentVerse, setCurrentVerse] = useState(0)
  const [verses, setVerses] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSong()
    checkUserPermissions()
  }, [params.id])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (song?.content) {
      // Split content into verses by double newlines
      const versesArray = song.content
        .split(/\n\s*\n/)
        .filter(verse => verse.trim().length > 0)
      setVerses(versesArray)
      setCurrentVerse(0)
    }
  }, [song?.content])

  useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setCurrentVerse(prev => Math.min(prev + 1, verses.length - 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentVerse(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFontSize(prev => Math.min(prev + 10, 200))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFontSize(prev => Math.max(prev - 10, 50))
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, verses.length])

  async function fetchSong() {
    setLoading(true)
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching song:', error)
      toast.error('Song not found')
      router.push('/songs')
    } else {
      setSong(data)
      setCurrentKey(data.key || 'C')
    }
    setLoading(false)
  }

  async function checkUserPermissions() {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check if admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      setIsAdmin(roleData?.role === 'admin')

      // Check if owner
      if (song) {
        setIsOwner(song.created_by === user.id)
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this song?')) return

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', params.id)

    if (error) {
      toast.error('Failed to delete song')
    } else {
      toast.success('Song deleted successfully')
      router.push('/songs')
    }
  }

  const handleTranspose = (value: string) => {
    const semitones = parseInt(value)
    setTranspose(semitones)

    // Update current key display
    if (song?.key) {
      // This is simplified - in production you'd calculate the actual new key
      setCurrentKey(song.key)
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
      toast.error('Nie udało się przełączyć trybu pełnoekranowego')
    }
  }

  const nextVerse = () => {
    if (currentVerse < verses.length - 1) {
      setCurrentVerse(currentVerse + 1)
    }
  }

  const previousVerse = () => {
    if (currentVerse > 0) {
      setCurrentVerse(currentVerse - 1)
    }
  }

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 10, 200))
  }

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 10, 50))
  }

  const handleFullscreenClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on control buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }

    // Click on left side = previous, right side = next
    const clickX = e.clientX
    const screenWidth = window.innerWidth

    if (clickX < screenWidth / 3) {
      previousVerse()
    } else if (clickX > (screenWidth * 2) / 3) {
      nextVerse()
    } else {
      // Center click - next verse (most common action)
      nextVerse()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading song...</div>
      </div>
    )
  }

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Song not found</div>
      </div>
    )
  }

  if (isFullscreen) {
    const currentVerseContent = verses[currentVerse] || song.content

    return (
      <div
        className="fullscreen min-h-screen bg-background flex items-center justify-center p-8 cursor-pointer"
        onClick={handleFullscreenClick}
      >
        {/* Control buttons - top right */}
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <Button
            variant="secondary"
            size="sm"
            onClick={decreaseFontSize}
            className="text-lg font-bold"
          >
            A-
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={increaseFontSize}
            className="text-lg font-bold"
          >
            A+
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              toggleFullscreen()
            }}
          >
            Wyjdź
          </Button>
        </div>

        {/* Verse indicator - top left */}
        {verses.length > 1 && (
          <div className="absolute top-4 left-4 text-lg text-muted-foreground z-50">
            {currentVerse + 1} / {verses.length}
          </div>
        )}

        <div className="fullscreen-view w-full">
          <div className="max-w-6xl mx-auto" style={{ fontSize: `${fontSize}%` }}>
            <h1 className="text-3xl font-bold mb-4 text-center">{song.title}</h1>
            {currentKey && (
              <p className="text-xl text-muted-foreground mb-6 text-center">Tonacja: {currentKey}</p>
            )}
            <div className="leading-loose">
              <ChordProRenderer
                content={currentVerseContent}
                transpose={transpose}
                chordDisplay={chordDisplay}
              />
            </div>
          </div>
        </div>

        {/* Navigation hints - bottom */}
        {verses.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-muted-foreground text-sm flex gap-4">
            {currentVerse > 0 && <span>← Poprzednia</span>}
            {currentVerse < verses.length - 1 && <span>Następna →</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/songs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Songs
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              {(isAdmin || isOwner) && (
                <>
                  <Link href={`/admin/songs/${song.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Pełny ekran
              </Button>
            </div>
          </div>

          {/* Song Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{song.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {song.key && (
                  <span className="flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    Original key: {song.key}
                  </span>
                )}
                {!song.public && (
                  <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
                    Private
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Controls */}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                {/* Transpose Controls */}
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Transpozycja:</label>
                  <Select value={transpose.toString()} onValueChange={handleTranspose}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Oryginalna</SelectItem>
                      <SelectItem value="-6">-6 (♭6)</SelectItem>
                      <SelectItem value="-5">-5 (♭5)</SelectItem>
                      <SelectItem value="-4">-4 (♭4)</SelectItem>
                      <SelectItem value="-3">-3 (♭3)</SelectItem>
                      <SelectItem value="-2">-2 (♭2)</SelectItem>
                      <SelectItem value="-1">-1 (♭1)</SelectItem>
                      <SelectItem value="1">+1 (♯1)</SelectItem>
                      <SelectItem value="2">+2 (♯2)</SelectItem>
                      <SelectItem value="3">+3 (♯3)</SelectItem>
                      <SelectItem value="4">+4 (♯4)</SelectItem>
                      <SelectItem value="5">+5 (♯5)</SelectItem>
                      <SelectItem value="6">+6 (♯6)</SelectItem>
                    </SelectContent>
                  </Select>
                  {transpose !== 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTranspose(0)
                        setCurrentKey(song.key || 'C')
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>

                {/* Chord Display Controls */}
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Wyświetlanie akordów:</label>
                  <Select value={chordDisplay} onValueChange={(value) => setChordDisplay(value as ChordDisplay)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Nad tekstem</SelectItem>
                      <SelectItem value="right">Po prawej</SelectItem>
                      <SelectItem value="hidden">Ukryte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Song Content */}
              <div className="bg-muted/20 p-6 rounded-lg">
                <ChordProRenderer
                  content={song.content}
                  transpose={transpose}
                  chordDisplay={chordDisplay}
                  className="text-lg"
                />
              </div>

              {/* Metadata */}
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Created: {new Date(song.created_at).toLocaleDateString()}</p>
                <p>Updated: {new Date(song.updated_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}