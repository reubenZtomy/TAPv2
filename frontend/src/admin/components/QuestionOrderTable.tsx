import React, { useCallback, useState } from 'react'
import { reorderQuestions } from '../api'
import {
  isQuestionScreenDesigned,
  questionDisplayName,
  questionLayoutTypeLabel,
} from '../builderDisplay'
import type { QuizBuilderPayload, QuizQuestion } from '../builderTypes'
import { TableRowActionsMenu } from './TableRowActionsMenu'

type QuestionOrderTableProps = {
  quizId: number
  questions: QuizQuestion[]
  editLang: string
  onQuizUpdated: (quiz: QuizBuilderPayload) => void
  onError: (message: string) => void
  onMessage: (message: string) => void
  onPreview: (questionId: number) => void
  onDuplicate: (sourceQuestionId: number) => void
  onDelete: (question: QuizQuestion) => void
}

function moveQuestion(list: QuizQuestion[], fromId: number, toId: number): QuizQuestion[] {
  const next = [...list]
  const fromIdx = next.findIndex((q) => q.id === fromId)
  const toIdx = next.findIndex((q) => q.id === toId)
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return list
  const [item] = next.splice(fromIdx, 1)
  next.splice(toIdx, 0, item)
  return next
}

export function QuestionOrderTable({
  quizId,
  questions,
  editLang,
  onQuizUpdated,
  onError,
  onMessage,
  onPreview,
  onDuplicate,
  onDelete,
}: QuestionOrderTableProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dropTargetId, setDropTargetId] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)

  const persistOrder = useCallback(
    async (ordered: QuizQuestion[]) => {
      setReordering(true)
      try {
        const res = await reorderQuestions(
          quizId,
          ordered.map((q, index) => ({ id: q.id, order_index: index }))
        )
        onQuizUpdated(res.quiz)
        onMessage('Question order updated')
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Failed to reorder questions')
        throw e
      } finally {
        setReordering(false)
      }
    },
    [quizId, onQuizUpdated, onError, onMessage]
  )

  const handleDrop = useCallback(
    (targetId: number) => {
      if (draggingId == null || draggingId === targetId || reordering) return
      const ordered = moveQuestion(questions, draggingId, targetId)
      setDraggingId(null)
      setDropTargetId(null)
      void persistOrder(ordered)
    },
    [draggingId, persistOrder, questions, reordering]
  )

  return (
    <div className="admin-table-wrap admin-question-table-wrap">
      <table className="admin-table admin-question-table">
        <thead>
          <tr>
            <th className="admin-question-table-col-drag" aria-label="Reorder" />
            <th className="admin-question-table-col-index">#</th>
            <th>Name</th>
            <th>Type</th>
            <th className="admin-question-table-col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, index) => {
            const isDragging = draggingId === q.id
            const isDropTarget = dropTargetId === q.id && draggingId != null && draggingId !== q.id
            return (
              <tr
                key={q.id}
                className={[
                  isDragging ? 'is-dragging' : '',
                  isDropTarget ? 'is-drop-target' : '',
                  reordering ? 'is-reordering' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onDragOver={(e) => {
                  if (draggingId == null || draggingId === q.id) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setDropTargetId(q.id)
                }}
                onDragLeave={() => {
                  if (dropTargetId === q.id) setDropTargetId(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(q.id)
                }}
              >
                <td className="admin-question-table-col-drag">
                  <button
                    type="button"
                    className="admin-question-drag-handle"
                    draggable={!reordering}
                    disabled={reordering || questions.length < 2}
                    aria-label={`Drag to reorder ${questionDisplayName(q, editLang)}`}
                    title={questions.length < 2 ? 'Add another question to reorder' : 'Drag to change flow order'}
                    onDragStart={(e) => {
                      setDraggingId(q.id)
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', String(q.id))
                    }}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setDropTargetId(null)
                    }}
                  >
                    <span aria-hidden>⋮⋮</span>
                  </button>
                </td>
                <td className="admin-question-table-col-index">{index + 1}</td>
                <td className="admin-question-table-name">{questionDisplayName(q, editLang)}</td>
                <td className="admin-question-table-type">{questionLayoutTypeLabel(q.layout_type)}</td>
                <td className="admin-question-table-col-action">
                  <TableRowActionsMenu
                    ariaLabel={`Actions for ${questionDisplayName(q, editLang)}`}
                    items={[
                      {
                        key: 'view',
                        label: 'View design',
                        disabled: !isQuestionScreenDesigned(q),
                        title: isQuestionScreenDesigned(q)
                          ? 'View saved screen design'
                          : 'Design this screen first to enable preview',
                        onClick: () => onPreview(q.id),
                      },
                      {
                        key: 'design',
                        label: 'Design',
                        href: `/admin/quizzes/${quizId}/builder/design/${q.id}`,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      },
                      {
                        key: 'duplicate',
                        label: 'Duplicate design',
                        disabled: !isQuestionScreenDesigned(q) || questions.length < 2,
                        title:
                          questions.length < 2
                            ? 'Add another question first'
                            : !isQuestionScreenDesigned(q)
                              ? 'Design this screen first to duplicate'
                              : 'Copy this screen design to another question',
                        onClick: () => onDuplicate(q.id),
                      },
                      {
                        key: 'delete',
                        label: 'Delete',
                        variant: 'danger',
                        onClick: () => onDelete(q),
                      },
                    ]}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
