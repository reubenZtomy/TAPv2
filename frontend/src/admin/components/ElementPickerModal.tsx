import React, { useMemo, useState } from 'react'
import { ELEMENT_CATALOG, searchCatalog } from '../elementCatalog'
import type { LayoutElementType } from '../layoutTypes'

type ElementPickerModalProps = {
  open: boolean
  onClose: () => void
  onPick: (type: LayoutElementType) => void
}

export function ElementPickerModal({ open, onClose, onPick }: ElementPickerModalProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => searchCatalog(query), [query])

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof results>()
    for (const entry of results) {
      const list = map.get(entry.category) ?? []
      list.push(entry)
      map.set(entry.category, list)
    }
    return map
  }, [results])

  if (!open) return null

  return (
    <div
      className="admin-modal-overlay admin-element-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="element-picker-title"
      onClick={onClose}
    >
      <div className="admin-element-picker" onClick={(e) => e.stopPropagation()}>
        <header className="admin-element-picker-header">
          <h3 id="element-picker-title">Add element</h3>
          <button type="button" className="admin-btn admin-btn--small" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="admin-element-picker-search-wrap">
          <input
            className="admin-input admin-element-picker-search"
            placeholder="Search elements… (text, button, carousel)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="admin-element-picker-list">
          {results.length === 0 ? (
            <p className="admin-muted">No elements match your search.</p>
          ) : (
            Array.from(byCategory.entries()).map(([category, items]) => (
              <section key={category} className="admin-element-picker-group">
                <h4 className="admin-element-picker-category">{category}</h4>
                <ul>
                  {items.map((entry) => (
                    <li key={entry.type}>
                      <button
                        type="button"
                        className="admin-element-picker-item"
                        onClick={() => {
                          onPick(entry.type)
                          setQuery('')
                          onClose()
                        }}
                      >
                        <span className="admin-element-picker-icon" aria-hidden="true">
                          {entry.icon}
                        </span>
                        <span className="admin-element-picker-meta">
                          <span className="admin-element-picker-label">{entry.label}</span>
                          <span className="admin-muted">{entry.description}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
