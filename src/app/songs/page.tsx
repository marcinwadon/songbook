import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Music2, Key } from 'lucide-react'

export default async function SongsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch songs - public ones and user's private songs
  const { data: songs, error } = await supabase
    .from('songs')
    .select('*')
    .or(`public.eq.true${user ? `,created_by.eq.${user.id}` : ''}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching songs:', error)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Songs</h1>
          <p className="text-muted-foreground mt-2">Browse and manage your song collection</p>
        </div>
      </div>

      {songs && songs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <Link key={song.id} href={`/songs/${song.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Music2 className="h-5 w-5 text-muted-foreground" />
                    {!song.public && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        Private
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-2">{song.title}</CardTitle>
                  {song.key && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Key className="h-3 w-3" />
                      Key of {song.key}
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
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No songs yet</h2>
            <p className="text-muted-foreground mb-4">
              {user ? "Start by adding your first song" : "Sign in to add songs"}
            </p>
            {user && (
              <Link href="/admin/songs/new">
                <Button>Add Your First Song</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}