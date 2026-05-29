import React from 'react'
import type { LayoutElement, TextAlign } from '../admin/layoutTypes'
import { LanguageSwitchElement } from './LanguageSwitchElement'

function rowJustify(align?: TextAlign): React.CSSProperties['justifyContent'] {
  if (align === 'left') return 'flex-start'
  if (align === 'right') return 'flex-end'
  return 'center'
}

type RuntimeLayoutElementProps = {
  element: LayoutElement
  languages?: string[]
  languageLabels?: Record<string, string>
  selectedLanguage?: string
  onLanguageChange?: (language: string) => void
  preview?: boolean
}

export function RuntimeLayoutElement({
  element,
  languages = [],
  languageLabels,
  selectedLanguage = '',
  onLanguageChange,
  preview = false,
}: RuntimeLayoutElementProps) {
  switch (element.type) {
    case 'language_switch':
      return (
        <LanguageSwitchElement
          element={element}
          languages={languages}
          languageLabels={languageLabels}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          preview={preview}
        />
      )
    case 'textbox':
      return (
        <div className="ql-el-textbox">
          <span className="ql-el-inner ql-el-placeholder">{element.placeholder || 'Type here…'}</span>
        </div>
      )
    case 'button':
      return (
        <span className="ql-el-button" style={{ justifyContent: rowJustify(element.textAlign) }}>
          <span className="ql-el-inner">{element.content || 'Button'}</span>
        </span>
      )
    case 'image':
      return element.src ? (
        <img src={element.src} alt="" draggable={false} style={{ objectFit: element.objectFit || 'contain' }} />
      ) : (
        <span className="ql-el-fallback">Image</span>
      )
    case 'carousel':
      return (
        <div
          className="ql-el-carousel"
          style={
            { '--carousel-slide-pct': `${element.carouselSlideWidth ?? 88}%` } as React.CSSProperties
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
                className={`ql-carousel-slide ${hasImage && hasText ? 'has-both' : ''}`}
              >
                {hasImage ? (
                  <div className="ql-carousel-slide-media">
                    <img src={item.imageUrl} alt="" draggable={false} />
                  </div>
                ) : null}
                {hasText ? (
                  <div className="ql-carousel-slide-text">
                    {hasTitle ? <div className="ql-carousel-slide-title">{item.title}</div> : null}
                    {hasBody ? <div className="ql-carousel-slide-body">{item.body}</div> : null}
                  </div>
                ) : !hasImage ? (
                  <span className="ql-carousel-slide-fallback">{item.label}</span>
                ) : null}
              </div>
            )
          })}
        </div>
      )
    case 'shape':
      return (
        <div className={`ql-el-shape ql-el-shape--${element.shapeVariant || 'rectangle'}`} />
      )
    case 'divider':
      return <div className="ql-el-divider" />
    case 'icon':
      return <span className="ql-el-inner ql-el-icon">{element.content || '★'}</span>
    case 'text':
    default:
      return (
        <span className="ql-el-text" style={{ justifyContent: rowJustify(element.textAlign) }}>
          <span className="ql-el-inner">{element.content || 'Text'}</span>
        </span>
      )
  }
}
