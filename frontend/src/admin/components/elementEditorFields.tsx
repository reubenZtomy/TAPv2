import React from 'react'
import {
  type ElementAction,
  type ElementActionType,
  type LayoutElement,
  type NavigateTarget,
  type ObjectFit,
  type ScreenOption,
  type ShapeVariant,
  type TextAlign,
  supportsActions,
} from '../layoutTypes'

function clampRounded(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Range slider with a typed number field (for %, °, etc.). */
export function sliderWithNumber(
  label: string,
  value: number,
  onChange: (v: number) => void,
  opts?: { min?: number; max?: number; unit?: string }
) {
  const min = opts?.min ?? 0
  const max = opts?.max ?? 100
  const unit = opts?.unit ?? '%'
  const set = (raw: number) => onChange(clampRounded(raw, min, max))

  return (
    <label className="admin-inspector-field">
      <span className="admin-inspector-label">{label}</span>
      <div className="admin-inspector-slider-row">
        <input
          type="range"
          className="admin-inspector-range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
        />
        <input
          type="number"
          className="admin-input admin-inspector-input admin-inspector-num-inline"
          min={min}
          max={max}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
        />
        {unit ? <span className="admin-inspector-value-unit">{unit}</span> : null}
      </div>
    </label>
  )
}

export function numInput(
  label: string,
  value: number,
  onChange: (v: number) => void,
  opts?: { min?: number; max?: number; step?: number }
) {
  return (
    <label className="admin-inspector-field">
      <span className="admin-inspector-label">{label}</span>
      <input
        type="number"
        className="admin-input admin-inspector-input"
        value={value}
        min={opts?.min}
        max={opts?.max}
        step={opts?.step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function toHexColor(value: string | undefined, fallback: string): string {
  if (!value || value === 'transparent') return fallback
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) return value
  return fallback
}

const BORDER_STYLE_TYPES = new Set(['button', 'textbox', 'image'])

export function elementSupportsBorderColor(type: LayoutElement['type']): boolean {
  return BORDER_STYLE_TYPES.has(type)
}

export function borderColorField(
  element: LayoutElement,
  onChange: (patch: Partial<LayoutElement>) => void,
  fallback = '#152840'
) {
  if (!elementSupportsBorderColor(element.type)) return null

  return (
    <label className="admin-inspector-field">
      <span className="admin-inspector-label">Border color</span>
      <div className="admin-inspector-color-row">
        <input
          type="color"
          className="admin-inspector-color"
          value={toHexColor(element.borderColor, fallback)}
          onChange={(e) => onChange({ borderColor: e.target.value })}
        />
        <input
          className="admin-input admin-inspector-input"
          value={element.borderColor || ''}
          onChange={(e) => onChange({ borderColor: e.target.value })}
          placeholder="#hex"
        />
      </div>
      {(element.borderWidth ?? 0) === 0 ? (
        <p className="admin-muted admin-inspector-note" style={{ marginTop: 6, fontSize: 15 }}>
          Set Border width above 0 to show the outline.
        </p>
      ) : null}
    </label>
  )
}

export type QuestionOptionChoice = {
  key: string
  label: string
}

type FieldProps = {
  element: LayoutElement
  onChange: (patch: Partial<LayoutElement>) => void
  screens: ScreenOption[]
  questionOptions?: QuestionOptionChoice[]
  onUploadImage?: (file: File) => void
  uploading?: boolean
}

export function ElementContentFields({
  element,
  onChange,
  onUploadImage,
  uploading = false,
}: FieldProps) {
  const hasText = ['text', 'textbox', 'button', 'icon'].includes(element.type)

  return (
    <>
      {hasText ? (
        <label className="admin-inspector-field">
          <span className="admin-inspector-label">
            {element.type === 'textbox' ? 'Default value' : 'Text'}
          </span>
          <textarea
            className="admin-input admin-textarea admin-inspector-textarea"
            rows={element.type === 'button' ? 2 : 3}
            value={element.content || ''}
            onChange={(e) => onChange({ content: e.target.value })}
          />
        </label>
      ) : null}

      {element.type === 'textbox' ? (
        <label className="admin-inspector-field">
          <span className="admin-inspector-label">Placeholder</span>
          <input
            className="admin-input admin-inspector-input"
            value={element.placeholder || ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
        </label>
      ) : null}

      {element.type === 'image' ? (
        <>
          <label className="admin-inspector-field">
            <span className="admin-inspector-label">Image URL</span>
            <input
              className="admin-input admin-inspector-input"
              value={element.src || ''}
              onChange={(e) => onChange({ src: e.target.value })}
            />
          </label>
          {onUploadImage ? (
            <label className="admin-btn admin-btn--small admin-btn--file admin-inspector-upload">
              {uploading ? 'Uploading…' : 'Upload image'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                hidden
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onUploadImage(f)
                  e.target.value = ''
                }}
              />
            </label>
          ) : null}
          <label className="admin-inspector-field">
            <span className="admin-inspector-label">Image fit</span>
            <select
              className="admin-select admin-inspector-input"
              value={element.objectFit || 'contain'}
              onChange={(e) => onChange({ objectFit: e.target.value as ObjectFit })}
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="fill">Fill</option>
            </select>
          </label>
        </>
      ) : null}

      {element.type === 'shape' ? (
        <label className="admin-inspector-field">
          <span className="admin-inspector-label">Shape</span>
          <select
            className="admin-select admin-inspector-input"
            value={element.shapeVariant || 'rectangle'}
            onChange={(e) => onChange({ shapeVariant: e.target.value as ShapeVariant })}
          >
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
          </select>
        </label>
      ) : null}

      {element.type === 'divider' ? (
        <p className="admin-muted admin-inspector-note">
          Divider is a line element. Adjust thickness with height after placing on screen.
        </p>
      ) : null}
    </>
  )
}

export function ElementQuickStyleFields({ element, onChange }: FieldProps) {
  const hasTypography = ['text', 'textbox', 'button', 'icon'].includes(element.type)

  return (
    <>
      <label className="admin-inspector-field">
        <span className="admin-inspector-label">Background</span>
        <div className="admin-inspector-color-row">
          <input
            type="color"
            className="admin-inspector-color"
            value={toHexColor(element.backgroundColor, '#ffffff')}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
          />
          <input
            className="admin-input admin-inspector-input"
            value={element.backgroundColor || ''}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            placeholder="transparent or #hex"
          />
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--small"
          style={{ marginTop: 6 }}
          onClick={() => onChange({ backgroundColor: 'transparent' })}
        >
          Clear background
        </button>
      </label>

      {hasTypography ? (
        <>
          <label className="admin-inspector-field">
            <span className="admin-inspector-label">Text color</span>
            <div className="admin-inspector-color-row">
              <input
                type="color"
                className="admin-inspector-color"
                value={toHexColor(element.color, '#152840')}
                onChange={(e) => onChange({ color: e.target.value })}
              />
              <input
                className="admin-input admin-inspector-input"
                value={element.color || ''}
                onChange={(e) => onChange({ color: e.target.value })}
              />
            </div>
          </label>
          {numInput('Font size', element.fontSize ?? 20, (fontSize) => onChange({ fontSize }), {
            min: 8,
            max: 120,
          })}
          <label className="admin-inspector-field">
            <span className="admin-inspector-label">Text align</span>
            <div className="admin-inspector-align-btns">
              {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
                <button
                  key={align}
                  type="button"
                  className={`admin-btn admin-btn--small ${
                    (element.textAlign || 'center') === align ? 'admin-btn--active' : ''
                  }`}
                  onClick={() => onChange({ textAlign: align })}
                >
                  {align}
                </button>
              ))}
            </div>
          </label>
        </>
      ) : null}

      {sliderWithNumber(
        'Opacity',
        Math.round((element.opacity ?? 1) * 100),
        (pct) => onChange({ opacity: pct / 100 }),
        { min: 0, max: 100 }
      )}

      {numInput('Corner radius', element.borderRadius ?? 0, (borderRadius) => onChange({ borderRadius }), {
        min: 0,
        max: 99,
      })}
      {element.type === 'button' || element.type === 'textbox' || element.type === 'image' ? (
        <>
          {numInput(
            'Border width',
            element.borderWidth ?? 0,
            (borderWidth) => onChange({ borderWidth }),
            { min: 0, max: 24 }
          )}
          {borderColorField(
            element,
            onChange,
            element.type === 'button' ? '#1d4ed8' : '#4d688c'
          )}
        </>
      ) : null}
    </>
  )
}

export function ElementActionFields({
  element,
  onChange,
  screens,
  questionOptions = [],
}: FieldProps) {
  if (!supportsActions(element.type)) return null

  const action = element.action ?? { type: 'none' as ElementActionType }
  const setAction = (patch: Partial<ElementAction>) => {
    onChange({ action: { ...action, ...patch } })
  }

  const navigateTargetValue = (): string => {
    if (action.type !== 'navigate' || action.target === undefined) return ''
    if (action.target === 'intro') return 'intro'
    if (action.target === 'next') return '__next__'
    if (action.target === 'previous') return '__previous__'
    return String(action.target)
  }

  return (
    <>
      <label className="admin-inspector-field">
        <span className="admin-inspector-label">On tap</span>
        <select
          className="admin-select admin-inspector-input"
          value={action.type}
          onChange={(e) => {
            const type = e.target.value as ElementActionType
            if (type === 'none') {
              setAction({ type, target: undefined, recordOption: undefined })
            } else if (type === 'navigate') {
              setAction({ type, target: screens[0]?.id ?? 'intro' })
            } else {
              setAction({ type, target: undefined })
            }
          }}
        >
          <option value="none">None</option>
          <option value="navigate">Navigate to screen…</option>
          <option value="next">Next screen</option>
          <option value="previous">Previous screen</option>
          <option value="back">Back (previous)</option>
        </select>
      </label>
      {action.type === 'navigate' ? (
        <label className="admin-inspector-field">
          <span className="admin-inspector-label">Destination</span>
          <select
            className="admin-select admin-inspector-input"
            value={navigateTargetValue()}
            onChange={(e) => {
              const v = e.target.value
              let target: NavigateTarget
              if (v === 'intro') target = 'intro'
              else if (v === '__next__') target = 'next'
              else if (v === '__previous__') target = 'previous'
              else target = Number(v)
              setAction({ type: 'navigate', target })
            }}
          >
            {screens.map((s) => (
              <option key={String(s.id)} value={s.id === 'intro' ? 'intro' : String(s.id)}>
                {s.label}
              </option>
            ))}
            <option value="__next__">Next in quiz order</option>
            <option value="__previous__">Previous in quiz order</option>
          </select>
        </label>
      ) : null}
      {action.type !== 'none' ? (
        <p className="admin-muted admin-inspector-note" style={{ marginTop: 0, fontSize: 15 }}>
          Answer choices on this screen get a unique key automatically (from the button&apos;s id).
          Result rules use the button label (e.g. $700, $720) in the dropdown.
        </p>
      ) : null}
    </>
  )
}

export function elementContentSummary(element: LayoutElement): string {
  switch (element.type) {
    case 'text':
    case 'button':
    case 'icon':
      return element.content?.trim() || '—'
    case 'textbox':
      return element.placeholder?.trim() || element.content?.trim() || '—'
    case 'image':
      return element.src ? 'Image set' : 'No image'
    case 'carousel':
      return `${element.carouselItems?.length ?? 0} slides`
    case 'shape':
      return element.shapeVariant || 'rectangle'
    case 'divider':
      return 'Divider line'
    default:
      return '—'
  }
}
