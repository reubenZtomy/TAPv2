import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyResize, type ResizeHandle } from '../layoutResize'
import {
  CANVAS_H,
  CANVAS_W,
  canvasCoordsFromClient,
  clampElementPosition,
  createLayoutElement,
  defaultLayoutElementOptionKey,
  duplicateLayoutElement,
  isLayoutAnswerChoice,
  isLayoutElementDrag,
  normalizeLayoutAnswerKeys,
  parseLayoutElementDrag,
  resolveActionNavigation,
  type LayoutElement,
  type LayoutElementType,
  type PreviewTarget,
  type ScreenBackgroundSettings,
  type ScreenOption,
} from '../layoutTypes'
import { CarouselEditorModal } from './CarouselEditorModal'
import { ElementContentModal } from './ElementContentModal'
import { ElementPickerModal } from './ElementPickerModal'
import type { QuestionOptionChoice } from './elementEditorFields'
import type { QuizBuilderPayload, QuizLanguage } from '../builderTypes'
import type { QuizCustomFont } from '../../utils/quizFont'
import { QuizLayoutFontRoot } from '../../layout/QuizLayoutFontRoot'
import { LayoutElementInspector, layoutElementStyle } from './LayoutElementInspector'
import { LayoutElementView } from './LayoutElementView'
import { LayoutResizeHandles } from './LayoutResizeHandles'
import { DesignerSideRail } from './DesignerSideRail'

type LayoutCanvasEditorProps = {
  elements: LayoutElement[]
  onElementsChange: (elements: LayoutElement[]) => void
  onSave: (elements: LayoutElement[]) => Promise<void>
  children: React.ReactNode
  saving?: boolean
  screens: ScreenOption[]
  currentScreen: PreviewTarget
  questionIds: number[]
  questionOptions?: QuestionOptionChoice[]
  screenBackground?: ScreenBackgroundSettings
  onScreenBackgroundChange?: (settings: ScreenBackgroundSettings) => void
  quizId?: number
  customFont?: QuizCustomFont | null
  onQuizFontUpdated?: (quiz: QuizBuilderPayload) => void
  onNavigate?: (target: PreviewTarget) => void
  languages?: QuizLanguage[]
  previewLanguage?: string
  /** In editor mode, whether click/tap should execute element actions. */
  allowActionTriggerInEditor?: boolean
  /** Vertical accordion rail to the right of the phone (design page). */
  showDesignerRail?: boolean
}

type DragState =
  | {
      mode: 'move'
      id: string
      startX: number
      startY: number
      origX: number
      origY: number
      scale: number
      moved: boolean
    }
  | {
      mode: 'resize'
      id: string
      handle: ResizeHandle
      startX: number
      startY: number
      orig: { x: number; y: number; width: number; height: number }
      scale: number
      moved: boolean
    }

const CLICK_THRESHOLD = 6

function LayoutCanvasLayers({
  children,
  elements,
  customFont,
  selectedId,
  onSelect,
  onMoveStart,
  onResizeStart,
  openElementSetup,
  languages,
  previewLanguage,
}: {
  children: React.ReactNode
  elements: LayoutElement[]
  customFont?: QuizCustomFont | null
  selectedId: string | null
  onSelect: (id: string) => void
  onMoveStart: (id: string, e: React.PointerEvent) => void
  onResizeStart: (id: string, handle: ResizeHandle, e: React.PointerEvent) => void
  openElementSetup: (el: LayoutElement, isNew: boolean) => void
  languages?: QuizLanguage[]
  previewLanguage?: string
}) {
  return (
    <QuizLayoutFontRoot customFont={customFont} className="admin-layout-canvas-font-root">
      <div className="admin-layout-canvas-base">{children}</div>
      <div className="admin-layout-canvas-overlay">
        {elements.map((el) => {
          const selected = selectedId === el.id
          const hasAction = Boolean(el.action?.type && el.action.type !== 'none')
          return (
            <div
              key={el.id}
              className={`admin-layout-element admin-layout-element--${el.type} ${
                selected ? 'is-selected' : ''
              } ${hasAction ? 'has-action' : ''}`}
              style={{
                ...layoutElementStyle(el),
                ...(el.type === 'shape' && el.shapeVariant === 'circle' ? { borderRadius: '50%' } : {}),
              }}
              onPointerDown={(e) => onMoveStart(el.id, e)}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation()
                onSelect(el.id)
                openElementSetup(el, false)
              }}
            >
              <LayoutElementView
                element={el}
                hasAction={hasAction}
                languages={languages}
                previewLanguage={previewLanguage}
              />
              {el.isOption ? (
                <span className="admin-layout-option-badge" title="Selectable option">
                  Option
                </span>
              ) : null}
              {selected ? (
                <LayoutResizeHandles onResizeStart={(handle, ev) => onResizeStart(el.id, handle, ev)} />
              ) : null}
            </div>
          )
        })}
      </div>
    </QuizLayoutFontRoot>
  )
}

export function LayoutCanvasEditor({
  elements,
  onElementsChange,
  onSave,
  children,
  saving = false,
  screens,
  currentScreen,
  questionIds,
  questionOptions = [],
  screenBackground,
  onScreenBackgroundChange,
  quizId,
  customFont,
  onQuizFontUpdated,
  onNavigate,
  languages,
  previewLanguage,
  allowActionTriggerInEditor = false,
  showDesignerRail = false,
}: LayoutCanvasEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef(elements)
  useEffect(() => {
    elementsRef.current = elements
  }, [elements])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [contentSetup, setContentSetup] = useState<{ element: LayoutElement; isNew: boolean } | null>(
    null
  )
  const [carouselDraft, setCarouselDraft] = useState<LayoutElement | null>(null)
  const [canvasDragOver, setCanvasDragOver] = useState(false)
  const dragRef = useRef<DragState | null>(null)

  const selectedElement = elements.find((e) => e.id === selectedId) ?? null
  const effectiveQuestionOptions = useMemo(() => {
    const byKey = new Map<string, QuestionOptionChoice>()
    const add = (key: string, label: string) => {
      const k = key.trim()
      if (!k || byKey.has(k)) return
      byKey.set(k, { key: k, label: label.trim() || k })
    }
    for (const opt of questionOptions) {
      add(opt.key, opt.label)
    }
    for (const el of elements) {
      if (!isLayoutAnswerChoice(el)) continue
      const key = defaultLayoutElementOptionKey(el)
      add(key, el.content?.trim() || el.placeholder?.trim() || key)
    }
    return Array.from(byKey.values())
  }, [elements, questionOptions])

  const getScale = useCallback(() => {
    const el = canvasRef.current
    if (!el) return 1
    return el.getBoundingClientRect().width / CANVAS_W
  }, [])

  const pushElements = (next: LayoutElement[]) => {
    onElementsChange(normalizeLayoutAnswerKeys(next))
  }

  const updateElement = (id: string, patch: Partial<LayoutElement>) => {
    pushElements(elements.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const commitElement = (el: LayoutElement) => {
    const exists = elements.some((e) => e.id === el.id)
    if (exists) {
      pushElements(elements.map((e) => (e.id === el.id ? { ...e, ...el } : e)))
    } else {
      pushElements([...elements, el])
    }
    setSelectedId(el.id)
  }

  const openElementSetup = (element: LayoutElement, isNew: boolean) => {
    if (element.type === 'carousel') {
      setCarouselDraft(element)
      return
    }
    setContentSetup({ element, isNew })
  }

  const tryNavigateElement = (el: LayoutElement) => {
    if (!allowActionTriggerInEditor) return
    if (!onNavigate || !el.action) return
    const next = resolveActionNavigation(el.action, currentScreen, questionIds)
    if (next != null) onNavigate(next)
  }

  const handleMoveStart = (id: string, e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.admin-resize-handle')) return
    e.stopPropagation()
    const el = elements.find((x) => x.id === id)
    if (!el) return
    setSelectedId(id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = {
      mode: 'move',
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      scale: getScale(),
      moved: false,
    }
  }

  const handleResizeStart = (id: string, handle: ResizeHandle, e: React.PointerEvent) => {
    e.stopPropagation()
    const el = elements.find((x) => x.id === id)
    if (!el) return
    setSelectedId(id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = {
      mode: 'resize',
      id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      orig: { x: el.x, y: el.y, width: el.width, height: el.height },
      scale: getScale(),
      moved: false,
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const scale = drag.scale || 1
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD) {
      drag.moved = true
    }

    if (drag.mode === 'move') {
      const maxX = CANVAS_W - 24
      const maxY = CANVAS_H - 24
      updateElement(drag.id, {
        x: Math.round(Math.min(maxX, Math.max(0, drag.origX + dx / scale))),
        y: Math.round(Math.min(maxY, Math.max(0, drag.origY + dy / scale))),
      })
      return
    }

    const next = applyResize(drag.handle, drag.orig, dx / scale, dy / scale)
    updateElement(drag.id, next)
  }

  const handlePointerUp = async () => {
    const drag = dragRef.current
    if (!drag) return
    const el = elements.find((x) => x.id === drag.id)
    dragRef.current = null

    if (!drag.moved && el) {
      tryNavigateElement(el)
      return
    }

    try {
      await onSave(elementsRef.current)
    } catch {
      /* parent */
    }
  }

  const insertComponent = (type: LayoutElementType, at?: { x: number; y: number }) => {
    setPickerOpen(false)
    const el = createLayoutElement(type)
    const point = at ?? { x: CANVAS_W / 2, y: CANVAS_H * 0.65 }
    const pos = clampElementPosition(el, point.x, point.y)
    commitElement({ ...el, x: pos.x, y: pos.y })
  }

  const placeElementFromDrop = (type: LayoutElementType, clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { x, y } = canvasCoordsFromClient(clientX, clientY, canvas)
    insertComponent(type, { x, y })
  }

  const allowComponentDrop = (e: React.DragEvent) => {
    if (!isLayoutElementDrag(e.dataTransfer)) return false
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    return true
  }

  const handleCanvasDragEnter = (e: React.DragEvent) => {
    if (allowComponentDrop(e)) setCanvasDragOver(true)
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (allowComponentDrop(e)) setCanvasDragOver(true)
  }

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null
    if (!related || !e.currentTarget.contains(related)) {
      setCanvasDragOver(false)
    }
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    if (!isLayoutElementDrag(e.dataTransfer)) return
    e.preventDefault()
    e.stopPropagation()
    setCanvasDragOver(false)
    const type = parseLayoutElementDrag(e.dataTransfer)
    if (!type) return
    placeElementFromDrop(type, e.clientX, e.clientY)
  }

  const canvasDropHandlers = {
    onDragEnterCapture: handleCanvasDragEnter,
    onDragOverCapture: handleCanvasDragOver,
    onDragLeaveCapture: handleCanvasDragLeave,
    onDropCapture: handleCanvasDrop,
  }

  const duplicateSelected = () => {
    if (!selectedElement) return
    commitElement(duplicateLayoutElement(selectedElement))
  }

  const removeSelected = () => {
    if (!selectedId) return
    pushElements(elements.filter((e) => e.id !== selectedId))
    setSelectedId(null)
  }

  return (
    <div className="admin-layout-editor">
      <div className="admin-layout-editor-toolbar">
        {!showDesignerRail ? (
          <button
            type="button"
            className="admin-btn admin-btn--small admin-btn--primary"
            onClick={() => setPickerOpen(true)}
          >
            + Add element
          </button>
        ) : null}
        <button
          type="button"
          className="admin-btn admin-btn--small admin-btn--primary"
          disabled={saving}
          onClick={() => void onSave(elements)}
        >
          {saving ? 'Saving…' : 'Save layout'}
        </button>
      </div>

      {!showDesignerRail ? (
        <ElementPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={insertComponent} />
      ) : null}

      <ElementContentModal
        open={contentSetup != null && contentSetup.element.type !== 'carousel'}
        element={contentSetup?.element ?? null}
        isNew={contentSetup?.isNew ?? false}
        screens={screens}
        questionOptions={effectiveQuestionOptions}
        onClose={() => setContentSetup(null)}
        onSave={(el) => {
          commitElement(el)
          setContentSetup(null)
        }}
        onOpenCarouselEditor={() => {
          if (contentSetup?.element) {
            setCarouselDraft(contentSetup.element)
            setContentSetup(null)
          }
        }}
      />

      <CarouselEditorModal
        open={carouselDraft != null}
        items={carouselDraft?.carouselItems ?? []}
        onClose={() => setCarouselDraft(null)}
        onSave={(carouselItems) => {
          if (!carouselDraft) return
          const el = { ...carouselDraft, carouselItems }
          commitElement(el)
          setCarouselDraft(null)
        }}
      />

      <div
        className={`admin-layout-workspace${showDesignerRail ? ' admin-layout-workspace--with-rail' : ''}`}
      >
        <LayoutElementInspector
          element={selectedElement}
          screens={screens}
          questionOptions={effectiveQuestionOptions}
          screenBackground={screenBackground}
          onScreenBackgroundChange={onScreenBackgroundChange}
          quizId={quizId}
          customFont={customFont}
          onQuizFontUpdated={onQuizFontUpdated}
          onUpdate={(patch) => {
            if (!selectedId) return
            updateElement(selectedId, patch)
          }}
          onDuplicate={selectedElement ? duplicateSelected : undefined}
          onRemove={removeSelected}
          onOpenContentEditor={
            selectedElement
              ? () => openElementSetup(selectedElement, false)
              : undefined
          }
          onOpenCarouselEditor={
            selectedElement?.type === 'carousel'
              ? () => openElementSetup(selectedElement, false)
              : undefined
          }
        />

        {showDesignerRail ? (
          <div className="admin-designer-stage">
            <p className="admin-muted admin-layout-editor-hint admin-designer-stage-hint">
              Drag or double-click components to add · Double-click an element on screen to edit
            </p>
            <div
              className="admin-designer-stage-body"
              style={{ ['--admin-designer-phone-h' as string]: `${CANVAS_H}px` }}
            >
              <div className="admin-layout-canvas-col">
                <div
                  ref={canvasRef}
                  className={`admin-layout-canvas${canvasDragOver ? ' is-drop-target' : ''}`}
                  style={{ width: CANVAS_W, height: CANVAS_H }}
                  onClick={() => setSelectedId(null)}
                  {...canvasDropHandlers}
                  onPointerMove={handlePointerMove}
                  onPointerUp={() => void handlePointerUp()}
                  onPointerCancel={() => {
                    dragRef.current = null
                  }}
                >
                  <LayoutCanvasLayers
                    customFont={customFont}
                    elements={elements}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onMoveStart={handleMoveStart}
                    onResizeStart={handleResizeStart}
                    openElementSetup={openElementSetup}
                    languages={languages}
                    previewLanguage={previewLanguage}
                  >
                    {children}
                  </LayoutCanvasLayers>
                </div>
              </div>
              <DesignerSideRail onInsertComponent={(type) => insertComponent(type)} />
            </div>
          </div>
        ) : (
          <div className="admin-layout-canvas-col">
            <p className="admin-muted admin-layout-editor-hint">
              New elements open the content editor first · Then use the Layout panel for position &amp;
              size · Double-click to edit content again
            </p>
            <div
              ref={canvasRef}
              className="admin-layout-canvas"
              style={{ width: CANVAS_W, height: CANVAS_H }}
              onClick={() => setSelectedId(null)}
              onPointerMove={handlePointerMove}
              onPointerUp={() => void handlePointerUp()}
              onPointerCancel={() => {
                dragRef.current = null
              }}
            >
              <LayoutCanvasLayers
                customFont={customFont}
                elements={elements}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMoveStart={handleMoveStart}
                onResizeStart={handleResizeStart}
                openElementSetup={openElementSetup}
                languages={languages}
                previewLanguage={previewLanguage}
              >
                {children}
              </LayoutCanvasLayers>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
