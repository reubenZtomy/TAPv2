import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminApp } from './admin/AdminApp'
import { PublicQuizRoute } from './PublicQuizRoute'
import './main.css'
import './layout/quiz-layout.css'

const container = document.getElementById('root')!
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/q/:slug" element={<PublicQuizRoute />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
