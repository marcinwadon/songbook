'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Music2, Key, Search, X } from 'lucide-react'

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

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSongs()
  }, [])

  useEffect(() => {
    // Filter songs based on search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = songs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.content.toLowerCase().includes(query) ||
        (song.key && song.key.toLowerCase().includes(query))
      )
      setFilteredSongs(filtered)
    } else {
      setFilteredSongs(songs)
    }
  }, [searchQuery, songs])

  async function fetchSongs() {
    setLoading(true)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    // Fetch songs - public ones and user's private songs
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .or(`public.eq.true${user ? `,created_by.eq.${user.id}` : ''}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching songs:', error)
    } else {
      setSongs(data || [])
      setFilteredSongs(data || [])
    }

    setLoading(false)
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pieśni</h1>
            <p className="text-muted-foreground mt-2">Przeglądaj i zarządzaj swoją kolekcją pieśni</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Szukaj pieśni po tytule, tekście lub tonacji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Znaleziono {filteredSongs.length} {filteredSongs.length === 1 ? 'pieśń' : 'pieśni'}
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ładowanie pieśni...</p>
        </div>
      ) : filteredSongs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSongs.map((song) => (
            <Link key={song.id} href={`/songs/${song.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Music2 className="h-5 w-5 text-muted-foreground" />
                    {!song.public && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        Prywatna
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-2">{song.title}</CardTitle>
                  {song.key && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Key className="h-3 w-3" />
                      Tonacja: {song.key}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {new Date(song.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : searchQuery ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nie znaleziono pieśni</h2>
            <p className="text-muted-foreground">
              Spróbuj wyszukać używając innych słów kluczowych
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Brak pieśni</h2>
            <p className="text-muted-foreground mb-4">
              {user ? "Zacznij od dodania swojej pierwszej pieśni" : "Zaloguj się, aby dodać pieśni"}
            </p>
            {user && (
              <Link href="/admin/songs/new">
                <Button>Dodaj pierwszą pieśń</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}