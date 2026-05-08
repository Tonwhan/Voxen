import { ChangeEvent } from 'react';

type PromptInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
};

/**
 * Textarea component for "user" to input CAD assembly prompts.
 */
export function PromptInput({ value, onChange, disabled = false }: PromptInputProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label htmlFor="prompt" className="text-sm font-medium text-text">
        Describe your 3D Assembly
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="e.g. A four-wheeled rover with a cylinder body..."
        className="transition-all duration-300 focus:ring-2 min-h-30 w-full resize-none rounded-md bg-surface border border-border pl-3 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 scrollbar-thin scrollbar-thumb-soft scrollbar-track-transparent"
      />
    </div>
  );
}
