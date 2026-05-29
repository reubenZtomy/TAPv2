import React, { useEffect } from 'react'
import { injectQuizCustomFont, layoutFontFamilyCss, type QuizCustomFont } from '../utils/quizFont'

type QuizLayoutFontRootProps = {
  customFont?: QuizCustomFont | null
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export function QuizLayoutFontRoot({
  customFont,
  className,
  style,
  children,
}: QuizLayoutFontRootProps) {
  useEffect(() => {
    injectQuizCustomFont(customFont)
    return () => injectQuizCustomFont(null)
  }, [customFont])

  const fontCss = layoutFontFamilyCss(customFont)

  return (
    <div
      className={className}
      style={{
        ...style,
        ...(fontCss ? ({ '--quiz-layout-font': fontCss } as React.CSSProperties) : {}),
      }}
    >
      {children}
    </div>
  )
}
