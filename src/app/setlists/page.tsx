import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ListMusic, Plus } from 'lucide-react'

export default async function SetlistsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's setlists
  const { data: setlists, error } = await supabase
    .from('setlists')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching setlists:', error)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Setlists</h1>
          <p className="text-muted-foreground mt-2">Organize your songs into performance setlists</p>
        </div>
        <Button disabled className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Setlist
          <span className="text-xs ml-1">(Coming Soon)</span>
        </Button>
      </div>

      {setlists && setlists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {setlists.map((setlist) => (
            <Card key={setlist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <ListMusic className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="mt-2">{setlist.name}</CardTitle>
                <CardDescription>
                  Created {new Date(setlist.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Setlist management coming soon...
                </p>
                <Button variant="outline" size="sm" disabled className="w-full">
                  View Setlist
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <ListMusic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No setlists yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first setlist to organize songs for performances
            </p>
            <Button disabled>
              Create Your First Setlist
              <span className="text-xs ml-2">(Coming Soon)</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}