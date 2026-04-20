import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'link'
  fullWidth?: boolean
}

export function Button({ variant = 'primary', fullWidth = false, className, ...props }: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, fullWidth ? 'btn-full' : '', className]
    .filter(Boolean)
    .join(' ')
  return <button {...props} className={classes} />
}
