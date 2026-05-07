import { describe, it, expect } from 'vitest';
import { AssemblySchema } from '@/lib/schemas/assembly';

describe('AssemblySchema', () => {
  it('should parse valid assembly', () => {
    const validData = {
      assemblyName: "Test Car",
      version: "1.0",
      parts: [
        {
          id: "part-1",
          name: "Wheel",
          shape: "cylinder",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#FF0000",
          geometry: {
            type: "cylinder",
            dimensions: { width: 1, height: 1, depth: 1 }
          },
          material: {
            name: "Steel",
            description: "High-grade carbon steel"
          },
          designIntent: "Standard car wheel"
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        promptSummary: "A red car wheel"
      }
    };
    
    const result = AssemblySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail on missing parts array', () => {
    const invalidData = {
      assemblyName: "Test Car",
      version: "1.0",
      metadata: {
        generatedAt: new Date().toISOString(),
        promptSummary: "A red car wheel"
      }
    };
    
    const result = AssemblySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail on invalid color hex', () => {
    const invalidData = {
      assemblyName: "Test Car",
      version: "1.0",
      parts: [
        {
          id: "part-1",
          name: "Wheel",
          shape: "cylinder",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "red", // Invalid hex
          geometry: {
            type: "cylinder",
            dimensions: { width: 1, height: 1, depth: 1 }
          },
          material: {
            name: "Steel",
            description: "High-grade carbon steel"
          },
          designIntent: "Standard car wheel"
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        promptSummary: "A red car wheel"
      }
    };
    
    const result = AssemblySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be a valid hex color");
    }
  });

  it('should fail on empty parts array', () => {
    const invalidData = {
      assemblyName: "Test Car",
      version: "1.0",
      parts: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        promptSummary: "A red car wheel"
      }
    };
    
    const result = AssemblySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Assembly must have at least one part");
    }
  });
});
