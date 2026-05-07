# Voxen

> AI-powered CAD generator that produces assembly-aware 3D models as discrete, labeled parts — not a single mesh blob. Prompt-to-part pipeline powered by AMD MI300X. Outputs validated JSON (Zod), rendered live in React Three Fiber, exported as STEP / STL / OBJ.

**🏆 AMD AI Developers Hackathon 2026 · Oryxenlab**

---

## Overview

Most AI-to-3D tools output a single undifferentiated mesh. Voxen is different: it generates **assembly-aware models** where every part is named, dimensioned, material-annotated, and independently exportable. The result is a model you can actually use in downstream CAD workflows — not just a blob to look at.

The system accepts a natural language description, runs it through an LLM agent on AMD MI300X, validates the output with Zod, and renders each part as a distinct 3D object with full interactive inspection.

---

## Demo

- Toggle individual parts on/off in the 3D viewer
- Click any part to inspect dimensions, material recommendation, and AI design intent
- Unfocused parts render as wireframes
- Free-camera orbit via scroll/drag; quick-view presets: Front / Top / Side / Iso
- Export selected part or full assembly as **STL**, **OBJ**, or **STEP**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 |
| Language | TypeScript |
| UI Library | Shadcn UI |
| Styling | Tailwind CSS |
| 3D Rendering | React Three Fiber (R3F) |
| 3D Helpers | @react-three/drei |
| Validation | Zod |
| AI Backend | Flask (Python) |
| LLM Inference | Qwen3-8B on AMD MI300X |
| Auth | Clerk |
| File Storage | Supabase Storage |
| Hosting | Vercel (Edge CDN) |
| VCS | GitHub |

---

## Architecture

```
Client (Browser)
    ↓
Next.js 16 Frontend  ←→  Clerk (Auth)
    ↓
Flask API (Python)
    ↓
Qwen3-8B on AMD MI300X
    ↓ generates
Zod-validated JSON (parts + metadata)
    ↓
React Three Fiber renders parts + Dashboard
    ↓
Export STEP / STL / OBJ  →  Supabase Storage
```

**Data flow:** User prompt → Flask receives request → Qwen3-8B generates structured part JSON → Zod validates schema → response sent to frontend → R3F renders each part as a discrete mesh → user inspects/exports individual parts.

---

## Project Structure

```
voxen/
├── app/                        # Next.js 16 app router
│   ├── (auth)/                 # Clerk-protected routes
│   ├── api/                    # Next.js API route handlers
│   │   └── generate/           # Proxy to Flask AI backend
│   ├── workspace/              # Main 3D CAD viewer page
│   └── layout.tsx
├── components/
│   ├── viewer/                 # R3F canvas + controls
│   │   ├── SceneRenderer.tsx   # R3F Canvas + lighting
│   │   ├── PartMesh.tsx        # Per-part mesh + wireframe toggle
│   │   ├── PartSelector.tsx    # Click-to-select raycasting
│   │   └── QuickActions.tsx    # Gizmo view presets
│   └── ui/                     # Shadcn UI components
├── lib/
│   ├── schemas/                # Zod schemas for part JSON
│   │   └── assembly.ts
│   └── export/                 # STL / OBJ / STEP exporters
├── backend/                    # Flask AI agent
│   ├── app.py
│   ├── agent/
│   │   ├── llm_client.py       # Qwen3-8B on AMD MI300X via vLLM
│   │   └── prompt_builder.py
│   └── validators/
│       └── assembly_schema.py  # Pydantic mirror of Zod schema
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Clerk application
- AMD MI300X endpoint (or compatible OpenAI-format API)

### Installation

```bash
# Clone the repository
git clone https://github.com/oryxenlab/voxen.git
cd voxen

# Install frontend dependencies
npm install

# Install Python backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Flask AI Backend
FLASK_API_URL=http://localhost:5000

# AMD MI300X / Qwen3
LLM_API_BASE_URL=https://...
LLM_API_KEY=...
LLM_MODEL=Qwen/Qwen3-8B-Instruct
```

### Development

```bash
# Start Next.js frontend
npm run dev

# Start Flask backend (separate terminal)
cd backend
python app.py
```

Frontend runs at `http://localhost:3000`, Flask backend at `http://localhost:5000`.

---

## Part JSON Schema (Zod)

Every model the AI generates is validated against this schema before being sent to the renderer:

```typescript
import { z } from 'zod'

const PartSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  geometry: z.object({
    type: z.enum(['box', 'cylinder', 'sphere', 'custom']),
    dimensions: z.object({
      width: z.number().positive(),
      height: z.number().positive(),
      depth: z.number().positive(),
    }),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  }),
  material: z.object({
    name: z.string(),
    description: z.string(),
  }),
  designIntent: z.string(),
  exportFormats: z.array(z.enum(['STL', 'OBJ', 'STEP'])),
})

export const AssemblySchema = z.object({
  assemblyName: z.string(),
  version: z.string(),
  parts: z.array(PartSchema).min(1),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    promptSummary: z.string(),
  }),
})
```

---

## Export Formats

| Format | Use case |
|---|---|
| **STL** | 3D printing, rapid prototyping |
| **OBJ** | Blender, Cinema 4D, general mesh editing |
| **STEP** | Professional CAD (Fusion 360, CATIA, SolidWorks) |

Exports are per-part or full-assembly, stored in Supabase Storage.

---

## Roadmap

- [ ] Multi-turn prompt refinement (iterative assembly editing)
- [ ] Constraint-based assembly (snap joints, axis alignment)
- [ ] Parametric dimension editing in-browser
- [ ] BOM (bill of materials) export
- [ ] Fine-tuned Qwen3 on CAD-specific dataset
- [ ] Collaborative workspaces

---

## Team

**Oryxenlab** — AMD AI Developers Hackathon 2026
