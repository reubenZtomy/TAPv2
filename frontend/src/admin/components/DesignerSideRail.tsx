import React, { useMemo, useState } from 'react'
import { ComponentRailPreview } from './ComponentRailPreview'
import {
  ELEMENT_CATALOG,
  ELEMENT_CATEGORY_ORDER,
  type ElementCatalogEntry,
} from '../elementCatalog'
import { setLayoutElementDragData, type LayoutElementType } from '../layoutTypes'

type DesignerSideRailProps = {
  onInsertComponent: (type: LayoutElementType) => void
}

function ComponentRailCard({
  entry,
  onInsert,
}: {
  entry: ElementCatalogEntry
  onInsert: (type: LayoutElementType) => void
}) {
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        className="admin-designer-rail-item"
        draggable
        title={`Drag onto screen or double-click to add ${entry.label}`}
        onDragStart={(e) => {
          setLayoutElementDragData(e.dataTransfer, entry.type)
          e.currentTarget.classList.add('is-dragging')
        }}
        onDragEnd={(e) => {
          e.currentTarget.classList.remove('is-dragging')
        }}
        onDoubleClick={(e) => {
          e.preventDefault()
          onInsert(entry.type)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onInsert(entry.type)
          }
        }}
      >
        <div className="admin-designer-rail-item-head">
          <span className="admin-designer-rail-item-icon" aria-hidden="true">
            {entry.icon}
          </span>
          <span className="admin-designer-rail-item-meta">
            <span className="admin-designer-rail-item-label">{entry.label}</span>
            <span className="admin-designer-rail-item-desc">{entry.description}</span>
          </span>
        </div>
        <ComponentRailPreview type={entry.type} />
      </div>
    </li>
  )
}

export function DesignerSideRail({ onInsertComponent }: DesignerSideRailProps) {
  const categories = useMemo(() => {
    const map = new Map<string, ElementCatalogEntry[]>()
    for (const entry of ELEMENT_CATALOG) {
      const list = map.get(entry.category) ?? []
      list.push(entry)
      map.set(entry.category, list)
    }
    return ELEMENT_CATEGORY_ORDER.filter((name) => map.has(name)).map((name) => ({
      name,
      items: map.get(name) ?? [],
    }))
  }, [])

  const [activeCategory, setActiveCategory] = useState<string>(() => categories[0]?.name ?? '')

  const toggleCategory = (name: string) => {
    setActiveCategory((prev) => (prev === name ? '' : name))
  }

  return (
    <aside className="admin-designer-rail" aria-label="Component library">
      <div className="admin-designer-rail-accordion">
        {categories.map(({ name, items }) => {
          const isActive = activeCategory === name
          return (
            <div
              key={name}
              className={`admin-designer-rail-accordion-item${isActive ? ' is-active' : ''}`}
            >
              <button
                type="button"
                className="admin-designer-rail-accordion-header"
                aria-expanded={isActive}
                onClick={() => toggleCategory(name)}
              >
                <span>{name}</span>
                <span className="admin-designer-rail-accordion-chevron" aria-hidden="true">
                  {isActive ? '▾' : '▸'}
                </span>
              </button>
              <div className="admin-designer-rail-accordion-content">
                <div className="admin-designer-rail-accordion-content-inner">
                  <ul className="admin-designer-rail-item-list">
                    {items.map((entry) => (
                      <ComponentRailCard key={entry.type} entry={entry} onInsert={onInsertComponent} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
