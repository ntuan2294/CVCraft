'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/authContext'

/**
 * Redirects unauthenticated users to /auth/login?redirect=<current-path>.
 * Returns { user, loading } — while loading or redirecting, `loading` is true.
 *
 * Usage:
 *   const { user, loading } = useRequireAuth()
 *   if (loading) return <Spinner />
 *   if (!user) return null   // redirect is in-flight
 */
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [user, loading, router, pathname])

  // Keep loading=true until we know the user is authenticated (prevents flash)
  const isLoading = loading || (!loading && !user)

  return { user, loading: isLoading }
}
