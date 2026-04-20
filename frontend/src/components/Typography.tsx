import React from 'react'

type TextProps = {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
  color?: string
  className?: string
  style?: React.CSSProperties
}

export function Title({ children, align = 'center', className, style }: TextProps) {
  return (
    <h1
      className={['typo-title', className].filter(Boolean).join(' ')}
      style={{ textAlign: align, ...style }}
    >
      {children}
    </h1>
  )
}

export function Subtitle({ children, align = 'center', className, style }: TextProps) {
  return (
    <p
      className={['typo-subtitle', className].filter(Boolean).join(' ')}
      style={{ textAlign: align, ...style }}
    >
      {children}
    </p>
  )
}

export function Body({ children, align = 'left', className, style }: TextProps) {
  return (
    <p
      className={['typo-body', className].filter(Boolean).join(' ')}
      style={{ textAlign: align, ...style }}
    >
      {children}
    </p>
  )
}
