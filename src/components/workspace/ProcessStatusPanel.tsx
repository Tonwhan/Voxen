import React from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

export type ProcessStep = {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
};

type ProcessStatusPanelProps = {
  steps: ProcessStep[];
  isVisible: boolean;
};

/**
 * A panel that shows the current processing steps with micro-animations.
 * Inspired by Claude's code processing/execution style.
 */
export function ProcessStatusPanel({ steps, isVisible }: ProcessStatusPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="bg-background/50 border border-border rounded-md p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">AI Generation Pipeline</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            <div className="shrink-0">
              {step.status === 'completed' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 transition-all duration-300 scale-110" />
              )}
              {step.status === 'processing' && (
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              )}
              {step.status === 'pending' && (
                <Circle className="w-4 h-4 text-border" />
              )}
            </div>
            <span className={`text-xs transition-colors duration-300 ${
              step.status === 'processing' ? 'text-text font-medium' : 
              step.status === 'completed' ? 'text-text-muted' : 
              'text-text-muted/50'
            }`}>
              {step.label}
              {step.status === 'processing' && (
                <span className="ml-1 inline-flex">
                  <span className="animate-[bounce_1s_infinite] delay-0">.</span>
                  <span className="animate-[bounce_1s_infinite] delay-150">.</span>
                  <span className="animate-[bounce_1s_infinite] delay-300">.</span>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
