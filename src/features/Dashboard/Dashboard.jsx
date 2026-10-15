import React, { useState } from 'react'
import { supabase } from '../../api/supabase'
import Home from '../Home/Home'
import Explore from '../Explore/Explore'
import Chat from '../Chat/Chat'
import Profile from '../Profile/Profile'
import NoirStore from '../Monetization/NoirStore'

export default function Dashboard({ session, onSignOut }) {
  const [currentTab, setCurrentTab] = useState('home')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showStore, setShowStore] = useState(false)

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      if (onSignOut) onSignOut()
    } catch (err) {
      console.error('Error signing out:', err.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #12121a 0%, #07070a 70%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Noir Store Modal */}
      {showStore && (
        <NoirStore session={session} onClose={() => setShowStore(false)} />
      )}

      {/* Top Brand Header with FindBae Logo & Vault Button */}
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="155" height="42" viewBox="0 0 180 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="46" height="46" rx="14" fill="#12121A" stroke="url(#paint0_linear)" strokeWidth="2"/>
            <path d="M25 12C25 12 18 20 18 26C18 30.4183 21.5817 34 26 34C30.4183 34 34 30.4183 34 26C34 22 25 12 25 12Z" fill="url(#paint1_linear)" />
            <path d="M22 24C22 24 19 27 19 29.5C19 31.433 20.567 33 22.5 33C24.433 33 26 31.433 26 29.5C26 27 22 24 22 24Z" fill="#FFA500"/>
            <text x="60" y="32" fill="url(#paint2_linear)" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="22" fontWeight="900" letterSpacing="-0.5">FindBae</text>
            <defs>
              <linearGradient id="paint0_linear" x1="2" y1="2" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E6395F"/>
                <stop offset="1" stopColor="#FF4B72"/>
              </linearGradient>
              <linearGradient id="paint1_linear" x1="18" y1="12" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF4B72"/>
                <stop offset="1" stopColor="#FFA500"/>
              </linearGradient>
              <linearGradient id="paint2_linear" x1="60" y1="15" x2="150" y2="35" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF"/>
                <stop offset="1" stopColor="#FF7B9C"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowStore(true)}
            style={{ background: 'linear-gradient(135deg, rgba(230,57,95,0.2) 0%, rgba(255,183,3,0.2) 100%)', border: '1px solid rgba(255, 183, 3, 0.4)', color: '#ffb703', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            💎 Vault
          </button>

          <button
            onClick={handleSignOut}
            style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 75, 120, 0.3)', color: '#d1d5db', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ width: '100%', maxWidth: '420px', flex: 1, paddingBottom: '100px' }}>
        {currentTab === 'home' && (
          <Home
            session={session}
            onMatchComplete={(matchUser) => {
              setSelectedMatch(matchUser)
              setCurrentTab('chat')
            }}
          />
        )}
        {currentTab === 'explore' && (
          <Explore
            session={session}
            onStartChat={(user) => {
              setSelectedMatch(user)
              setCurrentTab('chat')
            }}
          />
        )}
        {currentTab === 'chat' && (
          <Chat session={session} initialMatch={selectedMatch} />
        )}
        {currentTab === 'me' && (
          <Profile session={session} />
        )}
      </div>

      {/* Floating Glassmorphism Bottom Navigation Bar */}
      <div style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: '400px', background: 'rgba(18, 18, 26, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 75, 120, 0.2)', borderRadius: '30px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0', boxShadow: '0 16px 40px rgba(0,0,0,0.8)', zIndex: 1000 }}>
        {[
          { id: 'home', label: 'Swipe', icon: '🔥' },
          { id: 'explore', label: 'Explore', icon: '🌍' },
          { id: 'chat', label: 'Chat', icon: '💬' },
          { id: 'me', label: 'Profile', icon: '👤' }
        ].map((tab) => {
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id !== 'chat') setSelectedMatch(null)
                setCurrentTab(tab.id)
              }}
              style={{ background: isActive ? 'linear-gradient(135deg, rgba(230,57,95,0.25) 0%, rgba(255,75,114,0.3) 100%)' : 'transparent', border: isActive ? '1px solid rgba(255,75,114,0.4)' : 'none', borderRadius: '20px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              <span style={{ fontSize: '18px', filter: isActive ? 'drop-shadow(0 0 8px rgba(255,75,114,0.6))' : 'none' }}>{tab.icon}</span>
              <span style={{ fontSize: '12px', fontWeight: isActive ? '700' : '500', color: isActive ? '#ff7b9c' : '#9ca3af' }}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}