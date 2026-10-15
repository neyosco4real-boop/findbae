import React, { useState, useEffect } from 'react'
import { supabase } from '../../api/supabase'

export default function Home({ session, onMatchComplete }) {
  const [profiles, setProfiles] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchPopup, setMatchPopup] = useState(null)

  const currentUserId = session?.user?.id

  useEffect(() => {
    if (currentUserId) fetchFeedProfiles()
  }, [currentUserId])

  const fetchFeedProfiles = async () => {
    try {
      setLoading(true)
      const { data: existingLikes } = await supabase
        .from('likes')
        .select('liked_user_id')
        .eq('user_id', currentUserId)

      const excludedIds = [currentUserId, ...(existingLikes?.map(l => l.liked_user_id) || [])]

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${excludedIds.join(',')})`)

      if (error) throw error
      setProfiles(data || [])
    } catch (err) {
      console.error('Error fetching feed:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (action) => {
    const targetUser = profiles[currentIndex]
    if (!targetUser) return

    if (action === 'like') {
      try {
        await supabase.from('likes').insert({
          user_id: currentUserId,
          liked_user_id: targetUser.id
        })

        const { data: reciprocalLike } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', targetUser.id)
          .eq('liked_user_id', currentUserId)
          .single()

        if (reciprocalLike) {
          await supabase.from('matches').insert([
            { user1_id: currentUserId, user2_id: targetUser.id }
          ])

          setMatchPopup(targetUser)
          setTimeout(() => {
            setMatchPopup(null)
            if (onMatchComplete) onMatchComplete(targetUser)
          }, 2500)
        }
      } catch (err) {
        console.error('Error recording like:', err.message)
      }
    }

    setCurrentIndex((prev) => prev + 1)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>Finding matches near you...</div>
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px', background: 'rgba(18, 18, 26, 0.85)', borderRadius: '24px', border: '1px solid rgba(255, 75, 120, 0.2)', maxWidth: '400px', margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
        <h3 style={{ color: '#fff', fontSize: '20px' }}>You've seen everyone nearby!</h3>
        <p style={{ fontSize: '13px' }}>Check back later for new profiles.</p>
      </div>
    )
  }

  const currentProfile = profiles[currentIndex]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
      {matchPopup && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7, 7, 10, 0.95)', backdropFilter: 'blur(24px)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', background: 'linear-gradient(135deg, #ff4b72 0%, #ff7b9c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 10px 0' }}>It's a Match! 🔥</h2>
          <p style={{ color: '#d1d5db', fontSize: '15px', marginBottom: '20px' }}>You and {matchPopup.display_name} liked each other.</p>
          <button
            onClick={() => {
              setMatchPopup(null)
              if (onMatchComplete) onMatchComplete(matchPopup)
            }}
            style={{ padding: '12px 28px', borderRadius: '20px', border: 'none', background: 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(230,57,95,0.4)' }}
          >
            Send Message 💬
          </button>
        </div>
      )}

      <div style={{ background: 'rgba(18, 18, 26, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 75, 120, 0.25)', borderRadius: '28px', overflow: 'hidden', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(230,57,95,0.1)' }}>
        <div style={{ position: 'relative', height: '410px', width: '100%', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {currentProfile.avatar_url ? (
            <img src={currentProfile.avatar_url} alt={currentProfile.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '64px' }}>👤</span>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(7,7,10,0.95) 0%, transparent 100%)', padding: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#fff' }}>
              {currentProfile.display_name || 'User'}, <span style={{ fontWeight: '400', color: '#ff7b9c' }}>{currentProfile.age || 21}</span>
            </h2>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
              📍 {currentProfile.location || 'Lagos, Nigeria'}
            </div>
            <div style={{ display: 'inline-block', background: 'rgba(230,57,95,0.2)', color: '#ff7b9c', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', marginTop: '8px' }}>
              {currentProfile.intent || '🔥 Dating'}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.5', minHeight: '50px', margin: '0 0 24px 0' }}>
            {currentProfile.bio_details || 'No bio provided.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
            <button
              onClick={() => handleSwipe('pass')}
              style={{ width: '65px', height: '65px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 15, 22, 0.9)', color: '#9ca3af', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', transition: 'transform 0.1s' }}
              title="Pass"
            >
              ✕
            </button>
            <button
              onClick={() => handleSwipe('like')}
              style={{ width: '65px', height: '65px', borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)', color: '#fff', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(230, 57, 95, 0.5)', transition: 'transform 0.1s' }}
              title="Like"
            >
              ♥
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}