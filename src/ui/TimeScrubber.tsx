import type { TimeScrubberProps } from './types'

export default function TimeScrubber({ jdTdb, minJd, maxJd, onJdChange }: TimeScrubberProps) {
  return (
    <input
      type="range"
      className="ui-time-scrubber"
      aria-label="Time scrubber"
      min={minJd}
      max={maxJd}
      step={1}
      value={jdTdb}
      onChange={(e) => onJdChange(Number(e.currentTarget.value))}
    />
  )
}
