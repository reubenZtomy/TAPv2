import React from 'react'
import { Link } from 'react-router-dom'

export type AdminBuilderTab = 'questions' | 'answers' | 'languages' | 'settings' | 'links'

type AdminQuizBuilderTabsProps = {
  quizId: number
  active: AdminBuilderTab | 'design'
  designLabel?: string
  answersWarningCount?: number
}

function tabHref(quizId: number, tab: AdminBuilderTab): string {
  if (tab === 'questions') return `/admin/quizzes/${quizId}/builder`
  return `/admin/quizzes/${quizId}/builder?tab=${tab}`
}

export function AdminQuizBuilderTabs({
  quizId,
  active,
  designLabel,
  answersWarningCount = 0,
}: AdminQuizBuilderTabsProps) {
  const tabs: { id: AdminBuilderTab; label: string }[] = [
    { id: 'questions', label: 'Questions' },
    { id: 'answers', label: 'Answers' },
    { id: 'languages', label: 'Languages' },
    { id: 'settings', label: 'Settings' },
    { id: 'links', label: 'Links' },
  ]

  return (
    <div className="admin-builder-tabs" role="tablist" aria-label="Quiz builder sections">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={tabHref(quizId, tab.id)}
          role="tab"
          aria-selected={active === tab.id}
          className={`admin-builder-tab${active === tab.id ? ' is-active' : ''}`}
        >
          {tab.label}
          {tab.id === 'answers' && answersWarningCount > 0 ? (
            <span className="admin-tab-warning-badge" title={`${answersWarningCount} result rule(s) need remapping`}>
              ⚠ {answersWarningCount}
            </span>
          ) : null}
        </Link>
      ))}
      {active === 'design' ? (
        <span role="tab" aria-selected className="admin-builder-tab is-active admin-builder-tab--design">
          Design{designLabel ? `: ${designLabel}` : ''}
        </span>
      ) : null}
    </div>
  )
}
