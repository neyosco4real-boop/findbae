import React, { useState, useEffect } from 'react'
import { supabase } from '../../api/supabase'

export default function NoirStore({ session, onClose }) {
  const [credits, setCredits] = useState({ spark_balance: 0, is_vip: false })
  const [loading, setLoading] = useState(false)
  const currentUserId = session?.user?.id

  useEffect(() => {
    if (currentUserId) fetchCredits()
  }, [currentUserId])

  const fetchCredits = async () => {
    const { data } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', currentUserId)
      .single()
    if (data) setCredits(data)
  }

  // Simulated daily credit / payment checkout trigger
  const handlePurchase = async (type) => {
    setLoading(true)
    try {
      let newSparks = credits.spark_balance
      let newVip = credits.is_vip

      if (type === 'sparks') newSparks += 15
      if (type === 'vip') newVip = true

      const { error } = await supabase
        .from('user_credits')
        .update({ spark_balance: newSparks, is_vip: newVip, updated_at: new Date() })
        .eq('user_id', currentUserId)

      if (error) throw error
      await fetchCredits()
      alert(type === 'vip' ? 'Noir VIP activated successfully! ✨' : '15 Noir Sparks added to your balance! 🔥')
    } catch (err) {
      alert('Transaction error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 7, 10, 0.9)', backdropFilter: 'blur(20px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px', background: 'rgba(18, 18, 26, 0.95)', border: '1px solid rgba(255, 75, 120, 0.3)', borderRadius: '28px', padding: '28px', boxSizing: 'border-box', boxShadow: '0 0 50px rgba(230, 57, 95, 0.25)', textAlign: 'center' }}>
        
        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '0 0 6px 0' }}>Noir Vault 💎</h2>
        <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 20px 0' }}>
          Current Balance: <strong style={{ color: '#ff7b9c' }}>{credits.spark_balance} Sparks</strong> {credits.is_vip && '• VIP Active'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* Spark Pack */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,75,120,0.2)', borderRadius: '18px', padding: '16px', textAlign: 'left' }}>
            <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>🔥 15 Spark Pack</div>
            <div style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 10px 0' }}>Send priority direct messages instantly.</div>
            <button
              onClick={() => handlePurchase('sparks')}
              disabled={loading}
              style={{ width: '100%', padding: '10px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              Get 15 Sparks ($4.99)
            </button>
          </div>

          {/* VIP Pass */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,75,120,0.2)', borderRadius: '18px', padding: '16px', textAlign: 'left' }}>
            <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>✨ Noir VIP Pass (24 Hrs)</div>
            <div style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 10px 0' }}>Unlimited likes & see who liked you.</div>
            <button
              onClick={() => handlePurchase('vip')}
              disabled={loading}
              style={{ width: '100%', padding: '10px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ffb703 0%, #fb8500 100%)', color: '#12121a', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
            >
              Activate VIP ($9.99)
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', padding: '10px 24px', borderRadius: '14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          Close Vault
        </button>
      </div>
    </div>
  )
}