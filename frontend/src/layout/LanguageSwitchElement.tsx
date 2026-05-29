import React from 'react'
import type { LayoutElement, TextAlign } from '../admin/layoutTypes'

type LanguageSwitchElementProps = {
  element: LayoutElement
  languages: string[]
  languageLabels?: Record<string, string>
  selectedLanguage: string
  onLanguageChange?: (language: string) => void
  preview?: boolean
}

function rowJustify(align?: TextAlign): React.CSSProperties['justifyContent'] {
  if (align === 'left') return 'flex-start'
  if (align === 'right') return 'flex-end'
  return 'center'
}

export function LanguageSwitchElement({
  element,
  languages,
  languageLabels,
  selectedLanguage,
  onLanguageChange,
  preview = false,
}: LanguageSwitchElementProps) {
  const labelFor = (code: string) => languageLabels?.[code] || code

  return (
    <div
      className="ql-el-language-switch"
      style={{ justifyContent: rowJustify(element.textAlign) }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <select
        className="ql-language-switch-select"
        aria-label="Select language"
        value={selectedLanguage}
        disabled={preview || languages.length <= 1}
        onChange={(e) => onLanguageChange?.(e.target.value)}
        style={{
          width: '100%',
          height: '100%',
          fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
          color: element.color,
          backgroundColor: element.backgroundColor,
          borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
          borderWidth: element.borderWidth != null ? `${element.borderWidth}px` : undefined,
          borderColor: element.borderColor,
          borderStyle: element.borderWidth ? 'solid' : undefined,
        }}
      >
        {languages.map((language) => (
          <option key={language} value={language}>
            {labelFor(language)}
          </option>
        ))}
      </select>
    </div>
  )
}
