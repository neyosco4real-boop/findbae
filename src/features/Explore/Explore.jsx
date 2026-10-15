import React, { useState, useEffect } from 'react'
import { supabase } from '../../api/supabase'

export default function Explore({ session, onStartChat }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [intentFilter, setIntentFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const currentUserId = session?.user?.id

  useEffect(() => {
    if (currentUserId) fetchExploreProfiles()
  }, [currentUserId])

  const fetchExploreProfiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)

      if (error) throw error
      setProfiles(data || [])
    } catch (err) {
      console.error('Error fetching explore profiles:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProfiles = profiles.filter(user => {
    const matchesIntent = intentFilter === 'All' || user.intent?.includes(intentFilter)
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesIntent && matchesSearch
  })

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', boxSizing: 'border-box', paddingBottom: '130px' }}>
      
      {/* Profile Modal Preview */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 7, 10, 0.9)', backdropFilter: 'blur(24px)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '360px', background: 'rgba(18, 18, 26, 0.95)', border: '1px solid rgba(255, 75, 120, 0.3)', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 0 50px rgba(230, 57, 95, 0.2)' }}>
            <div style={{ position: 'relative', height: '320px', background: '#0a0a0f' }}>
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '50px' }}>👤</div>
              )}
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(16, 185, 129, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                🟢 Active Now
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                {selectedUser.display_name}, <span style={{ color: '#ff7b9c', fontWeight: '400' }}>{selectedUser.age || 21}</span>
              </h2>
              <div style={{ display: 'inline-block', background: 'rgba(230,57,95,0.15)', color: '#ff7b9c', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', marginBottom: '14px' }}>
                {selectedUser.intent || '🔥 Dating'}
              </div>
              <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                {selectedUser.bio_details || 'No bio provided.'}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const user = selectedUser
                    setSelectedUser(null)
                    if (onStartChat) onStartChat(user)
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(230,57,95,0.4)' }}
                >
                  Send Wave & Chat 💬
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{ padding: '12px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Search */}
      <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: '0 0 16px 0' }}>Explore Radar 🌍</h2>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search profiles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: '20px', border: '1px solid rgba(255,75,120,0.2)', background: 'rgba(18, 18, 26, 0.85)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Intent Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px', scrollbarWidth: 'none' }}>
        {['All', '🔥 Dating', '☕ Coffee Date', '🎉 Party', '💬 Just Chat'].map(tag => (
          <button
            key={tag}
            onClick={() => setIntentFilter(tag)}
            style={{ whiteSpace: 'nowrap', padding: '8px 14px', borderRadius: '16px', border: intentFilter === tag ? '1px solid #ff4b72' : '1px solid rgba(255,255,255,0.08)', background: intentFilter === tag ? 'linear-gradient(135deg, rgba(230,57,95,0.3) 0%, rgba(255,75,114,0.3) 100%)' : 'rgba(18, 18, 26, 0.85)', color: intentFilter === tag ? '#ff7b9c' : '#9ca3af', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid of Profiles */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>Scanning radar...</div>
      ) : filteredProfiles.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px', background: 'rgba(18, 18, 26, 0.85)', borderRadius: '20px', border: '1px solid rgba(255,75,120,0.15)' }}>
          No profiles found nearby.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {filteredProfiles.map(user => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              style={{ background: 'rgba(18, 18, 26, 0.85)', border: '1px solid rgba(255, 75, 120, 0.15)', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', position: 'relative', height: '210px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', transition: 'transform 0.2s' }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '36px' }}>👤</div>
              )}
              <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(7,7,10,0.95) 0%, transparent 100%)', padding: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{user.display_name}, {user.age || 21}</div>
                <div style={{ fontSize: '11px', color: '#ff7b9c', marginTop: '2px' }}>{user.intent || '🔥 Dating'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}