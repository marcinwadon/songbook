import { createClient } from '@/lib/supabase/server'
import { MainNav } from '@/components/nav/main-nav'

export default async function SetlistsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is admin
  let isAdmin = false
  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    isAdmin = roleData?.role === 'admin'
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} isAdmin={isAdmin} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}