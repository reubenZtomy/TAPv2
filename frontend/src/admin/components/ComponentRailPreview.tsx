import React from 'react'
import {
  DEFAULT_BUTTON_STYLE,
  DEFAULT_CAROUSEL_STYLE,
  DEFAULT_DIVIDER_STYLE,
  DEFAULT_ICON_STYLE,
  DEFAULT_IMAGE_STYLE,
  DEFAULT_SHAPE_STYLE,
  DEFAULT_TEXT_STYLE,
  DEFAULT_TEXTBOX_STYLE,
  type LayoutElementType,
} from '../layoutTypes'

type ComponentRailPreviewProps = {
  type: LayoutElementType
}

function px(n: number | undefined, fallback = 0): string {
  return `${n ?? fallback}px`
}

/** Visual sample in the Components rail (matches default insert styling). */
export function ComponentRailPreview({ type }: ComponentRailPreviewProps) {
  return (
    <div className="admin-designer-rail-preview-wrap" aria-hidden="true">
      <div className={`admin-designer-rail-preview admin-designer-rail-preview--${type}`}>
        {type === 'text' && (
          <p
            className="admin-designer-rail-preview-text"
            style={{
              color: DEFAULT_TEXT_STYLE.color,
              fontSize: 20,
              fontWeight: DEFAULT_TEXT_STYLE.fontWeight,
              textAlign: DEFAULT_TEXT_STYLE.textAlign,
            }}
          >
            Text label
          </p>
        )}

        {type === 'textbox' && (
          <div
            className="admin-designer-rail-preview-textbox"
            style={{
              backgroundColor: DEFAULT_TEXTBOX_STYLE.backgroundColor,
              color: DEFAULT_TEXTBOX_STYLE.color,
              borderRadius: px(DEFAULT_TEXTBOX_STYLE.borderRadius, 10),
              border: `${DEFAULT_TEXTBOX_STYLE.borderWidth ?? 2}px solid ${DEFAULT_TEXTBOX_STYLE.borderColor}`,
              fontSize: 17,
              textAlign: DEFAULT_TEXTBOX_STYLE.textAlign,
            }}
          >
            {DEFAULT_TEXTBOX_STYLE.placeholder}
          </div>
        )}

        {type === 'button' && (
          <span
            className="admin-designer-rail-preview-button"
            style={{
              backgroundColor: DEFAULT_BUTTON_STYLE.backgroundColor,
              color: DEFAULT_BUTTON_STYLE.color,
              borderRadius: px(DEFAULT_BUTTON_STYLE.borderRadius, 8),
              border:
                (DEFAULT_BUTTON_STYLE.borderWidth ?? 0) > 0
                  ? `${DEFAULT_BUTTON_STYLE.borderWidth}px solid ${DEFAULT_BUTTON_STYLE.borderColor ?? '#1d4ed8'}`
                  : undefined,
              fontSize: 18,
              fontWeight: DEFAULT_BUTTON_STYLE.fontWeight,
            }}
          >
            {DEFAULT_BUTTON_STYLE.content}
          </span>
        )}

        {type === 'image' && (
          <div
            className="admin-designer-rail-preview-image"
            style={{
              backgroundColor: DEFAULT_IMAGE_STYLE.backgroundColor,
              borderRadius: px(DEFAULT_IMAGE_STYLE.borderRadius, 8),
              border: `${DEFAULT_IMAGE_STYLE.borderWidth ?? 2}px dashed ${DEFAULT_IMAGE_STYLE.borderColor}`,
            }}
          >
            <span className="admin-designer-rail-preview-image-icon" aria-hidden="true">
              🖼
            </span>
            <span>Image placeholder</span>
          </div>
        )}

        {type === 'carousel' && (
          <div
            className="admin-designer-rail-preview-carousel"
            style={{
              backgroundColor: DEFAULT_CAROUSEL_STYLE.backgroundColor,
              borderRadius: px(DEFAULT_CAROUSEL_STYLE.borderRadius, 12),
            }}
          >
            {[1, 2, 3].map((n) => (
              <div key={n} className="admin-designer-rail-preview-carousel-slide">
                Slide {n}
              </div>
            ))}
          </div>
        )}

        {type === 'shape' && (
          <div
            className="admin-designer-rail-preview-shape"
            style={{
              backgroundColor: DEFAULT_SHAPE_STYLE.backgroundColor,
              borderRadius: px(DEFAULT_SHAPE_STYLE.borderRadius, 12),
            }}
          />
        )}

        {type === 'divider' && (
          <div className="admin-designer-rail-preview-divider-wrap">
            <div
              className="admin-designer-rail-preview-divider"
              style={{
                backgroundColor: DEFAULT_DIVIDER_STYLE.backgroundColor,
                height: px(DEFAULT_DIVIDER_STYLE.height, 4),
              }}
            />
          </div>
        )}

        {type === 'icon' && (
          <div
            className="admin-designer-rail-preview-icon"
            style={{
              backgroundColor: DEFAULT_ICON_STYLE.backgroundColor,
              color: DEFAULT_ICON_STYLE.color,
              borderRadius: px(DEFAULT_ICON_STYLE.borderRadius, 12),
              fontSize: 28,
            }}
          >
            {DEFAULT_ICON_STYLE.content}
          </div>
        )}
      </div>
    </div>
  )
}
