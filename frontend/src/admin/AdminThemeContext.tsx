import React, { createContext, useContext, useEffect } from 'react'
import { useAdminTheme } from './useAdminTheme'

type AdminThemeContextValue = ReturnType<typeof useAdminTheme>

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null)

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useAdminTheme()

  useEffect(() => {
    document.documentElement.classList.add('admin-route-active')
    return () => {
      document.documentElement.classList.remove('admin-route-active')
    }
  }, [])

  return (
    <AdminThemeContext.Provider value={value}>
      <div className={value.rootClassName}>{children}</div>
    </AdminThemeContext.Provider>
  )
}

export function useAdminThemeContext(): AdminThemeContextValue {
  const ctx = useContext(AdminThemeContext)
  if (!ctx) {
    throw new Error('useAdminThemeContext must be used within AdminThemeProvider')
  }
  return ctx
}
