import { AssemblySchema } from '@/lib/schemas/assembly';
import { Assembly } from '@/types/assembly';

export type GenerateErrorCode = 
  | 'VALIDATION_ERROR' 
  | 'LLM_ERROR' 
  | 'TIMEOUT' 
  | 'NETWORK_ERROR'
  | 'INTENT_NOT_FOUND'
  | 'LLM_GENERATION_FAILED'
  | 'SCHEMA_VALIDATION_FAILED';

export type GenerateResponse = 
  | { success: true; data: Assembly }
  | { success: false; error: string; code: GenerateErrorCode };

// [REQUIRED] generateAssembly
// What: Fetches generated 3D assembly from the Flask backend and validates it with Zod
// Where: Client-side API utility

/**
 * Calls the backend Flask API to generate a 3D assembly from a text prompt.
 * Always parses the response with Zod before returning.
 * 
 * @param prompt - The user's text description of the CAD model.
 */
export async function generateAssembly(prompt: string): Promise<GenerateResponse> {
  // CONNECTS TO: Flask AI Backend (POST /generate)
  // PURPOSE: sends prompt to Qwen3-8B and receives validated assembly JSON
  // RETURNS: AssemblySchema { assemblyName, parts[], metadata }
  // ERRORS: VALIDATION_ERROR (invalid JSON), LLM_ERROR (model failed), TIMEOUT (>60s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for slow CPU inference

  try {
    // Direct connection to Flask backend to bypass Next.js dev proxy timeouts
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000/generate' 
      : '/api/generate';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.error || `HTTP Error ${response.status}`,
        code: (errorData?.code as GenerateErrorCode) || 'NETWORK_ERROR',
      };
    }

    const json = await response.json();
    
    // Validate with Zod
    const parsed = AssemblySchema.safeParse(json);
    
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.message,
        code: 'VALIDATION_ERROR',
      };
    }

    return {
      success: true,
      data: parsed.data,
    };
    
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: 'The request took too long to complete.',
        code: 'TIMEOUT',
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unknown network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}
