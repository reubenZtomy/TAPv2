import { useCallback, useEffect, useState } from 'react'

export type AdminTheme = 'light' | 'dark'

const STORAGE_KEY = 'asq_admin_theme'

export function useAdminTheme() {
  const [theme, setThemeState] = useState<AdminTheme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  return {
    theme,
    setTheme,
    toggleTheme,
    rootClassName: `admin-root admin-theme-${theme}`,
  }
}
