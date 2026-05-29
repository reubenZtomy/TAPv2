import React, { useEffect, useMemo, useState } from 'react'
import { fetchLayoutPresets } from '../api'
import { searchPresets, type LayoutPreset } from '../layoutPresets'

type AddQuestionPresetModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (payload: {
    question_key: string
    preset_id: string
    layout_type: string
    layout: Record<string, unknown>
  }) => void
  suggestedKeys?: readonly string[]
}

export function AddQuestionPresetModal({
  open,
  onClose,
  onConfirm,
  suggestedKeys = [],
}: AddQuestionPresetModalProps) {
  const [presets, setPresets] = useState<LayoutPreset[]>([])
  const [loading, setLoading] = useState(false)
  const [questionKey, setQuestionKey] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    void fetchLayoutPresets()
      .then((data) => {
        setPresets(data.presets)
        setSelectedId(data.presets[0]?.id ?? null)
      })
      .finally(() => setLoading(false))
    setQuestionKey('')
    setSearch('')
  }, [open])

  const filtered = useMemo(() => searchPresets(presets, search), [presets, search])

  const byCategory = useMemo(() => {
    const map = new Map<string, LayoutPreset[]>()
    for (const p of filtered) {
      const list = map.get(p.category) ?? []
      list.push(p)
      map.set(p.category, list)
    }
    return map
  }, [filtered])

  const selected = presets.find((p) => p.id === selectedId) ?? null

  if (!open) return null

  return (
    <div
      className="admin-modal-overlay admin-add-question-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-question-preset-title"
      onClick={onClose}
    >
      <div
        className="admin-modal admin-modal--add-question admin-add-question-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-modal-header admin-add-question-header">
          <div>
            <h2 id="add-question-preset-title" className="admin-section-title">
              Add question
            </h2>
            <p className="admin-add-question-subtitle">
              Choose a layout preset. You can customize the screen in the designer after adding.
            </p>
          </div>
          <button type="button" className="admin-btn" onClick={onClose}>
            Cancel
          </button>
        </header>

        <div className="admin-modal-body admin-add-question-body">
        <div className="admin-add-question-key-row">
          <label className="admin-add-question-field">
            <span className="admin-add-question-label">Question key</span>
            <input
              className="admin-input"
              placeholder="e.g. passion, partner, custom_step"
              value={questionKey}
              onChange={(e) => setQuestionKey(e.target.value)}
              list="add-question-key-suggestions"
            />
            <datalist id="add-question-key-suggestions">
              {suggestedKeys.map((key) => (
                <option key={key} value={key} />
              ))}
            </datalist>
          </label>
          <input
            className="admin-input admin-add-question-search"
            placeholder="Search presets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="admin-add-question-hint">Loading presets…</p>
        ) : (
          <div className="admin-add-question-presets">
            {Array.from(byCategory.entries()).map(([category, items]) => (
              <section key={category} className="admin-add-question-preset-group">
                <h3 className="admin-add-question-preset-category">{category}</h3>
                <ul>
                  {items.map((preset) => (
                    <li key={preset.id}>
                      <button
                        type="button"
                        className={`admin-add-question-preset-item ${
                          selectedId === preset.id ? 'is-selected' : ''
                        }`}
                        onClick={() => setSelectedId(preset.id)}
                      >
                        <span className="admin-add-question-preset-name">{preset.name}</span>
                        <span className="admin-add-question-preset-desc">{preset.description}</span>
                        <span className="admin-add-question-preset-type">{preset.layout_type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        </div>

        <footer className="admin-modal-actions admin-add-question-footer">
          {selected ? (
            <p className="admin-add-question-hint">
              Selected: <strong>{selected.name}</strong>
            </p>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={!questionKey.trim() || !selected}
            onClick={() => {
              if (!selected || !questionKey.trim()) return
              onConfirm({
                question_key: questionKey.trim(),
                preset_id: selected.id,
                layout_type: selected.layout_type,
                layout: { ...selected.layout },
              })
            }}
          >
            Add question
          </button>
        </footer>
      </div>
    </div>
  )
}
