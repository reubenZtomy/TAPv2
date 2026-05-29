import { CANVAS_H, CANVAS_W, MIN_ELEMENT_SIZE } from './layoutTypes'

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export function applyResize(
  handle: ResizeHandle,
  orig: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number
): { x: number; y: number; width: number; height: number } {
  let { x, y, width, height } = orig

  if (handle.includes('e')) {
    width = Math.max(MIN_ELEMENT_SIZE, orig.width + dx)
  }
  if (handle.includes('w')) {
    const nextW = Math.max(MIN_ELEMENT_SIZE, orig.width - dx)
    x = orig.x + (orig.width - nextW)
    width = nextW
  }
  if (handle.includes('s')) {
    height = Math.max(MIN_ELEMENT_SIZE, orig.height + dy)
  }
  if (handle.includes('n')) {
    const nextH = Math.max(MIN_ELEMENT_SIZE, orig.height - dy)
    y = orig.y + (orig.height - nextH)
    height = nextH
  }

  x = Math.round(Math.max(0, Math.min(x, CANVAS_W - MIN_ELEMENT_SIZE)))
  y = Math.round(Math.max(0, Math.min(y, CANVAS_H - MIN_ELEMENT_SIZE)))
  width = Math.round(Math.min(width, CANVAS_W - x))
  height = Math.round(Math.min(height, CANVAS_H - y))

  return { x, y, width, height }
}
