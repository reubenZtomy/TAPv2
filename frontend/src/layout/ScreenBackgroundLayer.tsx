import React from 'react'
import { screenBackgroundFillStyle, type ScreenBackgroundSettings } from '../admin/layoutTypes'

type ScreenBackgroundLayerProps = {
  settings: ScreenBackgroundSettings
  children?: React.ReactNode
  className?: string
  /** Fill the parent box behind siblings (runtime canvas). */
  fillParent?: boolean
}

/** Full-screen color + optional image behind layout content (admin preview and public quiz). */
export function ScreenBackgroundLayer({
  settings,
  children,
  className = '',
  fillParent = false,
}: ScreenBackgroundLayerProps) {
  const fit = settings.backgroundImageFit ?? 'cover'
  const posX = settings.backgroundImagePositionX ?? 50
  const posY = settings.backgroundImagePositionY ?? 50
  const imageOpacity = Math.min(1, Math.max(0, (settings.backgroundImageOpacity ?? 100) / 100))
  const imageUrl = settings.backgroundImage?.trim()

  const rootClass = `ql-screen-bg ${fillParent ? 'ql-screen-bg--fill ' : ''}${className}`.trim()

  return (
    <div className={rootClass} style={screenBackgroundFillStyle(settings)}>
      {imageUrl ? (
        <div
          className="ql-screen-bg-image"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: fit,
            backgroundPosition: `${posX}% ${posY}%`,
            backgroundRepeat: 'no-repeat',
            opacity: imageOpacity,
          }}
          aria-hidden="true"
        />
      ) : null}
      {children != null ? <div className="ql-screen-bg-content">{children}</div> : null}
    </div>
  )
}
