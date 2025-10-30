'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { Home, Music, ListMusic, LogOut, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface MainNavProps {
  user: User | null
  isAdmin?: boolean
}

export function MainNav({ user, isAdmin }: MainNavProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error signing out')
    } else {
      toast.success('Logged out successfully')
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <Music className="h-6 w-6" />
              <span className="text-lg font-bold">Songbook</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/songs" className="flex items-center space-x-1 text-sm hover:text-primary">
                <Home className="h-4 w-4" />
                <span>Songs</span>
              </Link>

              {user && (
                <>
                  <Link href="/setlists" className="flex items-center space-x-1 text-sm hover:text-primary">
                    <ListMusic className="h-4 w-4" />
                    <span>Setlists</span>
                  </Link>

                  {isAdmin && (
                    <Link href="/admin/songs/new" className="flex items-center space-x-1 text-sm hover:text-primary">
                      <Plus className="h-4 w-4" />
                      <span>New Song</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                  {isAdmin && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Admin</span>}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}