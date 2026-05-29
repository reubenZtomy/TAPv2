import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { setAdminToken, type AdminUser } from './api'
import { AdminSidebar } from './AdminSidebar'
import { useAdminThemeContext } from './AdminThemeContext'

type AdminLayoutProps = {
  user: AdminUser
  onLogout: () => void
}

export function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useAdminThemeContext()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('admin-sidebar-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('admin-sidebar-open')
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  const handleLogout = () => {
    setAdminToken(null)
    onLogout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      {mobileOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}

      <AdminSidebar
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onNavigate={closeMobile}
      />

      <div className="admin-layout-main">
        <header className="admin-mobile-bar">
          <button
            type="button"
            className="admin-mobile-menu-btn"
            aria-expanded={mobileOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="admin-mobile-menu-icon" aria-hidden />
            <span className="admin-mobile-menu-label">Menu</span>
          </button>
          <span className="admin-mobile-bar-title">Admin</span>
        </header>

        <main className="admin-main">
          <div className="admin-page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
