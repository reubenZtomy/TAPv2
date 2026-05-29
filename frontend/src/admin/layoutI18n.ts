import type { CarouselItem, LayoutElement } from './layoutTypes'
import { getLayoutElements } from './layoutTypes'

export type LayoutElementI18n = {
  content?: string
  placeholder?: string
  carouselItems?: CarouselItem[]
}

export type LayoutI18nStore = Record<string, Record<string, LayoutElementI18n>>

export type IntroI18nEntry = {
  heading?: string
  subtitle?: string
  startButton?: string
  elements?: Record<string, LayoutElementI18n>
}

export type IntroI18nStore = Record<string, IntroI18nEntry>

export function getLayoutI18n(layout?: Record<string, unknown> | null): LayoutI18nStore {
  const raw = layout?.i18n
  if (!raw || typeof raw !== 'object') return {}
  return raw as LayoutI18nStore
}

export function getIntroI18n(intro?: Record<string, unknown> | null): IntroI18nStore {
  const raw = intro?.i18n
  if (!raw || typeof raw !== 'object') return {}
  return raw as IntroI18nStore
}

function overlayCarouselItems(
  base: CarouselItem[] | undefined,
  patch: CarouselItem[] | undefined
): CarouselItem[] | undefined {
  if (!patch?.length) return base
  if (!base?.length) return patch
  return base.map((item, idx) => {
    const override = patch[idx]
    if (!override) return item
    return {
      ...item,
      label: override.label ?? item.label,
      title: override.title ?? item.title,
      body: override.body ?? item.body,
    }
  })
}

export function applyElementI18n(el: LayoutElement, patch?: LayoutElementI18n): LayoutElement {
  if (!patch) return el
  return {
    ...el,
    content: patch.content !== undefined ? patch.content : el.content,
    placeholder: patch.placeholder !== undefined ? patch.placeholder : el.placeholder,
    carouselItems: overlayCarouselItems(el.carouselItems, patch.carouselItems) ?? el.carouselItems,
  }
}

export function applyLayoutLanguage(
  layout: Record<string, unknown> | LayoutElement[] | undefined,
  languageCode: string,
  defaultLanguage?: string
): LayoutElement[] {
  const elements = Array.isArray(layout) ? layout : getLayoutElements(layout)
  if (!languageCode || (defaultLanguage && languageCode === defaultLanguage)) return elements
  const i18n = getLayoutI18n(Array.isArray(layout) ? undefined : layout)
  const langPatch = i18n[languageCode]
  if (!langPatch) return elements
  return elements.map((el) => applyElementI18n(el, langPatch[el.id]))
}

export function extractElementI18n(el: LayoutElement): LayoutElementI18n | null {
  const patch: LayoutElementI18n = {}
  if (el.content?.trim()) patch.content = el.content
  if (el.placeholder?.trim()) patch.placeholder = el.placeholder
  if (el.carouselItems?.length) {
    patch.carouselItems = el.carouselItems.map((item) => ({
      id: item.id,
      label: item.label,
      imageUrl: item.imageUrl,
      title: item.title,
      body: item.body,
    }))
  }
  return Object.keys(patch).length > 0 ? patch : null
}

export function extractLayoutStrings(elements: LayoutElement[]): Record<string, LayoutElementI18n> {
  const out: Record<string, LayoutElementI18n> = {}
  for (const el of elements) {
    if (el.type === 'language_switch') continue
    const strings = extractElementI18n(el)
    if (strings) out[el.id] = strings
  }
  return out
}

export function resolveIntroStrings(
  intro: Record<string, unknown> | null | undefined,
  languageCode: string,
  defaultLanguage?: string
): { heading: string; subtitle: string; startButton: string } {
  const base = {
    heading: typeof intro?.heading === 'string' ? intro.heading : '',
    subtitle: typeof intro?.subtitle === 'string' ? intro.subtitle : '',
    startButton: typeof intro?.startButton === 'string' ? intro.startButton : '',
  }
  if (!languageCode || (defaultLanguage && languageCode === defaultLanguage)) return base
  const entry = getIntroI18n(intro)[languageCode]
  if (!entry) return base
  return {
    heading: entry.heading ?? base.heading,
    subtitle: entry.subtitle ?? base.subtitle,
    startButton: entry.startButton ?? base.startButton,
  }
}
