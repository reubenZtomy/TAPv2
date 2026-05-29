import React from 'react'
import type { LayoutElement, TextAlign } from '../layoutTypes'

type LayoutElementViewProps = {
  element: LayoutElement
  hasAction?: boolean
}

function rowJustify(align?: TextAlign): React.CSSProperties['justifyContent'] {
  if (align === 'left') return 'flex-start'
  if (align === 'right') return 'flex-end'
  return 'center'
}

export function LayoutElementView({ element, hasAction }: LayoutElementViewProps) {
  const actionHint = hasAction && element.action?.type && element.action.type !== 'none'

  switch (element.type) {
    case 'textbox':
      return (
        <div className="admin-layout-el-textbox">
          <span className="admin-layout-el-inner admin-layout-el-placeholder">
            {element.placeholder || 'Type here…'}
          </span>
        </div>
      )
    case 'button':
      return (
        <span
          className="admin-layout-el-button"
          style={{ justifyContent: rowJustify(element.textAlign) }}
        >
          <span className="admin-layout-el-inner">{element.content || 'Next'}</span>
        </span>
      )
    case 'image':
      return element.src ? (
        <img src={element.src} alt="" draggable={false} style={{ objectFit: element.objectFit || 'contain' }} />
      ) : (
        <span className="admin-muted">Image</span>
      )
    case 'carousel':
      return (
        <div
          className="admin-layout-el-carousel"
          style={
            {
              '--carousel-slide-pct': `${element.carouselSlideWidth ?? 88}%`,
            } as React.CSSProperties
          }
        >
          {(element.carouselItems ?? []).map((item) => {
            const hasImage = Boolean(item.imageUrl)
            const hasTitle = Boolean(item.title?.trim())
            const hasBody = Boolean(item.body?.trim())
            const hasText = hasTitle || hasBody
            return (
              <div
                key={item.id}
                className={`admin-layout-el-carousel-slide ${hasImage && hasText ? 'has-both' : ''}`}
              >
                {hasImage ? (
                  <div className="admin-carousel-slide-media">
                    <img src={item.imageUrl} alt="" draggable={false} />
                  </div>
                ) : null}
                {hasText ? (
                  <div className="admin-carousel-slide-text">
                    {hasTitle ? <div className="admin-carousel-slide-title">{item.title}</div> : null}
                    {hasBody ? <div className="admin-carousel-slide-body">{item.body}</div> : null}
                  </div>
                ) : !hasImage ? (
                  <span className="admin-carousel-slide-fallback">{item.label}</span>
                ) : null}
              </div>
            )
          })}
        </div>
      )
    case 'shape':
      return (
        <div
          className={`admin-layout-el-shape admin-layout-el-shape--${element.shapeVariant || 'rectangle'}`}
        />
      )
    case 'divider':
      return <div className="admin-layout-el-divider" />
    case 'icon':
      return <span className="admin-layout-el-inner admin-layout-el-icon">{element.content || '★'}</span>
    case 'text':
    default:
      return (
        <span
          className="admin-layout-element-text"
          style={{ justifyContent: rowJustify(element.textAlign) }}
        >
          <span className="admin-layout-el-inner">{element.content || 'Text'}</span>
          {actionHint ? <span className="admin-layout-action-badge" title="Has action">↗</span> : null}
        </span>
      )
  }
}
