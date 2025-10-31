'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ChordProRenderer } from '@/components/songs/chord-pro-renderer'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
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

export default function EditSongPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [originalSong, setOriginalSong] = useState<Song | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    key: 'C',
    content: '',
    public: true
  })

  const supabase = createClient()

  useEffect(() => {
    fetchSong()
  }, [params.id])

  async function fetchSong() {
    setLoading(true)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('You must be logged in')
      router.push('/login')
      return
    }

    // Fetch the song
    const { data: song, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !song) {
      console.error('Error fetching song:', error)
      toast.error('Song not found')
      router.push('/songs')
      return
    }

    // Check permissions
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = roleData?.role === 'admin'
    const isOwner = song.created_by === user.id

    if (!isAdmin && !isOwner) {
      toast.error('You do not have permission to edit this song')
      router.push(`/songs/${song.id}`)
      return
    }

    setOriginalSong(song)
    setFormData({
      title: song.title,
      key: song.key || 'C',
      content: song.content,
      public: song.public
    })
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Please enter a song title')
      return
    }

    if (!formData.content.trim()) {
      toast.error('Please enter song content')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('songs')
      .update({
        title: formData.title.trim(),
        key: formData.key,
        content: formData.content.trim(),
        public: formData.public
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating song:', error)
      toast.error('Failed to update song')
    } else {
      toast.success('Song updated successfully!')
      router.push(`/songs/${data.id}`)
    }

    setSaving(false)
  }

  const handleCancel = () => {
    if (originalSong) {
      setFormData({
        title: originalSong.title,
        key: originalSong.key || 'C',
        content: originalSong.content,
        public: originalSong.public
      })
    }
    router.push(`/songs/${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading song...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href={`/songs/${params.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Song
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Edit Song</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Form Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Song Details</CardTitle>
                  <CardDescription>
                    Update the song information and lyrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Song Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter song title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key">Original Key</Label>
                    <Select
                      value={formData.key}
                      onValueChange={(value) => setFormData({ ...formData, key: value })}
                      disabled={saving}
                    >
                      <SelectTrigger id="key">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="public">Visibility</Label>
                    <Select
                      value={formData.public ? 'public' : 'private'}
                      onValueChange={(value) => setFormData({ ...formData, public: value === 'public' })}
                      disabled={saving}
                    >
                      <SelectTrigger id="public">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can view</SelectItem>
                        <SelectItem value="private">Private - Only you can view</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">
                      Song Content (ChordPro Format) *
                    </Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      disabled={saving}
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use [C], [Am], [G], etc. to add chords above lyrics
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={saving}
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Preview
                      </>
                    )}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Preview Section */}
              {showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      This is how your song will appear
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/20 p-4 rounded-lg">
                      {formData.content ? (
                        <ChordProRenderer content={formData.content} />
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Enter some content to see the preview
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Help Section */}
            {!showPreview && (
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>ChordPro Quick Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <strong>Basic Chords:</strong>
                    <p className="text-muted-foreground">Use [C], [Am], [G], etc. to place chords</p>
                  </div>
                  <div>
                    <strong>Metadata:</strong>
                    <p className="text-muted-foreground">{`{title: Song Name}`}</p>
                    <p className="text-muted-foreground">{`{key: C}`}</p>
                  </div>
                  <div>
                    <strong>Comments:</strong>
                    <p className="text-muted-foreground">{`{comment: This is a comment}`}</p>
                  </div>
                  <div>
                    <strong>Example:</strong>
                    <pre className="text-xs bg-muted p-2 rounded mt-2">
{`[C]Amazing [G]Grace how [Am]sweet the [F]sound
That [C]saved a [G]wretch like [C]me`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}