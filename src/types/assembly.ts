import { z } from 'zod';
import { AssemblySchema, PartSchema, AssemblyMetadataSchema } from '@/lib/schemas/assembly';

export type Part = z.infer<typeof PartSchema>;
export type AssemblyMetadata = z.infer<typeof AssemblyMetadataSchema>;
export type Assembly = z.infer<typeof AssemblySchema>;
