import React from 'react'
import type { AdminTheme } from './useAdminTheme'

type AdminThemeToggleProps = {
  theme: AdminTheme
  onToggle: () => void
  className?: string
}

export function AdminThemeToggle({ theme, onToggle, className }: AdminThemeToggleProps) {
  return (
    <button
      type="button"
      className={['admin-theme-toggle', className].filter(Boolean).join(' ')}
      onClick={onToggle}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
    >
      {theme === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  )
}
