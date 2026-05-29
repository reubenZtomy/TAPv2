import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteQuizLanguage, importQuizLanguageJson } from '../api'
import type { QuizBuilderPayload, QuizLanguage } from '../builderTypes'
import {
  downloadQuizLanguageJson,
  getQuizFirstScreenTarget,
  parseQuizLanguageJson,
  toBackendImportPayload,
} from '../quizLanguageJson'
import { LanguageImportSuccessModal } from './LanguageImportSuccessModal'

type QuizLanguagesPanelProps = {
  quiz: QuizBuilderPayload
  quizId: number
  editLang: string
  onEditLangChange: (code: string) => void
  onQuizUpdated: (quiz: QuizBuilderPayload) => void
  onError: (message: string) => void
  onMessage: (message: string) => void
}

export function QuizLanguagesPanel({
  quiz,
  quizId,
  editLang,
  onEditLangChange,
  onQuizUpdated,
  onError,
  onMessage,
}: QuizLanguagesPanelProps) {
  const navigate = useNavigate()
  const uploadRef = useRef<HTMLInputElement>(null)
  const [uploadLangCode, setUploadLangCode] = useState('')
  const [uploadLangName, setUploadLangName] = useState('')
  const [importing, setImporting] = useState(false)
  const [successLang, setSuccessLang] = useState<QuizLanguage | null>(null)

  const defaultLanguage =
    quiz.languages.find((l) => l.is_default)?.language_code ||
    quiz.languages[0]?.language_code ||
    'English'

  const hasQuestions = quiz.questions.length > 0

  const handleDownload = (targetCode: string, targetName: string) => {
    if (!hasQuestions) {
      onError('Add questions before downloading a translation template.')
      return
    }
    if (!targetCode.trim()) {
      onError('Enter a language code for the new translation.')
      return
    }
    downloadQuizLanguageJson(quiz, editLang, targetCode.trim(), targetName.trim() || targetCode.trim())
    onMessage(`Downloaded translation template for ${targetName.trim() || targetCode.trim()}`)
  }

  const handleUploadClick = () => {
    if (!hasQuestions) {
      onError('Add questions before uploading a translation file.')
      return
    }
    uploadRef.current?.click()
  }

  const handleUploadFile = async (file: File | undefined) => {
    if (!file) return
    setImporting(true)
    onError('')
    try {
      const text = await file.text()
      const parsed = parseQuizLanguageJson(JSON.parse(text), uploadLangCode.trim() || undefined)
      const langCode = parsed.languageCode
      const langName = uploadLangName.trim() || parsed.languageName || langCode
      const res = await importQuizLanguageJson(quizId, {
        json: toBackendImportPayload(parsed.payload),
        language_code: langCode,
        language_name: langName,
      })
      onQuizUpdated(res.quiz)
      const imported = res.quiz.languages.find((l) => l.language_code === res.language_code)
      setSuccessLang(
        imported ?? {
          id: 0,
          quiz_id: quizId,
          language_code: res.language_code,
          language_name: langName,
          is_default: false,
        }
      )
      setUploadLangCode('')
      setUploadLangName('')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setImporting(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  const placeLanguageSwitch = (lang?: QuizLanguage | null) => {
    const target = getQuizFirstScreenTarget(quiz)
    const seed = 'seedLanguageSwitch=1'
    if (target.type === 'intro') {
      navigate(`/admin/quizzes/${quizId}/builder/intro/design?${seed}`)
      return
    }
    if (target.questionId) {
      navigate(`/admin/quizzes/${quizId}/builder/design/${target.questionId}?${seed}`)
      return
    }
    onError('Add a question or intro screen before placing the language switcher.')
    if (lang) setSuccessLang(null)
  }

  return (
    <>
      <section className="admin-panel admin-builder-tab-panel" id="builder-languages">
        <h2 className="admin-section-title">Languages</h2>
        <p className="admin-lang-warning">
          Make sure you have added questions before setting language.
        </p>
        <p className="admin-muted">
          Download a JSON template from your current language, translate the text, then upload it to
          add a new language. Editing preview language: <strong>{editLang}</strong>
        </p>

        <ul className="admin-lang-list admin-lang-card-list">
          {quiz.languages.map((lang) => (
            <li key={lang.id} className="admin-lang-card">
              <div className="admin-lang-card-head">
                <button
                  type="button"
                  className={`admin-btn admin-btn--small ${editLang === lang.language_code ? 'admin-btn--active' : ''}`}
                  onClick={() => onEditLangChange(lang.language_code)}
                >
                  {lang.language_name}
                  {lang.is_default ? ' ★' : ''}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--small"
                  aria-label={`Remove ${lang.language_name}`}
                  onClick={() =>
                    void deleteQuizLanguage(quizId, lang.id)
                      .then((r) => {
                        onQuizUpdated(r.quiz)
                        onMessage('Language removed')
                      })
                      .catch((e) => onError(e instanceof Error ? e.message : 'Remove failed'))
                  }
                >
                  ×
                </button>
              </div>
              <div className="admin-lang-card-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--small"
                  disabled={!hasQuestions}
                  onClick={() => handleDownload(lang.language_code, lang.language_name)}
                  title={
                    lang.language_code === defaultLanguage
                      ? 'Download template to translate into another language'
                      : 'Download this language as reference'
                  }
                >
                  Download Quiz JSON
                </button>
                {lang.language_code !== defaultLanguage ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn--small admin-btn--primary"
                    onClick={() => placeLanguageSwitch(lang)}
                  >
                    Place your language switch element
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <div className="admin-lang-upload-block">
          <h3 className="admin-section-subtitle">Translation template</h3>
          <p className="admin-muted admin-lang-upload-help">
            Set the new language code, download a file pre-filled from <strong>{editLang}</strong>{' '}
            (same format as <code>English.txt</code>: <code>title</code>, <code>ui</code>,{' '}
            <code>questions</code>), replace the text, then upload.
          </p>
          <div className="admin-toolbar admin-lang-upload-toolbar">
            <input
              className="admin-input"
              placeholder="New language code e.g. Spanish"
              value={uploadLangCode}
              onChange={(e) => setUploadLangCode(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Display name"
              value={uploadLangName}
              onChange={(e) => setUploadLangName(e.target.value)}
            />
            <button
              type="button"
              className="admin-btn"
              disabled={!hasQuestions || !uploadLangCode.trim()}
              onClick={() => handleDownload(uploadLangCode, uploadLangName)}
            >
              Download template from {editLang}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={!hasQuestions || importing}
              onClick={handleUploadClick}
            >
              {importing ? 'Uploading…' : 'Upload translated JSON'}
            </button>
            <input
              ref={uploadRef}
              type="file"
              accept="application/json,.json"
              className="admin-file-input-hidden"
              onChange={(e) => void handleUploadFile(e.target.files?.[0])}
            />
          </div>
        </div>
      </section>

      <LanguageImportSuccessModal
        open={Boolean(successLang)}
        languageName={successLang?.language_name || successLang?.language_code || 'Language'}
        onClose={() => setSuccessLang(null)}
        onPlaceSwitcher={() => {
          placeLanguageSwitch(successLang)
          setSuccessLang(null)
        }}
      />
    </>
  )
}
