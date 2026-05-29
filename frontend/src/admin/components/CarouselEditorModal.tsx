import React, { useEffect, useMemo, useState } from 'react'
import { uploadQuizAsset } from '../api'
import { type CarouselItem, defaultCarouselItems, newElementId, normalizeCarouselItem } from '../layoutTypes'

type CarouselEditorModalProps = {
  open: boolean
  onClose: () => void
  items: CarouselItem[]
  onSave: (items: CarouselItem[]) => void
}

function cloneSlides(items: CarouselItem[]): CarouselItem[] {
  return items.map((item, idx) => normalizeCarouselItem(item, `Slide ${idx + 1}`))
}

export function CarouselEditorModal({ open, onClose, items, onSave }: CarouselEditorModalProps) {
  const [slides, setSlides] = useState<CarouselItem[]>(() => cloneSlides(items))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [bulkTitle, setBulkTitle] = useState('')
  const [bulkBody, setBulkBody] = useState('')
  const [bulkImageUrl, setBulkImageUrl] = useState('')

  useEffect(() => {
    if (!open) return
    const cloned = cloneSlides(items.length ? items : defaultCarouselItems(3))
    setSlides(cloned)
    setActiveId(cloned[0]?.id ?? null)
    setBulkTitle('')
    setBulkBody('')
    setBulkImageUrl('')
  }, [open, items])

  const activeSlide = useMemo(
    () => slides.find((s) => s.id === activeId) ?? slides[0] ?? null,
    [slides, activeId]
  )

  const updateSlide = (id: string, patch: Partial<CarouselItem>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const applyToAll = (patch: Partial<CarouselItem>) => {
    setSlides((prev) => prev.map((s) => ({ ...s, ...patch })))
  }

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true)
    try {
      const { url } = await uploadQuizAsset(file)
      return url
    } finally {
      setUploading(false)
    }
  }

  const handleSlideImage = async (file: File) => {
    if (!activeSlide) return
    const url = await uploadImage(file)
    updateSlide(activeSlide.id, { imageUrl: url })
  }

  const handleBulkImageFile = async (file: File) => {
    const url = await uploadImage(file)
    setBulkImageUrl(url)
  }

  const addSlide = () => {
    const slide = normalizeCarouselItem({ label: `Slide ${slides.length + 1}` }, `Slide ${slides.length + 1}`)
    setSlides((prev) => [...prev, slide])
    setActiveId(slide.id)
  }

  const removeSlide = (id: string) => {
    if (slides.length <= 1) return
    const next = slides.filter((s) => s.id !== id)
    setSlides(next)
    if (activeId === id) setActiveId(next[0]?.id ?? null)
  }

  const handleDone = () => {
    onSave(slides)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="admin-modal-overlay admin-carousel-editor-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="carousel-editor-title"
      onClick={onClose}
    >
      <div className="admin-carousel-editor" onClick={(e) => e.stopPropagation()}>
        <header className="admin-carousel-editor-header">
          <div>
            <h2 id="carousel-editor-title" className="admin-section-title">
              Carousel editor
            </h2>
            <p className="admin-muted">Add images and text per slide, or apply to all slides at once.</p>
          </div>
          <div className="admin-carousel-editor-header-actions">
            <button type="button" className="admin-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={handleDone}>
              Done — insert on screen
            </button>
          </div>
        </header>

        <section className="admin-carousel-bulk">
          <h3 className="admin-section-subtitle">Apply to all slides</h3>
          <div className="admin-carousel-bulk-grid">
            <div className="admin-carousel-bulk-block">
              <span className="admin-inspector-label">Image</span>
              <label className="admin-btn admin-btn--small admin-btn--file">
                {uploading ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  hidden
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleBulkImageFile(f)
                    e.target.value = ''
                  }}
                />
              </label>
              <input
                className="admin-input"
                placeholder="Or paste image URL"
                value={bulkImageUrl}
                onChange={(e) => setBulkImageUrl(e.target.value)}
              />
              <button
                type="button"
                className="admin-btn admin-btn--small"
                disabled={!bulkImageUrl.trim()}
                onClick={() => applyToAll({ imageUrl: bulkImageUrl.trim() })}
              >
                Apply image to all
              </button>
            </div>
            <div className="admin-carousel-bulk-block">
              <span className="admin-inspector-label">Title text</span>
              <input
                className="admin-input"
                placeholder="Same title on every slide"
                value={bulkTitle}
                onChange={(e) => setBulkTitle(e.target.value)}
              />
              <button
                type="button"
                className="admin-btn admin-btn--small"
                onClick={() => applyToAll({ title: bulkTitle })}
              >
                Apply title to all
              </button>
            </div>
            <div className="admin-carousel-bulk-block">
              <span className="admin-inspector-label">Body text</span>
              <textarea
                className="admin-input admin-textarea"
                rows={2}
                placeholder="Same body on every slide"
                value={bulkBody}
                onChange={(e) => setBulkBody(e.target.value)}
              />
              <button
                type="button"
                className="admin-btn admin-btn--small"
                onClick={() => applyToAll({ body: bulkBody })}
              >
                Apply body to all
              </button>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--small admin-btn--primary"
            onClick={() =>
              applyToAll({
                imageUrl: bulkImageUrl.trim() || undefined,
                title: bulkTitle,
                body: bulkBody,
              })
            }
          >
            Apply image + title + body to all
          </button>
        </section>

        <div className="admin-carousel-editor-body">
          <aside className="admin-carousel-slide-list">
            <div className="admin-carousel-slide-list-head">
              <h3 className="admin-section-subtitle">Slides ({slides.length})</h3>
              <button type="button" className="admin-btn admin-btn--small" onClick={addSlide}>
                + Add
              </button>
            </div>
            <ul>
              {slides.map((slide, idx) => (
                <li key={slide.id}>
                  <button
                    type="button"
                    className={`admin-carousel-slide-pick ${activeId === slide.id ? 'is-active' : ''}`}
                    onClick={() => setActiveId(slide.id)}
                  >
                    <span className="admin-carousel-slide-pick-thumb">
                      {slide.imageUrl ? (
                        <img src={slide.imageUrl} alt="" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </span>
                    <span className="admin-carousel-slide-pick-meta">
                      <strong>{slide.label || `Slide ${idx + 1}`}</strong>
                      <span className="admin-muted">
                        {[slide.title, slide.body].filter(Boolean).join(' · ') || 'Empty'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {activeSlide ? (
            <div className="admin-carousel-slide-edit">
              <div className="admin-carousel-slide-edit-form">
                <h3 className="admin-section-subtitle">Edit slide</h3>
                <label className="admin-inspector-field">
                  <span className="admin-inspector-label">Slide name (editor only)</span>
                  <input
                    className="admin-input"
                    value={activeSlide.label}
                    onChange={(e) => updateSlide(activeSlide.id, { label: e.target.value })}
                  />
                </label>

                <div className="admin-carousel-field-group">
                  <span className="admin-inspector-label">Image</span>
                  <label className="admin-btn admin-btn--small admin-btn--file">
                    {uploading ? 'Uploading…' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      hidden
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void handleSlideImage(f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <input
                    className="admin-input"
                    placeholder="Image URL"
                    value={activeSlide.imageUrl || ''}
                    onChange={(e) => updateSlide(activeSlide.id, { imageUrl: e.target.value })}
                  />
                  {activeSlide.imageUrl ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--small"
                      onClick={() => updateSlide(activeSlide.id, { imageUrl: undefined })}
                    >
                      Remove image
                    </button>
                  ) : null}
                </div>

                <label className="admin-inspector-field">
                  <span className="admin-inspector-label">Title text</span>
                  <input
                    className="admin-input"
                    placeholder="Heading on this slide"
                    value={activeSlide.title || ''}
                    onChange={(e) => updateSlide(activeSlide.id, { title: e.target.value })}
                  />
                </label>

                <label className="admin-inspector-field">
                  <span className="admin-inspector-label">Body text</span>
                  <textarea
                    className="admin-input admin-textarea"
                    rows={3}
                    placeholder="Description or label under the image"
                    value={activeSlide.body || ''}
                    onChange={(e) => updateSlide(activeSlide.id, { body: e.target.value })}
                  />
                </label>

                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--small"
                  disabled={slides.length <= 1}
                  onClick={() => removeSlide(activeSlide.id)}
                >
                  Delete this slide
                </button>
              </div>

              <div className="admin-carousel-slide-preview-wrap">
                <p className="admin-inspector-label">Preview</p>
                <CarouselSlidePreviewCard slide={activeSlide} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function CarouselSlidePreviewCard({ slide }: { slide: CarouselItem }) {
  const hasImage = Boolean(slide.imageUrl)
  const hasText = Boolean(slide.title?.trim() || slide.body?.trim())

  return (
    <div className={`admin-carousel-preview-card ${hasImage && hasText ? 'has-both' : ''}`}>
      {hasImage ? (
        <div className="admin-carousel-preview-card-media">
          <img src={slide.imageUrl} alt="" draggable={false} />
        </div>
      ) : null}
      {hasText ? (
        <div className="admin-carousel-preview-card-text">
          {slide.title?.trim() ? <div className="admin-carousel-preview-title">{slide.title}</div> : null}
          {slide.body?.trim() ? <div className="admin-carousel-preview-body">{slide.body}</div> : null}
        </div>
      ) : !hasImage ? (
        <div className="admin-carousel-preview-card-empty admin-muted">{slide.label}</div>
      ) : null}
    </div>
  )
}
