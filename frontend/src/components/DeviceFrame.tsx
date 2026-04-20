import React, { useEffect, useState } from 'react'

type DeviceFrameProps = {
  children: React.ReactNode
  overlaySrc?: string
  overlayOpacity?: number
}

export function DeviceFrame({ children, overlaySrc, overlayOpacity = 0 }: DeviceFrameProps) {
  const baseWidth = 375
  const baseHeight = 812
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const recompute = () => {
      const margin = 32 // total margin around device
      const availW = Math.max(320, window.innerWidth - margin)
      const availH = Math.max(480, window.innerHeight - margin)
      const s = Math.min(availW / baseWidth, availH / baseHeight, 1)
      setScale(s)
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [])

  return (
    <div className="device-frame-outer">
      <div
        className="device-frame"
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {overlaySrc ? (
          <img
            src={overlaySrc}
            alt="Design overlay"
            className="screen-img"
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, opacity: overlayOpacity, pointerEvents: 'none' }}
            draggable={false}
          />
        ) : null}
        <div className="device-content">{children}</div>
      </div>
    </div>
  )
}
