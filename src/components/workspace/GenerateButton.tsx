import { Button } from '@/components/ui/button';

type GenerateButtonProps = {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
};

/**
 * Button to trigger the 3D generation. Shows a loading state.
 */
export function GenerateButton({ onClick, isLoading, disabled = false }: GenerateButtonProps) {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled || isLoading}
      className="w-full bg-accent hover:bg-accent-hover text-white font-medium"
    >
      {isLoading ? "Generating..." : "Generate CAD"}
    </Button>
  );
}
