import React, { useState, useEffect } from 'react'
import { supabase } from '../../api/supabase'

export default function Profile({ session }) {
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [location, setLocation] = useState('Lagos, Nigeria')
  const [gender, setGender] = useState('Other')
  const [intent, setIntent] = useState('🔥 Dating')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const currentUserId = session?.user?.id

  useEffect(() => {
    if (currentUserId) getProfile()
  }, [currentUserId])

  const getProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single()

      if (error) throw error

      if (data) {
        setDisplayName(data.display_name || '')
        setAge(data.age || '')
        setLocation(data.location || 'Lagos, Nigeria')
        setGender(data.gender || 'Other')
        setIntent(data.intent || '🔥 Dating')
        setBio(data.bio_details || '')
        setAvatarUrl(data.avatar_url || '')
      }
    } catch (err) {
      console.error('Error loading profile:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUserId}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      
      await supabase.from('profiles').upsert({
        id: currentUserId,
        avatar_url: data.publicUrl,
        updated_at: new Date()
      })
    } catch (error) {
      alert('Error uploading avatar: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updates = {
        id: currentUserId,
        display_name: displayName,
        age: parseInt(age) || 21,
        location,
        gender,
        intent,
        bio_details: bio,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error
      alert('Profile updated successfully!')
    } catch (err) {
      alert('Error updating profile: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', boxSizing: 'border-box', paddingBottom: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: '0 0 16px 0' }}>Edit Profile 👤</h2>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#0a0a0f', border: '2px solid #ff4b72', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', boxShadow: '0 0 20px rgba(230,57,95,0.3)' }}>
          {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '40px' }}>👤</span>}
        </div>
        <label style={{ background: 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)', color: '#fff', padding: '8px 18px', borderRadius: '16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(230,57,95,0.4)' }}>
          {uploading ? 'Uploading...' : 'Change Photo'}
          <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} style={{ display: 'none' }} />
        </label>
      </div>

      <form onSubmit={updateProfile} style={{ width: '100%', background: 'rgba(18, 18, 26, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 75, 120, 0.2)', borderRadius: '24px', padding: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
        
        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Location 📍</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          >
            <option value="Lagos, Nigeria">Lagos, Nigeria</option>
            <option value="Abuja, Nigeria">Abuja, Nigeria</option>
            <option value="Port Harcourt, Nigeria">Port Harcourt, Nigeria</option>
            <option value="Ibadan, Nigeria">Ibadan, Nigeria</option>
            <option value="Accra, Ghana">Accra, Ghana</option>
            <option value="London, UK">London, UK</option>
            <option value="New York, USA">New York, USA</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Intent / Vibe</label>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          >
            <option value="🔥 Dating">🔥 Dating</option>
            <option value="☕ Coffee Date">☕ Coffee Date</option>
            <option value="🎉 Party">🎉 Party</option>
            <option value="💬 Just Chat">💬 Just Chat</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Bio Details</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows="3"
            style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 8px 24px rgba(230, 57, 95, 0.4)' }}
        >
          {loading ? 'Saving...' : 'Save Profile Changes 💾'}
        </button>
      </form>
    </div>
  )
}