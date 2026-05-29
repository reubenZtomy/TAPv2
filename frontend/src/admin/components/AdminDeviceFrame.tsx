import React from 'react'
import { QuizLayoutFontRoot } from '../../layout/QuizLayoutFontRoot'
import { ScreenBackgroundLayer } from '../../layout/ScreenBackgroundLayer'
import { CANVAS_H, CANVAS_W, type ScreenBackgroundSettings } from '../layoutTypes'
import type { QuizCustomFont } from '../../utils/quizFont'

type AdminDeviceFrameProps = {
  children: React.ReactNode
  className?: string
  screenBackground?: ScreenBackgroundSettings
  customFont?: QuizCustomFont | null
}

/** Fixed 375×812 phone frame for admin preview (does not scale to full viewport). */
export function AdminDeviceFrame({
  children,
  className = '',
  screenBackground,
  customFont,
}: AdminDeviceFrameProps) {
  return (
    <QuizLayoutFontRoot customFont={customFont} className={`admin-device-frame-outer ${className}`.trim()}>
      <div
        className="admin-device-frame"
        style={{ width: CANVAS_W, height: CANVAS_H }}
      >
        <div className="admin-device-frame-notch" aria-hidden="true" />
        <div className="admin-device-content">
          {screenBackground ? (
            <ScreenBackgroundLayer settings={screenBackground} className="admin-device-screen-bg">
              {children}
            </ScreenBackgroundLayer>
          ) : (
            children
          )}
        </div>
      </div>
    </QuizLayoutFontRoot>
  )
}
