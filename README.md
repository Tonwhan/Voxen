# Voxen

> AI-powered CAD generator that produces assembly-aware 3D models as discrete, labeled parts — not a single mesh blob. Powered by AMD MI300X with Qwen3-8B.

**🏆 AMD AI Developers Hackathon 2026 · Oryxenlab**

---

## Overview

Most AI-to-3D tools output a single undifferentiated mesh. Voxen is different: it generates **assembly-aware models** where every part is named, dimensioned, material-annotated, and independently exportable. The result is a model you can actually use in downstream CAD workflows — not just a blob to look at.

The system accepts a natural language description, runs it through an LLM agent on AMD MI300X, validates the output with Zod, and renders each part as a distinct 3D object with full interactive inspection.

---

## Features

- 🎯 **Part-aware Generation** — LLM generates each component as a separate object with name, dimensions, and material
- 🖱️ **Interactive 3D Inspection** — Click any part to isolate it; others fade to wireframe
- 📤 **CAD-ready Export** — Export as STL, OBJ, or STEP for use in Fusion 360, Blender, SolidWorks
- 🎮 **Free Camera Controls** — Orbit, zoom, and quick-view presets (Front/Top/Side/Iso)
- ✅ **Zod Validation** — All AI outputs validated before rendering
- ⚡ **AMD MI300X Powered** — Fast inference on cutting-edge GPU hardware

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server & client rendering |
| Language | TypeScript | Type-safe development |
| UI Library | Shadcn UI | Component library |
| Styling | Tailwind CSS | Utility-first styling |
| 3D Rendering | React Three Fiber (R3F) | React renderer for Three.js |
| 3D Helpers | @react-three/drei | OrbitControls, Edges, Gizmo |
| Validation | Zod | JSON schema validation |
| AI Backend | Flask (Python) | API server |
| LLM | Qwen3-8B-Instruct | Structured CAD generation |
| GPU | AMD MI300X | LLM inference via vLLM |
| Auth | Clerk | Authentication & user management |
| Hosting | Vercel | Frontend deployment |
| VCS | GitHub | Source control |

---

## Stack Diagram
![Stack Diagram](/public/docs/voxen-diagram.png)

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
Export STEP / STL / OBJ
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
│   ├── home/                   # Homepage sections
│   ├── workspace/              # Generator page
│   ├── viewer/                 # R3F canvas + controls
│   │   ├── SceneRenderer.tsx   # R3F Canvas + lighting
│   │   ├── PartMesh.tsx        # Per-part mesh + wireframe toggle
│   │   ├── PartSelector.tsx    # Click-to-select raycasting
│   │   └── QuickActions.tsx    # Gizmo view presets
│   └── ui/                     # Shadcn UI components
├── lib/
│   ├── schemas/                # Zod schemas for part JSON
│   │   └── assembly.ts
│   ├── api/                    # API wrappers
│   │   └── generate.ts
│   └── export/                 # STL / OBJ / STEP exporters
├── types/
│   └── assembly.ts             # TypeScript types from Zod
├── backend/                    # Flask AI agent
│   ├── app.py
│   ├── agent/
│   │   ├── llm_client.py       # Qwen3-8B on AMD MI300X via vLLM
│   │   └── prompt_builder.py
│   └── validators/
│       └── assembly_schema.py  # Pydantic mirror of Zod schema
└── __tests__/                  # Vitest + React Testing Library
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Clerk account
- AMD MI300X endpoint (or OpenAI-compatible vLLM server)

### Installation

```bash
# Clone repository
git clone https://github.com/oryxenlab/voxen.git
cd voxen

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### Environment Variables

Create `.env.local` in project root:

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Flask Backend
FLASK_API_URL=http://localhost:5000

# AMD MI300X / Qwen3
LLM_API_BASE_URL=https://your-mi300x-endpoint
LLM_API_KEY=your_api_key
LLM_MODEL=Qwen/Qwen3-8B-Instruct
```

See `.env.example` for detailed comments on each variable.

### Development

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
cd backend
python app.py
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:5000`

### Testing

```bash
# Run all tests
npm run test

# Backend tests
cd backend && pytest
```

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

| Format | Use Case |
|---|---|
| **STL** | 3D printing, rapid prototyping |
| **OBJ** | Blender, Cinema 4D, mesh editing |
| **STEP** | Fusion 360, CATIA, SolidWorks |

---

## Roadmap

- [ ] Multi-turn prompt refinement (iterative editing)
- [ ] Constraint-based assembly (snap joints, axis alignment)
- [ ] Parametric dimension editing in-browser
- [ ] BOM (bill of materials) export
- [ ] Fine-tuned Qwen3 on CAD-specific dataset
- [ ] Collaborative workspaces

---

## Team

**Oryxenlab** — AMD AI Developers Hackathon 2026

---

## License

MIT