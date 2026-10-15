import React, { useState, useEffect } from 'react'
import { supabase } from '../../api/supabase'

export default function Chat({ session, initialMatch }) {
  const currentUserId = session?.user?.id
  const [matches, setMatches] = useState([])
  const [activeChatUser, setActiveChatUser] = useState(initialMatch || null)
  const [activeMatchId, setActiveMatchId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasAutoReplied, setHasAutoReplied] = useState(false)
  const [callState, setCallState] = useState(null)
  const [callTimer, setCallTimer] = useState(0)

  useEffect(() => {
    if (currentUserId) fetchMatches()
  }, [currentUserId])

  useEffect(() => {
    if (initialMatch && currentUserId) {
      setActiveChatUser(initialMatch)
      findOrCreateMatch(initialMatch.id)
    }
  }, [initialMatch, currentUserId])

  useEffect(() => {
    let timer
    if (callState) {
      setCallTimer(0)
      timer = setInterval(() => {
        setCallTimer(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(timer)
    }
    return () => clearInterval(timer)
  }, [callState])

  useEffect(() => {
    if (activeMatchId) {
      fetchMessages(activeMatchId)
      const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${activeMatchId}` }, payload => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [activeMatchId])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)

      if (error) throw error
      const matchedUserIds = data.map(m => m.user1_id === currentUserId ? m.user2_id : m.user1_id)

      if (matchedUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', matchedUserIds)

        setMatches(profilesData || [])
      }
    } catch (err) {
      console.error('Error fetching matches:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const findOrCreateMatch = async (otherUserId) => {
    try {
      let { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`)
        .single()

      if (!matchData) {
        const { data: newMatch } = await supabase
          .from('matches')
          .insert([{ user1_id: currentUserId, user2_id: otherUserId }])
          .select()
          .single()
        matchData = newMatch
      }
      if (matchData) setActiveMatchId(matchData.id)
    } catch (err) {
      console.error('Error finding/creating match:', err.message)
    }
  }

  const fetchMessages = async (matchId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      console.error('Error fetching messages:', err.message)
    }
  }

  const sendMessage = async (textToSend) => {
    if (!textToSend.trim() || !activeMatchId) return
    try {
      await supabase.from('messages').insert([
        { match_id: activeMatchId, sender_id: currentUserId, text: textToSend }
      ])
      setInputText('')

      if (!hasAutoReplied) {
        setHasAutoReplied(true)
        setTimeout(async () => {
          await supabase.from('messages').insert([
            { match_id: activeMatchId, sender_id: activeChatUser.id, text: `Hey! Thanks for messaging. Let's chat! 😊` }
          ])
        }, 1000)
      }
    } catch (err) {
      console.error('Error sending message:', err.message)
    }
  }

  const handleEndCall = async (wasAnswered = false) => {
    if (!wasAnswered) {
      const callTypeStr = callState === 'video' ? 'Video' : 'Audio'
      await sendMessage(`📞 Missed ${callTypeStr} Call`)
    }
    setCallState(null)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (activeChatUser) {
    return (
      <div style={{ width: '100%', maxWidth: '415px', margin: '0 auto', background: 'rgba(18, 18, 26, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 75, 120, 0.2)', borderRadius: '28px', display: 'flex', flexDirection: 'column', height: '560px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', position: 'relative' }}>
        
        {callState && (
          <div style={{ position: 'absolute', inset: 0, background: '#07070a', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '40px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#0a0a0f', border: '3px solid #ff4b72', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 0 30px rgba(255,75,114,0.4)' }}>
                {activeChatUser.avatar_url ? <img src={activeChatUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '40px' }}>👤</span>}
              </div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '22px' }}>{activeChatUser.display_name}</h3>
              <p style={{ color: callTimer > 2 ? '#10b981' : '#9ca3af', fontSize: '13px', marginTop: '6px' }}>
                {callTimer > 2 ? `Connected (${formatTime(callTimer)})` : `Calling ${callState} call...`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
              <button
                onClick={() => handleEndCall(callTimer > 2)}
                style={{ width: '65px', height: '65px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(239,68,68,0.5)' }}
                title="End Call"
              >
                📞
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 18px', background: 'rgba(10, 10, 15, 0.9)', borderBottom: '1px solid rgba(255,75,120,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setActiveChatUser(null)} style={{ background: 'none', border: 'none', color: '#ff4b72', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>← Back</button>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0a0a0f', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeChatUser.avatar_url ? <img src={activeChatUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
            </div>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>{activeChatUser.display_name}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setCallState('audio')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Audio Call">📞</button>
            <button onClick={() => setCallState('video')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Video Call">
              <svg width="18" height="18" viewBox="0 0 512 512" fill="currentColor">
                <path d="M472 176c-13.3 0-24 10.7-24 24v112c0 13.3 10.7 24 24 24s24-10.7 24-24V200c0-13.3-10.7-24-24-24zm-80-32H120c-39.8 0-72 32.2-72 72v160c0 39.8 32.2 72 72 72h272c39.8 0 72-32.2 72-72V216c0-39.8-32.2-72-72-72zm-128 176c-30.9 0-56-25.1-56-56s25.1-56 56-56 56 25.1 56 56-25.1 56-56 56zm144-88l-48 32v-64l48 32z" fill="#38bdf8"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', margin: '10px 0' }}>You matched with {activeChatUser.display_name}! Start the conversation 🔥</div>
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', background: isMe ? 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)' : 'rgba(255,255,255,0.08)', color: '#fff', padding: '10px 14px', borderRadius: '16px', maxWidth: '75%', fontSize: '13px' }}>
                {msg.text}
              </div>
            )
          })}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputText); }} style={{ padding: '12px', borderTop: '1px solid rgba(255,75,120,0.15)', display: 'flex', gap: '8px', background: 'rgba(10, 10, 15, 0.9)' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(18, 18, 26, 0.9)', color: '#fff', fontSize: '13px', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '12px 20px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Send</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '415px', margin: '0 auto', paddingBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#fff' }}>Chat</h2>
        <div style={{ display: 'flex', gap: '12px', fontSize: '18px' }}>🛡️ 😊</div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search matches..."
          style={{ width: '100%', padding: '12px 16px', borderRadius: '20px', border: '1px solid rgba(255,75,120,0.2)', background: 'rgba(18, 18, 26, 0.85)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>New Matches</div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
          <div style={{ minWidth: '72px', height: '96px', borderRadius: '16px', background: 'radial-gradient(circle, rgba(255,75,114,0.3) 0%, rgba(18,18,26,0.9) 100%)', border: '2px solid #ff4b72', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: '20px' }}>🔥</span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>Likes You</span>
          </div>

          {matches.map((match) => (
            <div
              key={match.id}
              onClick={() => {
                setActiveChatUser(match)
                findOrCreateMatch(match.id)
              }}
              style={{ minWidth: '72px', height: '96px', borderRadius: '16px', background: '#0a0a0f', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,75,120,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
            >
              {match.avatar_url ? (
                <img src={match.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '28px' }}>👤</div>
              )}
              <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', fontSize: '11px', fontWeight: '700', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {match.display_name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>Messages</div>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>Loading conversations...</div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '30px', background: 'rgba(18, 18, 26, 0.85)', borderRadius: '20px', border: '1px solid rgba(255,75,120,0.15)' }}>
            <p style={{ fontSize: '13px' }}>No matches yet. Start swiping on Home to connect with people!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {matches.map((match) => (
              <div
                key={match.id}
                onClick={() => {
                  setActiveChatUser(match)
                  findOrCreateMatch(match.id)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: 'rgba(18, 18, 26, 0.85)', borderRadius: '20px', border: '1px solid rgba(255,75,120,0.15)', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#0a0a0f', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {match.avatar_url ? <img src={match.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                  <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #0a0a0f' }}></span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#fff' }}>{match.display_name}</span>
                    <span style={{ background: 'rgba(230,57,95,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', color: '#ff7b9c' }}>Your turn</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Recently active, match now! 🔥</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}