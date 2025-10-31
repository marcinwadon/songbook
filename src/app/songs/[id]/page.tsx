'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChordProRenderer } from '@/components/songs/chord-pro-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Edit, Trash2, Maximize2, Key } from 'lucide-react'
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
  const [isFullscreen, setIsFullscreen] = useState(false)
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
    return (
      <div className="min-h-screen bg-background p-8" onClick={toggleFullscreen}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{song.title}</h1>
          {currentKey && (
            <p className="text-xl text-muted-foreground mb-8">Key: {currentKey}</p>
          )}
          <div className="text-2xl leading-loose">
            <ChordProRenderer content={song.content} transpose={transpose} />
          </div>
        </div>
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
              {/* Transpose Controls */}
              <div className="mb-6 flex items-center gap-4">
                <label className="text-sm font-medium">Transpose:</label>
                <Select value={transpose.toString()} onValueChange={handleTranspose}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Original</SelectItem>
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

              {/* Song Content */}
              <div className="bg-muted/20 p-6 rounded-lg">
                <ChordProRenderer
                  content={song.content}
                  transpose={transpose}
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