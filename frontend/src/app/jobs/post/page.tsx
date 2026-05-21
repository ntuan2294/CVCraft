'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PostJobRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/cv/generate') }, [router])
  return null
}
