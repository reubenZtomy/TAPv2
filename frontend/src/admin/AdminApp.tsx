import React, { useEffect, useState } from 'react'

import { Navigate, Route, Routes } from 'react-router-dom'

import { adminMe, tryDevAutoAdminLogin, type AdminUser } from './api'

import { AdminLayout } from './AdminLayout'

import { AdminLoginPage } from './pages/AdminLoginPage'

import { AdminDashboardPage } from './pages/AdminDashboardPage'

import { AdminQuizzesPage } from './pages/AdminQuizzesPage'
import { AdminQuizBuilderPage } from './pages/AdminQuizBuilderPage'
import { AdminQuestionDesignPage } from './pages/AdminQuestionDesignPage'
import { AdminIntroDesignPage } from './pages/AdminIntroDesignPage'
import { AdminResultScreenDesignPage } from './pages/AdminResultScreenDesignPage'

import { AdminThemeProvider } from './AdminThemeContext'

import './admin.css'
import './admin-responsive.css'



function AdminProtected({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {

  return (

    <Routes>

      <Route element={<AdminLayout user={user} onLogout={onLogout} />}>

        <Route path="dashboard" element={<AdminDashboardPage />} />

        <Route path="quizzes" element={<AdminQuizzesPage />} />
        <Route path="quizzes/:id/builder/answers/design/:resultId" element={<AdminResultScreenDesignPage />} />
        <Route path="quizzes/:id/builder/intro/design" element={<AdminIntroDesignPage />} />
        <Route path="quizzes/:id/builder/design/:questionId" element={<AdminQuestionDesignPage />} />
        <Route path="quizzes/:id/builder" element={<AdminQuizBuilderPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />

      </Route>

      <Route path="*" element={<Navigate to="dashboard" replace />} />

    </Routes>

  )

}



export function AdminApp() {

  const [user, setUser] = useState<AdminUser | null>(null)

  const [checking, setChecking] = useState(true)



  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let current = await adminMe()
      if (!current && import.meta.env.DEV) {
        current = await tryDevAutoAdminLogin()
      }
      if (!cancelled) {
        setUser(current)
        setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])



  return (

    <AdminThemeProvider>

      {checking ? (

        <div className="admin-login-wrap">

          <p className="admin-pagination-text">Loading…</p>

        </div>

      ) : (

        <Routes>

          <Route

            path="login"

            element={

              user ? (

                <Navigate to="/admin/dashboard" replace />

              ) : (

                <AdminLoginPage onLoggedIn={() => adminMe().then(setUser)} />

              )

            }

          />

          <Route

            path="*"

            element={

              user ? (

                <AdminProtected user={user} onLogout={() => setUser(null)} />

              ) : (

                <Navigate to="/admin/login" replace />

              )

            }

          />

        </Routes>

      )}

    </AdminThemeProvider>

  )

}


