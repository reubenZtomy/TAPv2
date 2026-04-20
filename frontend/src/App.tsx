import React, { useEffect, useMemo, useState } from 'react'
import { DeviceFrame } from './components/DeviceFrame'
import { TitleScreen } from './screens/TitleScreen'
import { FunStudiesScreen } from './screens/FunStudiesScreen'
import { PartnerScreen } from './screens/PartnerScreen'
import { PassionScreen } from './screens/PassionScreen'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from './screens/RegisterScreen'

type ScreenId = 'login' | 'register' | 'title' | 'passion' | 'fun' | 'partner' | 'done'

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('login')
  const [overlay, setOverlay] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(0.45)
  const [token, setToken] = useState<string | null>(null)

  // Enable overlay via ?overlay=1 in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setOverlay(params.get('overlay') === '1')
    const saved = localStorage.getItem('asq_token')
    if (saved) {
      setToken(saved)
      setScreen('title')
    }
  }, [])

  // Toggle overlay with 'o' for alignment
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'o') {
        setOverlay((v) => !v)
      }
      if (e.key === '+' || e.key === '=') {
        setOverlayOpacity((v) => Math.min(1, v + 0.05))
      }
      if (e.key === '-' || e.key === '_') {
        setOverlayOpacity((v) => Math.max(0, v - 0.05))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const overlaySrc = useMemo(() => {
    if (!overlay) return undefined
    switch (screen) {
      case 'title':
        return '/asq/ASQ Title - Final Ver.png'
      case 'passion':
        return undefined
      case 'fun':
        return '/asq/iPhone 13 Mini - Fun and Studies.png'
      case 'partner':
        return '/asq/iPhone 13 Mini - Partner.png'
      default:
        return undefined
    }
  }, [overlay, screen])

  return (
    <div className="app-root">
      <DeviceFrame overlaySrc={overlaySrc} overlayOpacity={overlayOpacity}>
        {screen === 'login' && (
          <LoginScreen
            onLoggedIn={(t) => {
              setToken(t)
              setScreen('title')
            }}
            onGoRegister={() => setScreen('register')}
          />
        )}
        {screen === 'register' && (
          <RegisterScreen
            onRegistered={(t) => {
              setToken(t)
              setScreen('title')
            }}
            onGoLogin={() => setScreen('login')}
          />
        )}
        {screen === 'title' && <TitleScreen onStart={() => setScreen('passion')} />}
        {screen === 'passion' && (
          <PassionScreen onBack={() => setScreen('title')} onNext={() => setScreen('fun')} />
        )}
        {screen === 'fun' && (
          <FunStudiesScreen onNext={() => setScreen('partner')} onBack={() => setScreen('title')} />
        )}
        {screen === 'partner' && (
          <PartnerScreen onBack={() => setScreen('fun')} onFinish={() => setScreen('done')} />
        )}
        {screen === 'done' && (
          <div className="screen done-screen">
            <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
              <h1 className="typo-title">Thanks!</h1>
              <p className="typo-body">Prototype complete.</p>
            </div>
          </div>
        )}
      </DeviceFrame>
      {/* Dev controls hidden by default to avoid adding page height */}
      {overlay && (
        <div className="controls" aria-hidden="false">
          <button className="control-button" onClick={() => setScreen('title')} aria-label="Title">
            Title
          </button>
          <button className="control-button" onClick={() => setScreen('passion')} aria-label="Passion">
            Passion
          </button>
          <button className="control-button" onClick={() => setScreen('fun')} aria-label="Fun">
            Fun & Studies
          </button>
          <button className="control-button" onClick={() => setScreen('partner')} aria-label="Partner">
            Partner
          </button>
        </div>
      )}
    </div>
  )
}
