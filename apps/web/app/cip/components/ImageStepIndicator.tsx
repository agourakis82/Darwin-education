'use client'

import type { ImageInterpretationStep } from '@darwin-education/shared'
import { IMAGE_STEP_LABELS_PT, IMAGE_STEP_ORDER } from '@darwin-education/shared'

interface ImageStepIndicatorProps {
  currentStep: ImageInterpretationStep
  completedSteps?: ImageInterpretationStep[]
}

export function ImageStepIndicator({
  currentStep,
  completedSteps = [],
}: ImageStepIndicatorProps) {
  const currentIndex = IMAGE_STEP_ORDER.indexOf(currentStep)
  const isCompleted = currentStep === 'completed'

  return (
    <div className="flex items-center gap-1 w-full">
      {IMAGE_STEP_ORDER.map((step, index) => {
        const isActive = step === currentStep
        const isDone =
          isCompleted ||
          completedSteps.includes(step) ||
          index < currentIndex

        return (
          <div key={step} className="flex items-center flex-1">
            {/* Step circle + label */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  transition-colors duration-200
                  ${
                    isDone
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {isDone ? '✓' : index + 1}
              </div>
              <span
                className={`text-xs mt-1 text-center ${
                  isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {IMAGE_STEP_LABELS_PT[step]}
              </span>
            </div>

            {/* Connector line */}
            {index < IMAGE_STEP_ORDER.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 -mt-4 ${
                  isDone ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
