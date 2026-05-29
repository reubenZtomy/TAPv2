import React from 'react'
import { NavLink, useMatch } from 'react-router-dom'
import type { AdminUser } from './api'
import { AdminThemeToggle } from './AdminThemeToggle'
import type { AdminTheme } from './useAdminTheme'

type AdminSidebarProps = {
  user: AdminUser
  theme: AdminTheme
  onToggleTheme: () => void
  onLogout: () => void
  mobileOpen: boolean
  onNavigate: () => void
}

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
}

function IconDashboard() {
  return (
    <svg className="admin-sidebar-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M4 4h7v9H4V4zm9 0h7v5h-7V4zM4 15h7v5H4v-5zm9 3h7v2h-7v-2z"
      />
    </svg>
  )
}

function IconQuizzes() {
  return (
    <svg className="admin-sidebar-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4v2h10V7H7zm0 4v2h10v-2H7zm0 4v2h6v-2H7z"
      />
    </svg>
  )
}

function IconBuilder() {
  return (
    <svg className="admin-sidebar-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z"
      />
    </svg>
  )
}

const MAIN_NAV: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <IconDashboard />, end: true },
  { to: '/admin/quizzes', label: 'Quizzes', icon: <IconQuizzes /> },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `admin-sidebar-link${isActive ? ' is-active' : ''}`
}

export function AdminSidebar({
  user,
  theme,
  onToggleTheme,
  onLogout,
  mobileOpen,
  onNavigate,
}: AdminSidebarProps) {
  const builderMatch = useMatch('/admin/quizzes/:id/builder/*')
  const displayName = user.name?.trim() || user.email.split('@')[0]
  const initial = (displayName[0] || 'A').toUpperCase()

  return (
    <aside
      id="admin-sidebar"
      className={`admin-sidebar${mobileOpen ? ' is-open' : ''}`}
      aria-label="Admin navigation"
    >
      <nav className="admin-sidebar-nav" aria-label="Main menu">
        <p className="admin-sidebar-section-label">Main</p>
        <ul className="admin-sidebar-menu">
          {MAIN_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={navLinkClass}
                onClick={onNavigate}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {builderMatch && (
          <>
            <p className="admin-sidebar-section-label">Current quiz</p>
            <ul className="admin-sidebar-menu admin-sidebar-menu--sub">
              <li>
                <NavLink
                  to={builderMatch.pathname}
                  className={navLinkClass}
                  onClick={onNavigate}
                >
                  <IconBuilder />
                  <span>Quiz builder</span>
                </NavLink>
              </li>
            </ul>
          </>
        )}
      </nav>

      <footer className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <span className="admin-sidebar-avatar" aria-hidden>
            {initial}
          </span>
          <div className="admin-sidebar-user-meta">
            <span className="admin-sidebar-user-name">{displayName}</span>
            <span className="admin-sidebar-user-email">{user.email}</span>
          </div>
        </div>

        <div className="admin-sidebar-footer-actions">
          <span className="admin-sidebar-footer-label">Appearance</span>
          <AdminThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
            className="admin-theme-toggle--block"
          />
          <button
            type="button"
            className="admin-btn admin-btn--sidebar-logout"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </footer>
    </aside>
  )
}
