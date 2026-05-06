import type { SliderProps } from './types'

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
  testId,
}: SliderProps) {
  const display = format ? format(value) : value.toString()
  return (
    <label className="ui-slider">
      <span className="ui-slider__label">
        {label} <strong data-testid={testId}>{display}</strong>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
    </label>
  )
}
