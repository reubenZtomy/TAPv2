import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type TableRowMenuItem = {
  key: string
  label: string
  disabled?: boolean
  title?: string
  variant?: 'default' | 'danger'
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
}

type TableRowActionsMenuProps = {
  items: TableRowMenuItem[]
  /** Accessible name for the ⋮ trigger, e.g. "Actions for Screen 1" */
  ariaLabel: string
}

/** Keep portaled menus inside themed admin root so CSS variables resolve. */
function getAdminPortalRoot(): HTMLElement {
  if (typeof document === 'undefined') return document.body
  return document.querySelector<HTMLElement>('.admin-root') ?? document.body
}

export function TableRowActionsMenu({ items, ariaLabel }: TableRowActionsMenuProps) {
  const [open, setOpen] = useState(false)
  // Render off-screen + hidden initially so the first open can't "flash" in normal page flow.
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: -9999,
    left: -9999,
    zIndex: 1100,
    visibility: 'hidden',
  })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return

    const rect = trigger.getBoundingClientRect()
    const menuRect = menu.getBoundingClientRect()
    const gap = 6
    let top = rect.bottom + gap
    let left = rect.right - menuRect.width

    if (top + menuRect.height > window.innerHeight - 8) {
      top = rect.top - gap - menuRect.height
    }
    if (left < 8) left = 8
    if (left + menuRect.width > window.innerWidth - 8) {
      left = window.innerWidth - 8 - menuRect.width
    }

    setMenuStyle({
      position: 'fixed',
      top: Math.round(top),
      left: Math.round(left),
      zIndex: 1100,
      visibility: 'visible',
    })
  }, [])

  /** After open, measure until menu has real dimensions (prevents flash / wrong placement). */
  useEffect(() => {
    if (!open) return

    let cancelled = false
    setMenuStyle((s) => ({ ...s, visibility: 'hidden' }))

    const tryUpdate = (attempt: number) => {
      if (cancelled) return
      const menu = menuRef.current
      if (!menu) return
      const w = menu.offsetWidth
      const h = menu.offsetHeight
      if ((w > 0 && h > 0) || attempt >= 6) {
        updatePosition()
        return
      }
      requestAnimationFrame(() => tryUpdate(attempt + 1))
    }

    requestAnimationFrame(() => tryUpdate(0))

    return () => {
      cancelled = true
    }
  }, [open, items, updatePosition])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onReposition = () => updatePosition()

    const attach = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown)
    }, 0)

    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.clearTimeout(attach)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, updatePosition])

  const close = () => setOpen(false)

  const renderItem = (item: TableRowMenuItem) => {
    const className = `admin-row-menu-item${
      item.variant === 'danger' ? ' admin-row-menu-item--danger' : ''
    }`
    const common = {
      role: 'menuitem' as const,
      className,
      title: item.title,
      disabled: item.disabled,
      onClick: () => {
        if (item.disabled) return
        item.onClick?.()
        close()
      },
    }

    if (item.href) {
      return (
        <a
          key={item.key}
          href={item.disabled ? undefined : item.href}
          target={item.target}
          rel={item.rel}
          className={`${className}${item.disabled ? ' is-disabled' : ''}`}
          role="menuitem"
          title={item.title}
          aria-disabled={item.disabled || undefined}
          tabIndex={item.disabled ? -1 : 0}
          onClick={(e) => {
            if (item.disabled) {
              e.preventDefault()
              return
            }
            close()
          }}
        >
          {item.label}
        </a>
      )
    }

    return (
      <button key={item.key} type="button" {...common}>
        {item.label}
      </button>
    )
  }

  const menuPortal =
    open &&
    createPortal(
      <div
        id={menuId}
        ref={menuRef}
        className="admin-row-menu-dropdown"
        style={menuStyle}
        role="menu"
      >
        {items.map(renderItem)}
      </div>,
      getAdminPortalRoot()
    )

  return (
    <div className="admin-row-menu">
      <button
        ref={triggerRef}
        type="button"
        className={`admin-row-menu-trigger${open ? ' is-open' : ''}`}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          setOpen((v) => !v)
        }}
      >
        <span className="admin-row-menu-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      {menuPortal}
    </div>
  )
}
