import type { LayoutElement, TextAlign } from '../admin/layoutTypes'

function justifyFromTextAlign(align?: TextAlign): React.CSSProperties['justifyContent'] {
  if (align === 'left') return 'flex-start'
  if (align === 'right') return 'flex-end'
  return 'center'
}

const TYPOGRAPHIC_TYPES = new Set(['text', 'textbox', 'button', 'icon'])

export function layoutElementStyle(el: LayoutElement): React.CSSProperties {
  const border =
    (el.borderWidth ?? 0) > 0
      ? `${el.borderWidth}px solid ${el.borderColor || '#152840'}`
      : undefined
  const align = el.textAlign ?? 'center'
  const isTypographic = TYPOGRAPHIC_TYPES.has(el.type)
  const isCarousel = el.type === 'carousel'

  return {
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    zIndex: el.zIndex ?? 1,
    alignItems: isCarousel ? 'stretch' : 'center',
    justifyContent: isCarousel ? 'flex-start' : isTypographic ? justifyFromTextAlign(align) : 'center',
    fontSize: isTypographic && el.fontSize ? `${el.fontSize}px` : undefined,
    fontFamily: isTypographic
      ? "var(--quiz-layout-font, 'Dongle', system-ui, sans-serif)"
      : undefined,
    fontWeight: isTypographic ? el.fontWeight : undefined,
    lineHeight: isTypographic ? 1.15 : undefined,
    backgroundColor: el.backgroundColor === 'transparent' ? 'transparent' : el.backgroundColor,
    color: isTypographic ? el.color : undefined,
    borderRadius:
      el.shapeVariant === 'circle'
        ? '50%'
        : el.borderRadius != null
          ? `${el.borderRadius}px`
          : undefined,
    opacity: el.opacity ?? 1,
    textAlign: isTypographic ? align : undefined,
    padding: el.padding != null ? `${el.padding}px` : undefined,
    border,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    boxSizing: 'border-box',
  }
}
