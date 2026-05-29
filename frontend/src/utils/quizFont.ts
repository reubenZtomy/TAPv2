export type QuizCustomFont = {
  family: string
  url: string
  filename?: string
}

const STYLE_ID_PREFIX = 'asq-quiz-font-'

export function quizFontStyleId(url: string): string {
  return `${STYLE_ID_PREFIX}${url.replace(/[^a-zA-Z0-9]/g, '-')}`
}

export function layoutFontFamilyCss(customFont?: QuizCustomFont | null): string | undefined {
  if (!customFont?.family?.trim()) return undefined
  const family = customFont.family.trim().replace(/'/g, "\\'")
  return `'${family}', system-ui, sans-serif`
}

export function injectQuizCustomFont(customFont: QuizCustomFont | null | undefined): void {
  const styleId = customFont?.url ? quizFontStyleId(customFont.url) : null
  for (const node of Array.from(document.querySelectorAll(`style[id^="${STYLE_ID_PREFIX}"]`))) {
    if (styleId && node.id === styleId) continue
    node.remove()
  }
  if (!customFont?.url || !customFont.family?.trim()) return

  const family = customFont.family.trim().replace(/'/g, "\\'")
  let style = document.getElementById(styleId!) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = styleId!
    document.head.appendChild(style)
  }
  style.textContent = `
@font-face {
  font-family: '${family}';
  src: url('${customFont.url}');
  font-display: swap;
}
`
}
