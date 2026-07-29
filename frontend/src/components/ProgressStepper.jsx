import './ProgressStepper.css'

const STEPS = [
  { id: 'upload',     label: 'Upload',     icon: '↑' },
  { id: 'processing', label: 'Processing', icon: '⚙' },
  { id: 'results',    label: 'Results',    icon: '✓' },
]

/**
 * Shows the 3-step pipeline progress.
 * @param {{ currentStep: 'upload'|'processing'|'results', error: boolean }} props
 */
export default function ProgressStepper({ currentStep, error = false }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <nav className="stepper" aria-label="Processing steps">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex
        const isActive    = i === currentIndex
        const isFailed    = isActive && error

        return (
          <div key={step.id} className="stepper-item">
            <div
              className={`stepper-circle
                ${isCompleted ? 'stepper-circle--completed' : ''}
                ${isActive && !isFailed ? 'stepper-circle--active' : ''}
                ${isFailed ? 'stepper-circle--error' : ''}
              `}
              aria-current={isActive ? 'step' : undefined}
            >
              {isCompleted ? '✓' : isFailed ? '✕' : step.icon}
              {isActive && !isFailed && (
                <span className="stepper-pulse" aria-hidden="true" />
              )}
            </div>
            <span
              className={`stepper-label
                ${isCompleted ? 'stepper-label--completed' : ''}
                ${isActive ? 'stepper-label--active' : ''}
              `}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`stepper-line ${isCompleted ? 'stepper-line--completed' : ''}`}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
