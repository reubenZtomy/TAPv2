import React from 'react'
import {
  CANVAS_H,
  CANVAS_W,
  type LayoutElement,
  type ScreenOption,
  type TextAlign,
} from '../layoutTypes'
import {
  borderColorField,
  ElementActionFields,
  elementContentSummary,
  numInput,
  sliderWithNumber,
  toHexColor,
  type QuestionOptionChoice,
} from './elementEditorFields'
import { ScreenBackgroundFields } from './ScreenBackgroundFields'
import { QuizFontFields } from './QuizFontFields'
import { supportsActions, type ScreenBackgroundSettings } from '../layoutTypes'
import type { QuizBuilderPayload } from '../builderTypes'
import type { QuizCustomFont } from '../../utils/quizFont'

export { layoutElementStyle } from '../../layout/layoutElementStyle'

type LayoutElementInspectorProps = {
  element: LayoutElement | null
  screens: ScreenOption[]
  questionOptions?: QuestionOptionChoice[]
  screenBackground?: ScreenBackgroundSettings
  onScreenBackgroundChange?: (settings: ScreenBackgroundSettings) => void
  quizId?: number
  customFont?: QuizCustomFont | null
  onQuizFontUpdated?: (quiz: QuizBuilderPayload) => void
  onUpdate: (patch: Partial<LayoutElement>) => void
  onDuplicate?: () => void
  onRemove: () => void
  onOpenContentEditor?: () => void
  onOpenCarouselEditor?: () => void
}

export function LayoutElementInspector({
  element,
  screens,
  questionOptions = [],
  screenBackground,
  onScreenBackgroundChange,
  quizId,
  customFont,
  onQuizFontUpdated,
  onUpdate,
  onDuplicate,
  onRemove,
  onOpenContentEditor,
  onOpenCarouselEditor,
}: LayoutElementInspectorProps) {
  if (!element) {
    return (
      <aside className="admin-layout-inspector">
        <div className="admin-layout-inspector-tabs">
          <span className="admin-layout-inspector-tab is-active">Screen</span>
        </div>
        <div className="admin-layout-inspector-body">
          <p className="admin-muted admin-inspector-note" style={{ marginTop: 0 }}>
            No element selected. Click the phone background or add a component from the panel.
          </p>
          {onScreenBackgroundChange && screenBackground ? (
            <ScreenBackgroundFields settings={screenBackground} onChange={onScreenBackgroundChange} />
          ) : null}
          {quizId != null && onQuizFontUpdated ? (
            <QuizFontFields
              quizId={quizId}
              customFont={customFont}
              onUpdated={onQuizFontUpdated}
            />
          ) : null}
        </div>
      </aside>
    )
  }

  const hasTypography = ['text', 'textbox', 'button', 'icon', 'language_switch'].includes(element.type)

  return (
    <aside className="admin-layout-inspector">
      <div className="admin-layout-inspector-tabs">
        <span className="admin-layout-inspector-tab is-active">Layout</span>
        <span className="admin-layout-inspector-type">{element.type}</span>
      </div>

      <div className="admin-inspector-top-actions">
        {onDuplicate ? (
          <button type="button" className="admin-btn admin-btn--small admin-btn--primary" onClick={onDuplicate}>
            Duplicate
          </button>
        ) : null}
        <button type="button" className="admin-btn admin-btn--small admin-btn--danger" onClick={onRemove}>
          Delete element
        </button>
      </div>
      {supportsActions(element.type) ? (
        <div className="admin-inspector-top-toggle-row">
          <div>
            <span className="admin-inspector-label">Option element</span>
            {element.isOption ? (
              <div className="admin-inspector-note" style={{ marginTop: 6, marginBottom: 0 }}>
                Design only: tag visible in builder, hidden in live quiz.
              </div>
            ) : null}
          </div>
          <div className="admin-table-active-cell">
              <button
                type="button"
                role="switch"
                aria-checked={element.isOption ? 'true' : 'false'}
                className={`admin-toggle ${element.isOption ? 'is-on' : ''}`}
                onClick={() => onUpdate({ isOption: !element.isOption })}
                title={element.isOption ? 'Classified as option' : 'Not classified as option'}
              />
              <span className={`admin-toggle-label ${element.isOption ? 'is-on' : 'is-off'}`}>
                {element.isOption ? 'On' : 'Off'}
              </span>
          </div>
        </div>
      ) : null}
      {supportsActions(element.type) && element.isOption ? (
        <div className="admin-inspector-top-toggle-row" style={{ borderTop: 'none' }}>
          <div style={{ width: '100%' }}>
            <label className="admin-inspector-field" style={{ marginBottom: 10 }}>
              <span className="admin-inspector-label">On active / selected color</span>
              <div className="admin-inspector-color-row">
                <input
                  type="color"
                  className="admin-inspector-color"
                  value={toHexColor(element.optionActiveColor, '#2563eb')}
                  onChange={(e) => onUpdate({ optionActiveColor: e.target.value })}
                />
                <input
                  className="admin-input admin-inspector-input"
                  value={element.optionActiveColor || ''}
                  onChange={(e) => onUpdate({ optionActiveColor: e.target.value })}
                />
              </div>
            </label>
            <label className="admin-inspector-field" style={{ marginBottom: 0 }}>
              <span className="admin-inspector-label">On inactive / default color</span>
              <div className="admin-inspector-color-row">
                <input
                  type="color"
                  className="admin-inspector-color"
                  value={toHexColor(element.optionInactiveColor, '#ffffff')}
                  onChange={(e) => onUpdate({ optionInactiveColor: e.target.value })}
                />
                <input
                  className="admin-input admin-inspector-input"
                  value={element.optionInactiveColor || ''}
                  onChange={(e) => onUpdate({ optionInactiveColor: e.target.value })}
                />
              </div>
            </label>
          </div>
        </div>
      ) : null}

      <div className="admin-layout-inspector-body">
        <section className="admin-inspector-section">
          <h4 className="admin-inspector-heading">Content</h4>
          <p className="admin-inspector-content-summary">{elementContentSummary(element)}</p>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            style={{ width: '100%' }}
            onClick={element.type === 'carousel' ? onOpenCarouselEditor : onOpenContentEditor}
          >
            {element.type === 'carousel' ? 'Edit slides' : 'Edit content'}
          </button>
        </section>

        <section className="admin-inspector-section">
          <h4 className="admin-inspector-heading">Position &amp; size</h4>
          <p className="admin-muted admin-inspector-note">Drag on the phone or use handles to resize.</p>
          <div className="admin-inspector-grid">
            {numInput('X', element.x, (x) => onUpdate({ x }), { min: 0, max: CANVAS_W })}
            {numInput('Y', element.y, (y) => onUpdate({ y }), { min: 0, max: CANVAS_H })}
            {numInput('Width', element.width, (width) => onUpdate({ width }), {
              min: element.type === 'divider' ? 20 : 20,
              max: CANVAS_W,
            })}
            {numInput('Height', element.height, (height) => onUpdate({ height }), {
              min: element.type === 'carousel' ? 48 : 4,
              max: CANVAS_H,
            })}
          </div>
          {element.type === 'carousel'
            ? sliderWithNumber(
                'Slide width',
                element.carouselSlideWidth ?? 88,
                (carouselSlideWidth) => onUpdate({ carouselSlideWidth }),
                { min: 50, max: 100 }
              )
            : null}
          {numInput('Layer', element.zIndex ?? 10, (zIndex) => onUpdate({ zIndex }), { min: 0, max: 99 })}
          {numInput('Rotation °', element.rotation ?? 0, (rotation) => onUpdate({ rotation }), {
            min: -180,
            max: 180,
          })}
        </section>

        <section className="admin-inspector-section">
          <h4 className="admin-inspector-heading">Appearance</h4>
          <label className="admin-inspector-field">
            <span className="admin-inspector-label">Background</span>
            <div className="admin-inspector-color-row">
              <input
                type="color"
                className="admin-inspector-color"
                value={toHexColor(element.backgroundColor, '#ffffff')}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              />
              <input
                className="admin-input admin-inspector-input"
                value={element.backgroundColor || ''}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--small"
              style={{ marginTop: 6 }}
              onClick={() => onUpdate({ backgroundColor: 'transparent' })}
            >
              Clear background
            </button>
          </label>
          {hasTypography ? (
            <label className="admin-inspector-field">
              <span className="admin-inspector-label">Text color</span>
              <div className="admin-inspector-color-row">
                <input
                  type="color"
                  className="admin-inspector-color"
                  value={toHexColor(element.color, '#152840')}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                />
                <input
                  className="admin-input admin-inspector-input"
                  value={element.color || ''}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                />
              </div>
            </label>
          ) : null}
          {sliderWithNumber(
            'Opacity',
            Math.round((element.opacity ?? 1) * 100),
            (pct) => onUpdate({ opacity: pct / 100 }),
            { min: 0, max: 100 }
          )}
          <div className="admin-inspector-grid">
            {numInput('Radius', element.borderRadius ?? 0, (borderRadius) => onUpdate({ borderRadius }))}
            {numInput('Padding', element.padding ?? 0, (padding) => onUpdate({ padding }), { max: 80 })}
            {element.type !== 'button' && element.type !== 'textbox' && element.type !== 'image'
              ? numInput('Border', element.borderWidth ?? 0, (borderWidth) => onUpdate({ borderWidth }))
              : null}
          </div>
          {element.type === 'button' || element.type === 'textbox' || element.type === 'image' ? (
            <>
              {numInput(
                'Border width',
                element.borderWidth ?? 0,
                (borderWidth) => onUpdate({ borderWidth }),
                { min: 0, max: 24 }
              )}
              {borderColorField(
                element,
                onUpdate,
                element.type === 'button' ? '#1d4ed8' : element.type === 'image' ? '#cbd5e1' : '#4d688c'
              )}
            </>
          ) : null}
        </section>

        {hasTypography ? (
          <section className="admin-inspector-section">
            <h4 className="admin-inspector-heading">Typography</h4>
            {numInput('Font size', element.fontSize ?? 20, (fontSize) => onUpdate({ fontSize }), {
              min: 8,
              max: 120,
            })}
            <label className="admin-inspector-field">
              <span className="admin-inspector-label">Weight</span>
              <select
                className="admin-select admin-inspector-input"
                value={String(element.fontWeight ?? 700)}
                onChange={(e) => {
                  const v = e.target.value
                  onUpdate({
                    fontWeight: v === 'normal' || v === 'bold' ? v : Number(v),
                  })
                }}
              >
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="700">Bold (700)</option>
                <option value="900">Heavy (900)</option>
              </select>
            </label>
            <label className="admin-inspector-field">
              <span className="admin-inspector-label">Align</span>
              <div className="admin-inspector-align-btns">
                {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
                  <button
                    key={align}
                    type="button"
                    className={`admin-btn admin-btn--small ${
                      (element.textAlign || 'center') === align ? 'admin-btn--active' : ''
                    }`}
                    onClick={() => onUpdate({ textAlign: align })}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </label>
          </section>
        ) : null}

        {supportsActions(element.type) ? (
          <section className="admin-inspector-section">
            <h4 className="admin-inspector-heading">Tap &amp; navigation</h4>
            <ElementActionFields
              element={element}
              onChange={onUpdate}
              screens={screens}
              questionOptions={questionOptions}
            />
          </section>
        ) : null}
      </div>
    </aside>
  )
}
