'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface UploadStepperProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function UploadStepper({ steps, currentStep, onStepChange }: UploadStepperProps) {
  return (
    <div className="mx-auto w-full max-w-4xl overflow-x-auto pb-2">
      {/* Progress bar */}
      <div className="mb-12">
        <div className="relative h-2 bg-cyan-500/20 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex min-w-[42rem] justify-between md:min-w-0">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              {/* Step indicator */}
              <button
                onClick={() => onStepChange(stepNumber)}
                disabled={stepNumber > currentStep}
                className={cn(
                  'w-12 h-12 rounded-full font-bold text-lg transition-all duration-200 mb-4 relative z-10',
                  isCompleted
                    ? 'bg-cyan-500 text-black glow-cyan'
                    : isActive
                      ? 'bg-purple-500 text-white glow-purple border-2 border-purple-400'
                      : 'bg-gray-700 text-gray-400',
                  stepNumber <= currentStep ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'
                )}
              >
                {isCompleted ? <Check className="w-6 h-6 mx-auto" /> : stepNumber}
              </button>

              {/* Step label */}
              <div className="text-center">
                <p className={cn('text-xs font-semibold sm:text-sm', isActive ? 'text-white' : 'text-gray-400')}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-6 left-1/2 w-[calc(100%-3rem)] h-1 -translate-x-1/2',
                    stepNumber < currentStep
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
                      : 'bg-gray-700'
                  )}
                  style={{
                    width: 'calc(100% - 3rem)',
                    left: '50%',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
