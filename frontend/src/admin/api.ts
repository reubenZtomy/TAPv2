import type { QuizBuilderPayload } from './builderTypes'
import type { QuizCustomFont } from '../utils/quizFont'

const ADMIN_TOKEN_KEY = 'asq_admin_token'

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  else localStorage.removeItem(ADMIN_TOKEN_KEY)
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = getAdminToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data as { error?: string }).error || res.statusText
    throw new Error(message)
  }
  return data
}

export type AdminUser = {
  id: number
  email: string
  name: string
  role: string
}

export type QuizRecord = {
  id: number
  quiz_uuid: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'inactive' | 'archived'
  default_language: string
  allow_language_selection: boolean
  result_engine_type: string
  created_at: string
  updated_at: string
  submission_count?: number
  custom_font?: QuizCustomFont | null
}

export type DashboardStats = {
  total_quizzes: number
  active_quizzes: number
  total_submissions: number
  today_submissions: number
  top_personality: { id: string | null; count: number }
  top_language: { code: string | null; count: number }
}

export type TablePreferences = {
  table_name: string
  columns: string[] | null
  filters: Record<string, string>
  sort: { field?: string; order?: string }
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  if (data.user?.role !== 'admin') throw new Error('Admin access required')
  setAdminToken(data.token)
  return data.user as AdminUser
}

/** Dev only: sign in using ADMIN_EMAIL / ADMIN_PASSWORD from backend/.env */
export async function tryDevAutoAdminLogin(): Promise<AdminUser | null> {
  if (!import.meta.env.DEV) return null
  try {
    const res = await fetch('/api/dev/auto-admin-login', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.user?.role !== 'admin' || !data.token) return null
    setAdminToken(data.token)
    return data.user as AdminUser
  } catch {
    return null
  }
}

export async function adminMe() {
  const token = getAdminToken()
  if (!token) return null
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    setAdminToken(null)
    return null
  }
  const data = await res.json()
  if (data.user?.role !== 'admin') {
    setAdminToken(null)
    return null
  }
  return data.user as AdminUser
}

export function fetchDashboardStats() {
  return adminFetch('/api/admin/dashboard/stats') as Promise<DashboardStats>
}

export function fetchQuizzes(params: URLSearchParams) {
  return adminFetch(`/api/admin/quizzes?${params}`) as Promise<{
    quizzes: QuizRecord[]
    pagination: { page: number; page_size: number; total: number; total_pages: number }
  }>
}

export function createQuiz(body: Partial<QuizRecord>) {
  return adminFetch('/api/admin/quizzes', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ quiz: QuizRecord }>
}

export function updateQuizStatus(id: number, status: QuizRecord['status']) {
  return adminFetch(`/api/admin/quizzes/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }) as Promise<{ quiz: QuizRecord }>
}

export function archiveQuiz(id: number) {
  return adminFetch(`/api/admin/quizzes/${id}/archive`, { method: 'PATCH' }) as Promise<{
    quiz: QuizRecord
  }>
}

export function deleteQuiz(id: number) {
  return adminFetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' }) as Promise<{ ok: boolean }>
}

export function fetchTablePreferences(tableName: string) {
  return adminFetch(`/api/admin/table-preferences/${tableName}`) as Promise<TablePreferences>
}

export function saveTablePreferences(
  tableName: string,
  prefs: { columns: string[]; filters?: Record<string, string>; sort?: TablePreferences['sort'] }
) {
  return adminFetch(`/api/admin/table-preferences/${tableName}`, {
    method: 'PUT',
    body: JSON.stringify(prefs),
  }) as Promise<TablePreferences>
}

export function fetchQuiz(id: number) {
  return adminFetch(`/api/admin/quizzes/${id}`) as Promise<{ quiz: QuizRecord & { languages?: unknown[] } }>
}

export function updateQuiz(id: number, body: Partial<QuizRecord>) {
  return adminFetch(`/api/admin/quizzes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<{ quiz: QuizRecord }>
}

export function fetchQuizBuilder(quizId: number) {
  return adminFetch(`/api/admin/quizzes/${quizId}/builder`) as Promise<{ quiz: QuizBuilderPayload }>
}

export function publishQuiz(quizId: number) {
  return adminFetch(`/api/admin/quizzes/${quizId}/publish`, { method: 'POST' }) as Promise<{
    quiz: QuizBuilderPayload
    message: string
  }>
}

export function saveQuizDraft(quizId: number) {
  return adminFetch(`/api/admin/quizzes/${quizId}/draft`, { method: 'POST' }) as Promise<{
    quiz: QuizBuilderPayload
    message: string
  }>
}

export function seedTapTemplate(quizId: number) {
  return adminFetch(`/api/admin/quizzes/${quizId}/seed-tap-template`, { method: 'POST' }) as Promise<{
    quiz: QuizBuilderPayload
    questions_created: number
  }>
}

export function addQuizLanguage(
  quizId: number,
  body: { language_code: string; language_name?: string; is_default?: boolean }
) {
  return adminFetch(`/api/admin/quizzes/${quizId}/languages`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ quiz: QuizBuilderPayload }>
}

export function deleteQuizLanguage(quizId: number, languageId: number) {
  return adminFetch(`/api/admin/quizzes/${quizId}/languages/${languageId}`, {
    method: 'DELETE',
  }) as Promise<{ quiz: QuizBuilderPayload }>
}

export type LayoutPreset = {
  id: string
  name: string
  layout_type: string
  category: string
  description: string
  layout: Record<string, unknown>
}

export function fetchLayoutPresets() {
  return adminFetch('/api/admin/layout-presets') as Promise<{ presets: LayoutPreset[] }>
}

export function addQuestion(quizId: number, body: Record<string, unknown>) {
  return adminFetch(`/api/admin/quizzes/${quizId}/questions`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ quiz: QuizBuilderPayload; question?: { id: number } }>
}

export type QuizLink = {
  id: number
  link_uuid: string
  quiz_id: number
  link_name: string
  slug: string
  status: 'active' | 'inactive'
  language_mode: string
  default_language: string | null
  allowed_languages_json: string | null
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

export function fetchQuizLinks(quizId: number) {
  return adminFetch(`/api/admin/quizzes/${quizId}/links`) as Promise<{ links: QuizLink[] }>
}

export function createQuizLink(quizId: number, body: Record<string, unknown>) {
  return adminFetch(`/api/admin/quizzes/${quizId}/links`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ link: QuizLink }>
}

export function updateQuizLink(linkId: number, body: Record<string, unknown>) {
  return adminFetch(`/api/admin/links/${linkId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<{ link: QuizLink }>
}

export function deleteQuizLink(linkId: number) {
  return adminFetch(`/api/admin/links/${linkId}`, { method: 'DELETE' }) as Promise<{ ok: boolean }>
}

export function suggestQuizLinkSlug(quizId: number, name: string) {
  const params = new URLSearchParams({ name })
  return adminFetch(`/api/admin/quizzes/${quizId}/links/suggest-slug?${params}`) as Promise<{
    slug: string
  }>
}

export function updateQuestion(questionId: number, body: Record<string, unknown>) {
  return adminFetch(`/api/admin/questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<{ quiz: QuizBuilderPayload }>
}

export function deleteQuestion(questionId: number) {
  return adminFetch(`/api/admin/questions/${questionId}`, { method: 'DELETE' }) as Promise<{
    quiz: QuizBuilderPayload
  }>
}

export function reorderQuestions(
  quizId: number,
  order: Array<{ id: number; order_index: number }>
) {
  return adminFetch(`/api/admin/quizzes/${quizId}/questions/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ order }),
  }) as Promise<{ quiz: QuizBuilderPayload }>
}

export function addOption(questionId: number, body: Record<string, unknown>) {
  return adminFetch(`/api/admin/questions/${questionId}/options`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ quiz: QuizBuilderPayload }>
}

export function deleteOption(optionId: number) {
  return adminFetch(`/api/admin/options/${optionId}`, { method: 'DELETE' }) as Promise<{
    quiz: QuizBuilderPayload
  }>
}

export function updateQuestionLayout(
  questionId: number,
  body: { layout_json: Record<string, unknown>; layout_type?: string }
) {
  return adminFetch(`/api/admin/questions/${questionId}/layout`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<{ quiz: QuizBuilderPayload; question: unknown }>
}

export function updateQuizIntroLayout(quizId: number, intro_layout: Record<string, unknown>) {
  return adminFetch(`/api/admin/quizzes/${quizId}/intro-layout`, {
    method: 'PUT',
    body: JSON.stringify({ intro_layout }),
  }) as Promise<{ quiz: QuizBuilderPayload }>
}

export async function uploadQuizFont(
  quizId: number,
  file: File,
  familyName: string
): Promise<{ custom_font: QuizCustomFont | null; quiz: QuizBuilderPayload }> {
  const token = getAdminToken()
  const form = new FormData()
  form.append('file', file)
  form.append('family_name', familyName)
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`/api/admin/quizzes/${quizId}/font`, { method: 'POST', headers, body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText)
  }
  return data as { custom_font: QuizCustomFont | null; quiz: QuizBuilderPayload }
}

export async function deleteQuizFont(
  quizId: number
): Promise<{ custom_font: null; quiz: QuizBuilderPayload }> {
  return adminFetch(`/api/admin/quizzes/${quizId}/font`, { method: 'DELETE' }) as Promise<{
    custom_font: null
    quiz: QuizBuilderPayload
  }>
}

export async function uploadQuizAsset(file: File): Promise<{ url: string; filename: string }> {
  const token = getAdminToken()
  const form = new FormData()
  form.append('file', file)
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch('/api/admin/uploads', { method: 'POST', headers, body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText)
  }
  return data as { url: string; filename: string }
}
