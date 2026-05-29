import { createLayoutElement, type LayoutElementType } from './layoutTypes'

export type ElementCatalogEntry = {
  type: LayoutElementType
  label: string
  description: string
  category: string
  keywords: string[]
  icon: string
}

export const ELEMENT_CATALOG: ElementCatalogEntry[] = [
  {
    type: 'text',
    label: 'Text',
    description: 'Static label or heading',
    category: 'Content',
    keywords: ['label', 'heading', 'title', 'paragraph', 'copy'],
    icon: 'T',
  },
  {
    type: 'textbox',
    label: 'Text box',
    description: 'Input field for user text',
    category: 'Content',
    keywords: ['input', 'field', 'form', 'textarea'],
    icon: '▭',
  },
  {
    type: 'button',
    label: 'Button',
    description: 'Tap target with navigation action',
    category: 'Buttons',
    keywords: ['cta', 'continue', 'submit', 'tap'],
    icon: '▶',
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Picture or illustration',
    category: 'Images',
    keywords: ['photo', 'picture', 'asset', 'png'],
    icon: '🖼',
  },
  {
    type: 'carousel',
    label: 'Carousel',
    description: 'Horizontal swipeable slides',
    category: 'Images',
    keywords: ['slider', 'swipe', 'cards', 'gallery'],
    icon: '⇄',
  },
  {
    type: 'shape',
    label: 'Shape',
    description: 'Rectangle or circle block',
    category: 'Layout',
    keywords: ['box', 'block', 'background', 'circle'],
    icon: '◻',
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Horizontal separator line',
    category: 'Layout',
    keywords: ['line', 'separator', 'hr'],
    icon: '—',
  },
  {
    type: 'icon',
    label: 'Icon',
    description: 'Small symbolic element',
    category: 'Content',
    keywords: ['star', 'symbol', 'emoji'],
    icon: '★',
  },
]

/** Display order for designer rail category accordions. */
export const ELEMENT_CATEGORY_ORDER = ['Buttons', 'Images', 'Content', 'Layout'] as const

export function searchCatalog(query: string): ElementCatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return ELEMENT_CATALOG
  return ELEMENT_CATALOG.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.keywords.some((k) => k.includes(q))
  )
}

export function addElementFromCatalog(type: LayoutElementType) {
  return createLayoutElement(type)
}
