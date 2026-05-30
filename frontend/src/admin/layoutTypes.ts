export type LayoutElementType =
  | 'text'
  | 'textbox'
  | 'image'
  | 'button'
  | 'carousel'
  | 'shape'
  | 'divider'
  | 'icon'
  | 'language_switch'

export type TextAlign = 'left' | 'center' | 'right'
export type ObjectFit = 'contain' | 'cover' | 'fill'
export type ShapeVariant = 'rectangle' | 'circle'
export type NavigateTarget = 'intro' | number | 'next' | 'previous'

export type ElementActionType = 'none' | 'navigate' | 'next' | 'previous' | 'back'

export type ElementAction = {
  type: ElementActionType
  /** Used when type is navigate */
  target?: NavigateTarget
  /** Answer option_key to store for the current question when this element is tapped */
  recordOption?: string
}

export type CarouselItem = {
  id: string
  /** Internal name in the slide list */
  label: string
  imageUrl?: string
  /** Visible heading on the slide */
  title?: string
  /** Visible body copy on the slide */
  body?: string
}

export function normalizeCarouselItem(raw: Partial<CarouselItem>, fallbackLabel: string): CarouselItem {
  return {
    id: String(raw.id || newElementId()),
    label: String(raw.label || fallbackLabel),
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
    title: typeof raw.title === 'string' ? raw.title : '',
    body: typeof raw.body === 'string' ? raw.body : '',
  }
}

export function defaultCarouselItems(count = 3): CarouselItem[] {
  return Array.from({ length: count }, (_, i) =>
    normalizeCarouselItem({ label: `Slide ${i + 1}` }, `Slide ${i + 1}`)
  )
}

export type LayoutElement = {
  id: string
  type: LayoutElementType
  content?: string
  placeholder?: string
  src?: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  zIndex?: number
  backgroundColor?: string
  color?: string
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  opacity?: number
  padding?: number
  fontWeight?: number | string
  textAlign?: TextAlign
  objectFit?: ObjectFit
  rotation?: number
  shapeVariant?: ShapeVariant
  carouselItems?: CarouselItem[]
  /** Width of each slide as % of carousel inner width (no horizontal scroll in builder) */
  carouselSlideWidth?: number
  action?: ElementAction
  /** Mark element as selectable option for the current question. */
  isOption?: boolean
  /** Option key saved when this option element is tapped (defaults to action.recordOption). */
  optionKey?: string
  /** Applied while option is selected in quiz runtime. */
  optionActiveColor?: string
  /** Applied while option is not selected in quiz runtime. */
  optionInactiveColor?: string
}

export type IntroLayout = {
  heading?: string
  subtitle?: string
  startButton?: string
  elements?: LayoutElement[]
  i18n?: Record<
    string,
    {
      heading?: string
      subtitle?: string
      startButton?: string
      elements?: Record<string, { content?: string; placeholder?: string; carouselItems?: CarouselItem[] }>
    }
  >
}

export type ScreenBackgroundImageFit = 'cover' | 'contain' | 'fill'
export type ScreenBackgroundFill = 'solid' | 'linear'

export type ScreenBackgroundSettings = {
  backgroundFill?: ScreenBackgroundFill
  backgroundColor: string
  /** End color when backgroundFill is linear */
  backgroundColorEnd?: string
  /** Gradient angle in degrees (0 = bottom→top, 180 = top→bottom) */
  backgroundGradientAngle?: number
  /** 0–100 — where the start color sits along the gradient */
  backgroundGradientStartStop?: number
  /** 0–100 — where the end color sits along the gradient */
  backgroundGradientEndStop?: number
  backgroundImage?: string
  backgroundImageFit?: ScreenBackgroundImageFit
  /** 0–100 — horizontal focal point for background image */
  backgroundImagePositionX?: number
  /** 0–100 — vertical focal point for background image */
  backgroundImagePositionY?: number
  /** 0–100 — image layer opacity (color shows through when lower) */
  backgroundImageOpacity?: number
}

export type QuestionLayoutConfig = {
  template?: string
  elements?: LayoutElement[]
  /** Phone screen fill behind layout elements */
  backgroundColor?: string
  backgroundFill?: ScreenBackgroundFill
  backgroundColorEnd?: string
  backgroundGradientAngle?: number
  backgroundGradientStartStop?: number
  backgroundGradientEndStop?: number
  backgroundImage?: string
  backgroundImageFit?: ScreenBackgroundImageFit
  backgroundImagePositionX?: number
  backgroundImagePositionY?: number
  backgroundImageOpacity?: number
  [key: string]: unknown
}

export const DEFAULT_SCREEN_BACKGROUND = '#f8fafc'
export const DEFAULT_SCREEN_BACKGROUND_GRADIENT_END = '#cbd5e1'

export const DEFAULT_SCREEN_BACKGROUND_SETTINGS: ScreenBackgroundSettings = {
  backgroundFill: 'solid',
  backgroundColor: DEFAULT_SCREEN_BACKGROUND,
  backgroundColorEnd: DEFAULT_SCREEN_BACKGROUND_GRADIENT_END,
  backgroundGradientAngle: 180,
  backgroundGradientStartStop: 0,
  backgroundGradientEndStop: 100,
  backgroundImageFit: 'cover',
  backgroundImagePositionX: 50,
  backgroundImagePositionY: 50,
  backgroundImageOpacity: 100,
}

function clampPercent(n: unknown, fallback: number): number {
  const v = Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.min(100, Math.max(0, Math.round(v)))
}

function clampAngle(n: unknown, fallback: number): number {
  const v = Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.min(360, Math.max(0, Math.round(v)))
}

/** CSS linear-gradient() for screen background settings. */
export function linearGradientCss(settings: ScreenBackgroundSettings): string {
  const start = settings.backgroundColor?.trim() || DEFAULT_SCREEN_BACKGROUND
  const end = settings.backgroundColorEnd?.trim() || DEFAULT_SCREEN_BACKGROUND_GRADIENT_END
  const angle = clampAngle(settings.backgroundGradientAngle, 180)
  const startStop = clampPercent(settings.backgroundGradientStartStop, 0)
  const endStop = clampPercent(settings.backgroundGradientEndStop, 100)
  return `linear-gradient(${angle}deg, ${start} ${startStop}%, ${end} ${endStop}%)`
}

/** CSS for screen fill (solid color or linear gradient). */
export function screenBackgroundFillStyle(
  settings: ScreenBackgroundSettings
): Record<string, string> {
  if (settings.backgroundFill === 'linear') {
    return { background: linearGradientCss(settings) }
  }
  return {
    backgroundColor: settings.backgroundColor?.trim() || DEFAULT_SCREEN_BACKGROUND,
  }
}

export function getLayoutBackgroundColor(layout?: Record<string, unknown> | null): string {
  const value = layout?.backgroundColor
  if (typeof value === 'string' && value.trim()) return value.trim()
  return DEFAULT_SCREEN_BACKGROUND
}

export function getScreenBackgroundSettings(
  layout?: Record<string, unknown> | null
): ScreenBackgroundSettings {
  const fit = layout?.backgroundImageFit
  const fill = layout?.backgroundFill
  return {
    backgroundFill: fill === 'linear' ? 'linear' : 'solid',
    backgroundColor: getLayoutBackgroundColor(layout),
    backgroundColorEnd:
      typeof layout?.backgroundColorEnd === 'string' && layout.backgroundColorEnd.trim()
        ? layout.backgroundColorEnd.trim()
        : DEFAULT_SCREEN_BACKGROUND_GRADIENT_END,
    backgroundGradientAngle: clampAngle(layout?.backgroundGradientAngle, 180),
    backgroundGradientStartStop: clampPercent(layout?.backgroundGradientStartStop, 0),
    backgroundGradientEndStop: clampPercent(layout?.backgroundGradientEndStop, 100),
    backgroundImage:
      typeof layout?.backgroundImage === 'string' && layout.backgroundImage.trim()
        ? layout.backgroundImage.trim()
        : undefined,
    backgroundImageFit:
      fit === 'cover' || fit === 'contain' || fit === 'fill' ? fit : 'cover',
    backgroundImagePositionX: clampPercent(layout?.backgroundImagePositionX, 50),
    backgroundImagePositionY: clampPercent(layout?.backgroundImagePositionY, 50),
    backgroundImageOpacity: clampPercent(layout?.backgroundImageOpacity, 100),
  }
}

export function screenBackgroundToLayoutFields(
  settings: ScreenBackgroundSettings
): Partial<QuestionLayoutConfig> {
  const fields: Partial<QuestionLayoutConfig> = {
    backgroundColor: settings.backgroundColor?.trim() || DEFAULT_SCREEN_BACKGROUND,
  }
  if (settings.backgroundFill === 'linear') {
    fields.backgroundFill = 'linear'
    fields.backgroundColorEnd =
      settings.backgroundColorEnd?.trim() || DEFAULT_SCREEN_BACKGROUND_GRADIENT_END
    fields.backgroundGradientAngle = clampAngle(settings.backgroundGradientAngle, 180)
    fields.backgroundGradientStartStop = clampPercent(settings.backgroundGradientStartStop, 0)
    fields.backgroundGradientEndStop = clampPercent(settings.backgroundGradientEndStop, 100)
  }
  const image = settings.backgroundImage?.trim()
  if (image) {
    fields.backgroundImage = image
    fields.backgroundImageFit = settings.backgroundImageFit ?? 'cover'
    fields.backgroundImagePositionX = clampPercent(settings.backgroundImagePositionX, 50)
    fields.backgroundImagePositionY = clampPercent(settings.backgroundImagePositionY, 50)
    fields.backgroundImageOpacity = clampPercent(settings.backgroundImageOpacity, 100)
  }
  return fields
}

/** Merge screen background into layout JSON and strip image keys when removed. */
export function applyScreenBackgroundToLayout(
  layout: Record<string, unknown>,
  settings: ScreenBackgroundSettings
): void {
  Object.assign(layout, screenBackgroundToLayoutFields(settings))
  if (!settings.backgroundImage?.trim()) {
    delete layout.backgroundImage
    delete layout.backgroundImageFit
    delete layout.backgroundImagePositionX
    delete layout.backgroundImagePositionY
    delete layout.backgroundImageOpacity
  }
  if (settings.backgroundFill !== 'linear') {
    delete layout.backgroundFill
    delete layout.backgroundColorEnd
    delete layout.backgroundGradientAngle
    delete layout.backgroundGradientStartStop
    delete layout.backgroundGradientEndStop
  }
}

export type PreviewTarget = 'intro' | number

export type ScreenOption = {
  id: PreviewTarget
  label: string
}

export const CANVAS_W = 375
export const CANVAS_H = 812
export const MIN_ELEMENT_SIZE = 24

export const INTERACTIVE_ELEMENT_TYPES: LayoutElementType[] = [
  'text',
  'textbox',
  'button',
  'image',
  'icon',
]

export const DEFAULT_TEXT_STYLE: Partial<LayoutElement> = {
  backgroundColor: 'transparent',
  color: '#152840',
  borderRadius: 0,
  borderWidth: 0,
  opacity: 1,
  padding: 4,
  fontSize: 22,
  fontWeight: 700,
  textAlign: 'center',
  zIndex: 10,
  action: { type: 'none' },
}

export const DEFAULT_TEXTBOX_STYLE: Partial<LayoutElement> = {
  backgroundColor: '#ffffff',
  color: '#152840',
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#4d688c',
  opacity: 1,
  padding: 10,
  fontSize: 20,
  fontWeight: 400,
  textAlign: 'left',
  zIndex: 10,
  placeholder: 'Type here…',
  action: { type: 'none' },
}

/** Default primary CTA — squared, slightly rounded, “Next” (template-app style). */
export const DEFAULT_BUTTON_STYLE: Partial<LayoutElement> = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  borderRadius: 8,
  borderWidth: 0,
  borderColor: '#1d4ed8',
  opacity: 1,
  padding: 14,
  fontSize: 20,
  fontWeight: 600,
  textAlign: 'center',
  zIndex: 12,
  content: 'Next',
  action: { type: 'next' },
}

export const DEFAULT_IMAGE_STYLE: Partial<LayoutElement> = {
  backgroundColor: '#f1f5f9',
  borderRadius: 8,
  borderWidth: 2,
  borderColor: '#cbd5e1',
  opacity: 1,
  padding: 0,
  objectFit: 'contain',
  zIndex: 10,
  action: { type: 'none' },
}

export const DEFAULT_CAROUSEL_STYLE: Partial<LayoutElement> = {
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderRadius: 12,
  borderWidth: 0,
  opacity: 1,
  zIndex: 10,
  carouselSlideWidth: 88,
  action: { type: 'none' },
}

export const DEFAULT_SHAPE_STYLE: Partial<LayoutElement> = {
  backgroundColor: 'rgba(77, 104, 140, 0.35)',
  borderRadius: 12,
  borderWidth: 0,
  opacity: 1,
  zIndex: 5,
  shapeVariant: 'rectangle',
  action: { type: 'none' },
}

export const DEFAULT_DIVIDER_STYLE: Partial<LayoutElement> = {
  backgroundColor: '#e2e8f0',
  borderRadius: 0,
  height: 4,
  width: 280,
  zIndex: 8,
  action: { type: 'none' },
}

export const DEFAULT_ICON_STYLE: Partial<LayoutElement> = {
  backgroundColor: 'rgba(255,255,255,0.9)',
  color: '#152840',
  borderRadius: 12,
  fontSize: 32,
  zIndex: 10,
  content: '★',
  action: { type: 'none' },
}

export const DEFAULT_LANGUAGE_SWITCH_STYLE: Partial<LayoutElement> = {
  backgroundColor: '#ffffff',
  color: '#0f172a',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#cbd5e1',
  fontSize: 16,
  zIndex: 20,
  action: { type: 'none' },
}

const DEFAULTS_BY_TYPE: Record<LayoutElementType, Partial<LayoutElement>> = {
  text: DEFAULT_TEXT_STYLE,
  textbox: DEFAULT_TEXTBOX_STYLE,
  button: DEFAULT_BUTTON_STYLE,
  image: DEFAULT_IMAGE_STYLE,
  carousel: DEFAULT_CAROUSEL_STYLE,
  shape: DEFAULT_SHAPE_STYLE,
  divider: DEFAULT_DIVIDER_STYLE,
  icon: DEFAULT_ICON_STYLE,
  language_switch: DEFAULT_LANGUAGE_SWITCH_STYLE,
}

const DEFAULT_SIZE: Record<LayoutElementType, { width: number; height: number }> = {
  text: { width: 220, height: 40 },
  textbox: { width: 280, height: 52 },
  button: { width: 311, height: 48 },
  image: { width: 140, height: 140 },
  carousel: { width: 320, height: 160 },
  shape: { width: 120, height: 120 },
  divider: { width: 280, height: 4 },
  icon: { width: 64, height: 64 },
  language_switch: { width: 200, height: 48 },
}

export function newElementId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function duplicateLayoutElement(el: LayoutElement): LayoutElement {
  return {
    ...el,
    id: newElementId(),
    x: Math.min(el.x + 16, CANVAS_W - 40),
    y: Math.min(el.y + 16, CANVAS_H - 40),
    carouselItems: el.carouselItems?.map((item) => ({
      ...item,
      id: newElementId(),
    })),
  }
}

export function createLayoutElement(type: LayoutElementType, at?: { x?: number; y?: number }): LayoutElement {
  const defaults = DEFAULTS_BY_TYPE[type]
  const size = DEFAULT_SIZE[type]
  const base: LayoutElement = {
    id: newElementId(),
    type,
    x: at?.x ?? 24,
    y: at?.y ?? 120,
    width: size.width,
    height: size.height,
    ...defaults,
  }
  if (type === 'carousel') {
    base.carouselItems = defaultCarouselItems(3)
  }
  if (type === 'text') base.content = 'Text label'
  if (type === 'icon') base.content = '★'
  return base
}

export function createLanguageSwitchElement(at?: { x?: number; y?: number }): LayoutElement {
  const size = DEFAULT_SIZE.language_switch
  return {
    id: newElementId(),
    type: 'language_switch',
    x: at?.x ?? Math.round((CANVAS_W - size.width) / 2),
    y: at?.y ?? Math.round((CANVAS_H - size.height) / 2),
    width: size.width,
    height: size.height,
    ...DEFAULT_LANGUAGE_SWITCH_STYLE,
  }
}

export function layoutHasLanguageSwitch(elements: LayoutElement[] | undefined): boolean {
  return (elements ?? []).some((el) => el.type === 'language_switch')
}

function parseAction(raw: unknown): ElementAction {
  if (!raw || typeof raw !== 'object') return { type: 'none' }
  const a = raw as ElementAction
  const type = a.type
  const recordOption =
    typeof a.recordOption === 'string' && a.recordOption.trim() ? a.recordOption.trim() : undefined
  if (type === 'navigate' || type === 'next' || type === 'previous' || type === 'back') {
    return {
      type,
      target: a.target === 'intro' || a.target === 'next' || a.target === 'previous'
        ? a.target
        : typeof a.target === 'number'
          ? a.target
          : undefined,
      recordOption,
    }
  }
  return { type: 'none' }
}

export function actionRecordsAnswer(action: ElementAction | undefined): string | undefined {
  if (!action || action.type === 'none') return undefined
  const key = action.recordOption?.trim()
  return key || undefined
}

export function normalizeElements(raw: unknown): LayoutElement[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e): e is LayoutElement => Boolean(e && typeof e === 'object' && 'id' in e && 'type' in e))
    .map((e) => {
      const type = (VALID_TYPES.includes(e.type as LayoutElementType)
        ? e.type
        : 'text') as LayoutElementType
      const defaults = DEFAULTS_BY_TYPE[type]
      const size = DEFAULT_SIZE[type]
      return {
        id: String(e.id),
        type,
        content: e.content ?? defaults.content,
        placeholder: e.placeholder ?? defaults.placeholder,
        src: e.src,
        x: Number(e.x) || 0,
        y: Number(e.y) || 0,
        width: Number(e.width) || size.width,
        height: Number(e.height) || size.height,
        fontSize: e.fontSize != null ? Number(e.fontSize) : defaults.fontSize,
        zIndex: e.zIndex != null ? Number(e.zIndex) : defaults.zIndex,
        backgroundColor:
          typeof e.backgroundColor === 'string' ? e.backgroundColor : defaults.backgroundColor,
        color: typeof e.color === 'string' ? e.color : defaults.color,
        borderRadius: e.borderRadius != null ? Number(e.borderRadius) : defaults.borderRadius,
        borderWidth: e.borderWidth != null ? Number(e.borderWidth) : defaults.borderWidth,
        borderColor: typeof e.borderColor === 'string' ? e.borderColor : defaults.borderColor,
        opacity: e.opacity != null ? Number(e.opacity) : defaults.opacity,
        padding: e.padding != null ? Number(e.padding) : defaults.padding,
        fontWeight: e.fontWeight != null ? e.fontWeight : defaults.fontWeight,
        textAlign:
          e.textAlign === 'left' || e.textAlign === 'right' || e.textAlign === 'center'
            ? e.textAlign
            : defaults.textAlign,
        objectFit:
          e.objectFit === 'cover' || e.objectFit === 'fill' || e.objectFit === 'contain'
            ? e.objectFit
            : defaults.objectFit,
        rotation: e.rotation != null ? Number(e.rotation) : 0,
        shapeVariant:
          e.shapeVariant === 'circle' || e.shapeVariant === 'rectangle'
            ? e.shapeVariant
            : defaults.shapeVariant,
        carouselItems: Array.isArray(e.carouselItems)
          ? e.carouselItems.map((item: CarouselItem, idx: number) =>
              normalizeCarouselItem(item, `Slide ${idx + 1}`)
            )
          : defaults.carouselItems,
        carouselSlideWidth:
          e.carouselSlideWidth != null
            ? Math.min(100, Math.max(40, Number(e.carouselSlideWidth)))
            : defaults.carouselSlideWidth,
        action: parseAction(e.action),
        isOption: Boolean(e.isOption),
        optionKey: typeof e.optionKey === 'string' ? e.optionKey : undefined,
        optionActiveColor:
          typeof e.optionActiveColor === 'string' ? e.optionActiveColor : undefined,
        optionInactiveColor:
          typeof e.optionInactiveColor === 'string' ? e.optionInactiveColor : undefined,
      } satisfies LayoutElement
    })
}

const VALID_TYPES: LayoutElementType[] = [
  'text',
  'textbox',
  'image',
  'button',
  'carousel',
  'shape',
  'divider',
  'icon',
  'language_switch',
]

export const LAYOUT_ELEMENT_DRAG_MIME = 'application/x-tap-layout-element'

export function setLayoutElementDragData(dataTransfer: DataTransfer, type: LayoutElementType): void {
  dataTransfer.setData(LAYOUT_ELEMENT_DRAG_MIME, type)
  dataTransfer.setData('text/plain', type)
  dataTransfer.effectAllowed = 'copy'
}

/** Use during dragover/dragenter — getData() is empty until drop in most browsers. */
export function isLayoutElementDrag(dataTransfer: DataTransfer): boolean {
  const types = Array.from(dataTransfer.types)
  return (
    types.includes(LAYOUT_ELEMENT_DRAG_MIME) ||
    types.some((t) => t.toLowerCase() === LAYOUT_ELEMENT_DRAG_MIME.toLowerCase()) ||
    types.includes('text/plain')
  )
}

export function parseLayoutElementDrag(dataTransfer: DataTransfer): LayoutElementType | null {
  const raw = dataTransfer.getData(LAYOUT_ELEMENT_DRAG_MIME) || dataTransfer.getData('text/plain')
  if (VALID_TYPES.includes(raw as LayoutElementType)) return raw as LayoutElementType
  return null
}

export function canvasCoordsFromClient(
  clientX: number,
  clientY: number,
  canvasEl: HTMLElement
): { x: number; y: number } {
  const rect = canvasEl.getBoundingClientRect()
  const scale = rect.width / CANVAS_W
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  }
}

export function clampElementPosition(el: LayoutElement, x: number, y: number): { x: number; y: number } {
  return {
    x: Math.round(Math.max(0, Math.min(CANVAS_W - el.width, x - el.width / 2))),
    y: Math.round(Math.max(0, Math.min(CANVAS_H - el.height, y - el.height / 2))),
  }
}

export function defaultLayoutElementOptionKey(el: LayoutElement): string {
  return `option_${el.id.replace(/[^a-zA-Z0-9_]/g, '_')}`
}

export function isNavigationOnlyButton(el: LayoutElement): boolean {
  if (el.type !== 'button') return false
  if (el.isOption) return false
  if (el.optionKey?.trim() || el.action?.recordOption?.trim()) return false
  const actionType = el.action?.type ?? 'none'
  if (actionType === 'next' || actionType === 'previous' || actionType === 'back') return true
  const label = (el.content || el.placeholder || '').trim().toLowerCase()
  if (
    (actionType === 'none' || actionType === 'navigate') &&
    (label === 'next' || label === 'back' || label === 'continue' || label === 'confirm')
  ) {
    return true
  }
  return false
}

/** Layout buttons that represent an answer the learner can pick. */
export function isLayoutAnswerChoice(el: LayoutElement): boolean {
  if (el.isOption) return true
  if (el.type !== 'button') return false
  if (isNavigationOnlyButton(el)) return false
  return Boolean((el.content || el.placeholder || '').trim())
}

/** Stable key for each answer control (explicit optionKey/recordOption, else derived from element id). */
export function layoutElementOptionKey(el: LayoutElement): string {
  if (!isLayoutAnswerChoice(el)) return ''
  const explicit = el.optionKey?.trim() || el.action?.recordOption?.trim()
  if (explicit) return explicit
  return defaultLayoutElementOptionKey(el)
}

/** Assign one unique option key per answer button; clear keys on navigation controls. */
export function normalizeLayoutAnswerKeys(elements: LayoutElement[]): LayoutElement[] {
  return elements.map((el) => {
    if (!isLayoutAnswerChoice(el)) {
      if (!el.optionKey && !el.action?.recordOption) return el
      const action =
        el.action && el.action.recordOption
          ? { ...el.action, recordOption: undefined }
          : el.action
      return { ...el, optionKey: undefined, action }
    }
    const key = defaultLayoutElementOptionKey(el)
    return {
      ...el,
      optionKey: key,
      action: {
        ...(el.action || { type: 'none' }),
        recordOption: key,
      },
    }
  })
}

export function getLayoutElements(layout: Record<string, unknown> | undefined): LayoutElement[] {
  return normalizeLayoutAnswerKeys(normalizeElements(layout?.elements))
}

export function isIntroConfigured(intro?: IntroLayout | null): boolean {
  if (!intro) return false
  if (getLayoutElements(intro.elements).length > 0) return true
  return Boolean(intro.heading?.trim() || intro.subtitle?.trim() || intro.startButton?.trim())
}

export function isForwardNavigationAction(action: ElementAction | undefined): boolean {
  if (!action || action.type === 'none') return false
  if (action.type === 'next') return true
  if (action.type === 'navigate' && action.target === 'next') return true
  return false
}

export function resolveActionNavigation(
  action: ElementAction | undefined,
  currentTarget: PreviewTarget,
  questionIds: number[]
): PreviewTarget | null {
  if (!action || action.type === 'none') return null
  if (action.type === 'back' || action.type === 'previous') {
    if (currentTarget === 'intro') return null
    const idx = questionIds.indexOf(currentTarget as number)
    if (idx <= 0) return 'intro'
    return questionIds[idx - 1] ?? 'intro'
  }
  if (action.type === 'next') {
    if (currentTarget === 'intro') return questionIds[0] ?? null
    const idx = questionIds.indexOf(currentTarget as number)
    if (idx < 0) return questionIds[0] ?? null
    return questionIds[idx + 1] ?? null
  }
  if (action.type === 'navigate' && action.target !== undefined) {
    if (action.target === 'next') return resolveActionNavigation({ type: 'next' }, currentTarget, questionIds)
    if (action.target === 'previous')
      return resolveActionNavigation({ type: 'previous' }, currentTarget, questionIds)
    if (action.target === 'intro') return 'intro'
    if (typeof action.target === 'number' && questionIds.includes(action.target)) return action.target
  }
  return null
}

export function supportsActions(type: LayoutElementType): boolean {
  return INTERACTIVE_ELEMENT_TYPES.includes(type)
}
