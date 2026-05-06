import type { ButtonProps } from './types'

export default function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  ariaLabel,
  testId,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`ui-button ui-button--${variant}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </button>
  )
}
