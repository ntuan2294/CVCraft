'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }

    router.replace(user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/candidate')
  }, [user, loading, router])

  return null
}
