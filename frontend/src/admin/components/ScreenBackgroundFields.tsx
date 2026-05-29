import React, { useState } from 'react'
import { uploadQuizAsset } from '../api'
import {
  DEFAULT_SCREEN_BACKGROUND,
  DEFAULT_SCREEN_BACKGROUND_GRADIENT_END,
  DEFAULT_SCREEN_BACKGROUND_SETTINGS,
  linearGradientCss,
  type ScreenBackgroundFill,
  type ScreenBackgroundSettings,
} from '../layoutTypes'
import { sliderWithNumber, toHexColor } from './elementEditorFields'

type ScreenBackgroundFieldsProps = {
  settings: ScreenBackgroundSettings
  onChange: (settings: ScreenBackgroundSettings) => void
}

export function ScreenBackgroundFields({ settings, onChange }: ScreenBackgroundFieldsProps) {
  const [uploading, setUploading] = useState(false)

  const patch = (partial: Partial<ScreenBackgroundSettings>) => {
    onChange({ ...settings, ...partial })
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const { url } = await uploadQuizAsset(file)
      patch({ backgroundImage: url })
    } finally {
      setUploading(false)
    }
  }

  const hasImage = Boolean(settings.backgroundImage?.trim())
  const isLinear = settings.backgroundFill === 'linear'

  const setFill = (fill: ScreenBackgroundFill) => {
    if (fill === 'linear') {
      onChange({
        ...settings,
        backgroundFill: 'linear',
        backgroundColorEnd:
          settings.backgroundColorEnd?.trim() || DEFAULT_SCREEN_BACKGROUND_GRADIENT_END,
        backgroundGradientAngle: settings.backgroundGradientAngle ?? 180,
        backgroundGradientStartStop: settings.backgroundGradientStartStop ?? 0,
        backgroundGradientEndStop: settings.backgroundGradientEndStop ?? 100,
      })
    } else {
      onChange({
        ...settings,
        backgroundFill: 'solid',
      })
    }
  }

  return (
    <section className="admin-inspector-section">
      <h4 className="admin-inspector-heading">Screen background</h4>

      <label className="admin-inspector-field">
        <span className="admin-inspector-label">Background fill</span>
        <select
          className="admin-select admin-inspector-input"
          value={settings.backgroundFill ?? 'solid'}
          onChange={(e) => setFill(e.target.value as ScreenBackgroundFill)}
        >
          <option value="solid">Solid color</option>
          <option value="linear">Linear gradient</option>
        </select>
      </label>

      {isLinear ? (
        <>
          <label className="admin-inspector-field">
            <span className="admin-inspector-label">Gradient start</span>
            <div className="admin-inspector-color-row">
              <input
                type="color"
                className="admin-inspector-color"
                value={toHexColor(settings.backgroundColor, DEFAULT_SCREEN_BACKGROUND)}
                onChange={(e) => patch({ backgroundColor: e.target.value })}
              />
              <input
                className="admin-input admin-inspector-input"
                value={settings.backgroundColor}
                onChange={(e) => patch({ backgroundColor: e.target.value })}
              />
            </div>
          </label>
          {sliderWithNumber(
            'Start color position',
            settings.backgroundGradientStartStop ?? 0,
            (backgroundGradientStartStop) => patch({ backgroundGradientStartStop }),
            { min: 0, max: 100 }
          )}
          <label className="admin-inspector-field">
            <span className="admin-inspector-label">Gradient end</span>
            <div className="admin-inspector-color-row">
              <input
                type="color"
                className="admin-inspector-color"
                value={toHexColor(
                  settings.backgroundColorEnd,
                  DEFAULT_SCREEN_BACKGROUND_GRADIENT_END
                )}
                onChange={(e) => patch({ backgroundColorEnd: e.target.value })}
              />
              <input
                className="admin-input admin-inspector-input"
                value={settings.backgroundColorEnd ?? ''}
                onChange={(e) => patch({ backgroundColorEnd: e.target.value })}
              />
            </div>
          </label>
          {sliderWithNumber(
            'End color position',
            settings.backgroundGradientEndStop ?? 100,
            (backgroundGradientEndStop) => patch({ backgroundGradientEndStop }),
            { min: 0, max: 100 }
          )}
          {sliderWithNumber(
            'Gradient angle',
            settings.backgroundGradientAngle ?? 180,
            (backgroundGradientAngle) => patch({ backgroundGradientAngle }),
            { min: 0, max: 360, unit: '°' }
          )}
          <p className="admin-muted admin-inspector-note" style={{ marginTop: -4, fontSize: 15 }}>
            0° = upward · 90° = right · 180° = downward (default)
          </p>
          <div
            className="admin-screen-bg-gradient-preview"
            style={{ background: linearGradientCss(settings) }}
            aria-hidden="true"
          />
        </>
      ) : (
        <label className="admin-inspector-field">
          <span className="admin-inspector-label">Background color</span>
          <div className="admin-inspector-color-row">
            <input
              type="color"
              className="admin-inspector-color"
              value={toHexColor(settings.backgroundColor, DEFAULT_SCREEN_BACKGROUND)}
              onChange={(e) => patch({ backgroundColor: e.target.value })}
            />
            <input
              className="admin-input admin-inspector-input"
              value={settings.backgroundColor}
              onChange={(e) => patch({ backgroundColor: e.target.value })}
            />
          </div>
        </label>
      )}

      <label className="admin-inspector-field">
        <span className="admin-inspector-label">Background image URL</span>
        <input
          className="admin-input admin-inspector-input"
          value={settings.backgroundImage ?? ''}
          placeholder="https://… or upload below"
          onChange={(e) => patch({ backgroundImage: e.target.value.trim() || undefined })}
        />
      </label>

      <label className="admin-btn admin-btn--small admin-btn--file admin-inspector-upload">
        {uploading ? 'Uploading…' : hasImage ? 'Replace image' : 'Upload image'}
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          hidden
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleUpload(f)
            e.target.value = ''
          }}
        />
      </label>

      {hasImage ? (
        <>
          <div className="admin-screen-bg-thumb-wrap">
            <img
              src={settings.backgroundImage}
              alt=""
              className="admin-screen-bg-thumb"
              draggable={false}
            />
          </div>

          <label className="admin-inspector-field">
            <span className="admin-inspector-label">Image fit</span>
            <select
              className="admin-select admin-inspector-input"
              value={settings.backgroundImageFit ?? 'cover'}
              onChange={(e) =>
                patch({
                  backgroundImageFit: e.target.value as ScreenBackgroundSettings['backgroundImageFit'],
                })
              }
            >
              <option value="cover">Cover (fill screen)</option>
              <option value="contain">Contain</option>
              <option value="fill">Stretch</option>
            </select>
          </label>

          {sliderWithNumber(
            'Horizontal position',
            settings.backgroundImagePositionX ?? 50,
            (backgroundImagePositionX) => patch({ backgroundImagePositionX }),
            { min: 0, max: 100 }
          )}
          {sliderWithNumber(
            'Vertical position',
            settings.backgroundImagePositionY ?? 50,
            (backgroundImagePositionY) => patch({ backgroundImagePositionY }),
            { min: 0, max: 100 }
          )}
          {sliderWithNumber(
            'Image opacity',
            settings.backgroundImageOpacity ?? 100,
            (backgroundImageOpacity) => patch({ backgroundImageOpacity }),
            { min: 0, max: 100 }
          )}

          <button
            type="button"
            className="admin-btn admin-btn--small admin-btn--danger"
            onClick={() =>
              patch({
                backgroundImage: undefined,
                backgroundImageFit: DEFAULT_SCREEN_BACKGROUND_SETTINGS.backgroundImageFit,
                backgroundImagePositionX: DEFAULT_SCREEN_BACKGROUND_SETTINGS.backgroundImagePositionX,
                backgroundImagePositionY: DEFAULT_SCREEN_BACKGROUND_SETTINGS.backgroundImagePositionY,
                backgroundImageOpacity: DEFAULT_SCREEN_BACKGROUND_SETTINGS.backgroundImageOpacity,
              })
            }
          >
            Remove image
          </button>
        </>
      ) : null}

      <button
        type="button"
        className="admin-btn admin-btn--small"
        style={{ marginTop: 8 }}
        onClick={() => onChange({ ...DEFAULT_SCREEN_BACKGROUND_SETTINGS })}
      >
        Reset screen background
      </button>
    </section>
  )
}
