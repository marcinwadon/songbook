'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewSongPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    key: 'C',
    content: '',
    public: true
  })

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Proszę wprowadzić tytuł pieśni')
      return
    }

    if (!formData.content.trim()) {
      toast.error('Proszę wprowadzić treść pieśni')
      return
    }

    setLoading(true)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Musisz być zalogowany, aby utworzyć pieśń')
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('songs')
      .insert({
        title: formData.title.trim(),
        key: formData.key,
        content: formData.content.trim(),
        public: formData.public,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating song:', error)
      toast.error('Nie udało się utworzyć pieśni')
    } else {
      toast.success('Pieśń utworzona pomyślnie!')
      router.push(`/songs/${data.id}`)
    }

    setLoading(false)
  }

  const exampleChordPro = `{title: ${formData.title || 'Song Title'}}
{key: ${formData.key}}

[C]This is the first line with a [G]chord
[Am]You can place chords [F]anywhere in the [C]line

{comment: This is a comment}

[C]Write your [G]song using [Am]ChordPro [F]format
[C]Chords appear [G]above the [C]lyrics`

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/songs">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Powrót do pieśni
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Utwórz nową pieśń</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Form Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Szczegóły pieśni</CardTitle>
                  <CardDescription>
                    Wprowadź informacje i tekst pieśni w formacie ChordPro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tytuł pieśni *</Label>
                    <Input
                      id="title"
                      placeholder="Wprowadź tytuł pieśni"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key">Tonacja</Label>
                    <Select
                      value={formData.key}
                      onValueChange={(value) => setFormData({ ...formData, key: value })}
                      disabled={loading}
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
                    <Label htmlFor="public">Widoczność</Label>
                    <Select
                      value={formData.public ? 'public' : 'private'}
                      onValueChange={(value) => setFormData({ ...formData, public: value === 'public' })}
                      disabled={loading}
                    >
                      <SelectTrigger id="public">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Publiczna - Widoczna dla wszystkich</SelectItem>
                        <SelectItem value="private">Prywatna - Widoczna tylko dla Ciebie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">
                      Treść pieśni (Format ChordPro) *
                    </Label>
                    <Textarea
                      id="content"
                      placeholder={exampleChordPro}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      disabled={loading}
                      rows={20}
                      className="font-mono text-sm resize-y min-h-[400px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Użyj [C], [Am], [G], itd. aby dodać akordy nad tekstem
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={loading}
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Ukryj podgląd
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Pokaż podgląd
                      </>
                    )}
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Tworzenie...' : 'Utwórz pieśń'}
                  </Button>
                </CardFooter>
              </Card>

              {/* Preview Section */}
              {showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Podgląd</CardTitle>
                    <CardDescription>
                      Tak będzie wyglądać Twoja pieśń
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/20 p-6 rounded-lg">
                      {formData.content ? (
                        <ChordProRenderer content={formData.content} />
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Wprowadź treść, aby zobaczyć podgląd
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Help Section */}
              {!showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Szybki przewodnik ChordPro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <strong>Podstawowe akordy:</strong>
                      <p className="text-muted-foreground">Użyj [C], [Am], [G], itd. aby umieścić akordy</p>
                    </div>
                    <div>
                      <strong>Metadane:</strong>
                      <p className="text-muted-foreground">{`{title: Nazwa pieśni}`}</p>
                      <p className="text-muted-foreground">{`{key: C}`}</p>
                    </div>
                    <div>
                      <strong>Komentarze:</strong>
                      <p className="text-muted-foreground">{`{comment: To jest komentarz}`}</p>
                    </div>
                    <div>
                      <strong>Przykład:</strong>
                      <pre className="text-xs bg-muted p-2 rounded mt-2">
{`[C]Wspaniała [G]łaska, jak [Am]słodki to [F]dźwięk
Który [C]zbawił [G]nędznika jak [C]ja`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}