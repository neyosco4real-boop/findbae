import React, { useState } from 'react'
import { supabase } from '../../api/supabase'

export default function Auth({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [step, setStep] = useState(1) // 1: Auth form, 2: Profile setup step
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Onboarding Profile state
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [intent, setIntent] = useState('🔥 Dating')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match!')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.')
        }

        // Pre-fill default display name from email prefix
        setDisplayName(email.split('@')[0])
        // Move to Step 2 onboarding instead of finishing login
        setStep(2)
        setLoading(false)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data?.session) {
          onLoginSuccess(data.session)
        }
        setLoading(false)
      }
    } catch (err) {
      setErrorMessage(err.message)
      setLoading(false)
    }
  }

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.warn('Storage RLS restriction notice:', uploadError.message)
        alert('Photo upload skipped due to storage permissions. You can easily add your profile picture anytime from the Profile tab once logged in!')
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
    } catch (error) {
      console.error('Error uploading avatar:', error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleCompleteOnboarding = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      // 1. Execute real account creation in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError

      const user = authData?.user
      if (user) {
        // 2. Insert profile information into database
        const updates = {
          id: user.id,
          display_name: displayName,
          age: parseInt(age) || 21,
          intent,
          bio_details: bio,
          avatar_url: avatarUrl || '',
          updated_at: new Date(),
        }

        const { error: profileError } = await supabase.from('profiles').upsert(updates)
        if (profileError) throw profileError

        // 3. Log in session
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw loginError
        if (loginData?.session) {
          onLoginSuccess(loginData.session)
        }
      }
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'radial-gradient(circle at 50% 0%, #12121a 0%, #07070a 70%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '20px', position: 'fixed', inset: 0, zIndex: 2000 }}>
      
      {/* Cyber-Luxury Outer Aura Glow Card */}
      <div style={{ width: '100%', maxWidth: '390px', background: 'rgba(18, 18, 26, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 75, 120, 0.25)', borderRadius: '32px', padding: '36px 30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 60px rgba(230, 57, 95, 0.15), 0 20px 40px rgba(0,0,0,0.8)', position: 'relative' }}>
        
        {/* FindBae Logo */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <svg width="170" height="46" viewBox="0 0 180 50" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        {errorMessage && (
          <div style={{ width: '100%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '10px', borderRadius: '12px', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}

        {step === 1 ? (
          <>
            <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Welcome to <strong style={{ color: '#fff' }}>FindBae</strong> — the ultimate Cyber-Luxury Noir dating experience. Discover verified chemistry and connect with singles nearby.
            </p>

            <form onSubmit={handleAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />

              {/* Password Input with Eye Toggle */}
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {/* Confirm Password with its own Eye Toggle & Password Strength / Match Checker */}
              {isSignUp && (
                <>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {password && (
                    <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: '#9ca3af', padding: '0 4px' }}>
                      <span>Strength: <strong style={{ color: password.length >= 8 ? '#10b981' : '#f59e0b' }}>{password.length >= 8 ? 'Strong' : 'Moderate'}</strong></span>
                      <span style={{ color: password === confirmPassword && confirmPassword ? '#10b981' : '#ef4444' }}>
                        {password === confirmPassword && confirmPassword ? 'Passwords match ✓' : 'Passwords must match'}
                      </span>
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)', color: '#fff', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '6px', boxShadow: '0 8px 24px rgba(230, 57, 95, 0.4)', transition: 'transform 0.1s' }}
              >
                {loading ? 'Processing...' : (isSignUp ? 'Continue to Profile Setup ✨' : 'Sign In')}
              </button>
            </form>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '20px' }}
            >
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span style={{ color: '#ff4b72' }}>{isSignUp ? 'Sign In' : 'Sign Up'}</span>
            </button>
          </>
        ) : (
          /* Step 2: Interactive 3-Step Profile Onboarding */
          <form onSubmit={handleCompleteOnboarding} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', textAlign: 'center', margin: '0 0 10px 0' }}>Complete Your Profile ✨</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#0a0a0f', border: '2px solid #ff4b72', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '32px' }}>👤</span>}
              </div>
              <label style={{ background: 'rgba(230,57,95,0.2)', color: '#ff7b9c', padding: '6px 14px', borderRadius: '14px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>

            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
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
            <textarea
              placeholder="Write a short bio..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="2"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 10, 15, 0.8)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #e6395f 0%, #ff4b72 100%)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '6px', boxShadow: '0 8px 24px rgba(230, 57, 95, 0.4)' }}
            >
              {loading ? 'Finalizing...' : 'Enter FindBae 🚀'}
            </button>
          </form>
        )}
      </div>

      <div style={{ color: '#4b5563', fontSize: '11px', marginTop: '24px', letterSpacing: '0.5px' }}>
        © 2026 FindBae. All rights reserved.
      </div>
    </div>
  )
}