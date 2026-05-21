'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RecruiterRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/candidate') }, [router])
  return null
}
