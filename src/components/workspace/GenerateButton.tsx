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
      className={`w-full font-medium duration-600 transition-all ${
        isLoading 
          ? "bg-accent/50 cursor-not-allowed" 
          : "bg-accent hover:bg-accent-hover text-white"
      }`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>AI Processing...</span>
        </div>
      ) : (
        "Generate CAD"
      )}
    </Button>
  );
}
