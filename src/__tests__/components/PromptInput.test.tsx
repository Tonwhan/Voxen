import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptInput } from '@/components/workspace/PromptInput';

describe('PromptInput', () => {
  it('renders correctly with label and placeholder', () => {
    render(<PromptInput value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Describe your 3D Assembly')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. A four-wheeled rover with a cylinder body...')).toBeDefined();
  });

  it('calls onChange when user types', () => {
    const handleChange = vi.fn();
    render(<PromptInput value="" onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'A red box' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<PromptInput value="" onChange={() => {}} disabled={true} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
  });
});
