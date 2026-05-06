# Voxen

> AI-powered CAD generator that produces assembly-aware 3D models as discrete, labeled parts — not a single mesh blob. Prompt-to-part pipeline powered by AMD MI300X. Outputs validated JSON (Zod), rendered live in Three.js, exported as STEP / STL / OBJ.

**AMD AI Developers Hackathon 2026 · Oryxenlab**

---

## Overview

Most AI-to-3D tools output a single undifferentiated mesh. Voxen is different: it generates **assembly-aware models** where every part is named, dimensioned, material-annotated, and independently exportable. The result is a model you can actually use in downstream CAD workflows — not just a blob to look at.

The system accepts a natural language description, runs it through an LLM agent on AMD MI300X, validates the output with Zod, and renders each part as a distinct Three.js object with full interactive inspection.

---

## Demo

- Toggle individual parts on/off in the 3D viewer
- Click any part to inspect dimensions, material recommendation, and AI design intent
- Unfocused parts render as dashed wireframes
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
| 3D Renderer | Three.js |
| Validation | Zod |
| AI Backend | Flask (Python) |
| LLM Inference | AMD MI300X (cloud GPU) |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk |
| File Storage | Cloudflare R2 |
| Email | Resend |
| Hosting | Vercel (Edge CDN) |
| VCS | GitHub |

---

## Architecture

```
Client (Browser)
    ↓
Next.js 16 Frontend  ←→  Clerk (Auth)
    ↓                         ↓
Flask API (Python)       Supabase (PostgreSQL)
    ↓
LLM Agent on AMD MI300X
    ↓ generates
Zod-validated JSON (parts + metadata)
    ↓
Three.js renders parts + Dashboard
    ↓
Export STEP / STL / OBJ  →  Cloudflare R2
```

**Data flow:** User prompt → Flask receives request → LLM generates structured part JSON → Zod validates schema → response sent to frontend → Three.js renders each part as a discrete mesh → user inspects/exports individual parts.

---

## Project Structure

```
oryxen-forge/
├── app/                        # Next.js 16 app router
│   ├── (auth)/                 # Clerk-protected routes
│   ├── api/                    # Next.js API route handlers
│   │   └── generate/           # Proxy to Flask AI backend
│   ├── workspace/              # Main 3D CAD viewer page
│   └── layout.tsx
├── components/
│   ├── viewer/                 # Three.js canvas + controls
│   │   ├── SceneRenderer.tsx
│   │   ├── PartSelector.tsx
│   │   └── QuickActions.tsx
│   └── ui/                     # Shadcn UI components
├── lib/
│   ├── schemas/                # Zod schemas for part JSON
│   │   └── assembly.ts
│   └── export/                 # STL / OBJ / STEP exporters
├── backend/                    # Flask AI agent
│   ├── app.py
│   ├── agent/
│   │   ├── llm_client.py       # AMD MI300X inference
│   │   └── prompt_builder.py
│   └── validators/
│       └── assembly_schema.py
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Supabase project
- Clerk application
- AMD MI300X endpoint (or compatible OpenAI-format API)

### Installation

```bash
# Clone the repository
git clone https://github.com/oryxenlab/oryxen-forge.git
cd oryxen-forge

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

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=oryxen-forge-exports

# AMD MI300X / LLM
LLM_API_BASE_URL=https://...
LLM_API_KEY=...
LLM_MODEL=...

# Resend (optional)
RESEND_API_KEY=re_...
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

Exports are per-part or full-assembly, stored in Cloudflare R2, and linked to the user's account in Supabase.

---

## Roadmap

- [ ] Multi-turn prompt refinement (iterative assembly editing)
- [ ] Constraint-based assembly (snap joints, axis alignment)
- [ ] Parametric dimension editing in-browser
- [ ] BOM (bill of materials) export
- [ ] Collaborative workspaces

---

## Team

**Oryxenlab** — AMD AI Developers Hackathon 2026
