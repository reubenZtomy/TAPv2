import React from 'react'
import { RESIZE_HANDLES, type ResizeHandle } from '../layoutResize'

type LayoutResizeHandlesProps = {
  onResizeStart: (handle: ResizeHandle, e: React.PointerEvent) => void
}

export function LayoutResizeHandles({ onResizeStart }: LayoutResizeHandlesProps) {
  return (
    <>
      {RESIZE_HANDLES.map((handle) => (
        <div
          key={handle}
          className={`admin-resize-handle admin-resize-handle--${handle}`}
          onPointerDown={(e) => {
            e.stopPropagation()
            onResizeStart(handle, e)
          }}
        />
      ))}
    </>
  )
}
