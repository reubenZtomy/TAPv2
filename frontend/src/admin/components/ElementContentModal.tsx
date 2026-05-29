import React, { useEffect, useState } from 'react'
import { ELEMENT_CATALOG } from '../elementCatalog'
import { uploadQuizAsset } from '../api'
import type { LayoutElement } from '../layoutTypes'
import { LayoutElementView } from './LayoutElementView'
import { layoutElementStyle } from './LayoutElementInspector'
import {
  ElementActionFields,
  ElementContentFields,
  ElementQuickStyleFields,
  type QuestionOptionChoice,
} from './elementEditorFields'
import type { ScreenOption } from '../layoutTypes'

type ElementContentModalProps = {
  open: boolean
  element: LayoutElement | null
  isNew: boolean
  screens: ScreenOption[]
  questionOptions?: QuestionOptionChoice[]
  onClose: () => void
  onSave: (element: LayoutElement) => void
  onOpenCarouselEditor?: () => void
}

export function ElementContentModal({
  open,
  element,
  isNew,
  screens,
  questionOptions = [],
  onClose,
  onSave,
  onOpenCarouselEditor,
}: ElementContentModalProps) {
  const [draft, setDraft] = useState<LayoutElement | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (open && element) {
      setDraft({ ...element })
    } else if (!open) {
      setDraft(null)
    }
  }, [open, element])

  if (!open || !draft) return null

  const catalog = ELEMENT_CATALOG.find((e) => e.type === draft.type)
  const title = isNew ? `Add ${catalog?.label ?? draft.type}` : `Edit ${catalog?.label ?? draft.type}`

  const patch = (p: Partial<LayoutElement>) => setDraft((d) => (d ? { ...d, ...p } : d))

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const { url } = await uploadQuizAsset(file)
      patch({ src: url })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="admin-modal-overlay admin-element-content-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="element-content-title"
      onClick={onClose}
    >
      <div className="admin-element-content-modal" onClick={(e) => e.stopPropagation()}>
        <header className="admin-element-content-header">
          <div>
            <h2 id="element-content-title" className="admin-section-title">
              {title}
            </h2>
            <p className="admin-muted">
              {isNew
                ? 'Set up content and quick styling first. Position and size are on the left panel after you add it.'
                : 'Update content here. Position, size, and layout stay in the editor panel.'}
            </p>
          </div>
          <div className="admin-element-content-header-actions">
            <button type="button" className="admin-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => onSave(draft)}
            >
              {isNew ? 'Add to screen' : 'Save'}
            </button>
          </div>
        </header>

        <div className="admin-element-content-body">
          <div className="admin-element-content-form">
            <section className="admin-inspector-section">
              <h3 className="admin-section-subtitle">Content</h3>
              {draft.type === 'carousel' ? (
                <>
                  <p className="admin-muted admin-inspector-note">
                    Carousels use a dedicated slide editor for images and text on each slide.
                  </p>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={onOpenCarouselEditor}
                  >
                    Open carousel slide editor
                  </button>
                  <p className="admin-muted" style={{ marginTop: 8 }}>
                    {(draft.carouselItems ?? []).length} slide(s) configured
                  </p>
                </>
              ) : (
                <ElementContentFields
                  element={draft}
                  onChange={patch}
                  screens={screens}
                  onUploadImage={handleUpload}
                  uploading={uploading}
                />
              )}
            </section>

            {draft.type !== 'carousel' ? (
              <>
                <section className="admin-inspector-section">
                  <h3 className="admin-section-subtitle">Quick style</h3>
                  <p className="admin-muted admin-inspector-note">
                    Same options are available in the layout panel after placing the element.
                  </p>
                  <ElementQuickStyleFields element={draft} onChange={patch} screens={screens} />
                </section>

                <section className="admin-inspector-section">
                  <h3 className="admin-section-subtitle">Tap action</h3>
                  <ElementActionFields
                    element={draft}
                    onChange={patch}
                    screens={screens}
                    questionOptions={questionOptions}
                  />
                </section>
              </>
            ) : null}
          </div>

          <div className="admin-element-content-preview-col">
            <p className="admin-inspector-label">Preview</p>
            <div
              className="admin-element-content-preview-box"
              style={{
                width: Math.min(draft.width, 280),
                height: Math.min(draft.height, 320),
              }}
            >
              <div
                className={`admin-layout-element admin-layout-element--${draft.type}`}
                style={{
                  ...layoutElementStyle(draft),
                  position: 'relative',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  ...(draft.type === 'shape' && draft.shapeVariant === 'circle'
                    ? { borderRadius: '50%' }
                    : {}),
                }}
              >
                <LayoutElementView element={draft} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
