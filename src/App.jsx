import React, { useState, useEffect } from 'react'
import { supabase } from './api/supabase'
import Auth from './features/Auth/Auth'
import Dashboard from './features/Dashboard/Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0d0d12', color: '#fff', fontFamily: 'sans-serif' }}>
        Loading Findbae...
      </div>
    )
  }

  return session ? <Dashboard session={session} /> : <Auth />
}