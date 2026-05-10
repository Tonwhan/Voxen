import { z } from "zod"
import { PartSchema } from "../schemas/assembly"

type Part = z.infer<typeof PartSchema>

/**
 * Generates an ASCII STL file from a given assembly of parts,
 * correctly reading geometry.dimensions from AI-generated data.
 */
export function exportSTL(parts: Part[]): string {
  let stl = "solid voxen_assembly\n"
  parts.forEach((part) => {
    const { type, dimensions: d } = part.geometry
    const [px, py, pz] = part.position

    if (type === "gear") {
      stl += generateGearSTL(part, px, py, pz)
    } else if (type === "cylinder") {
      const r = (d.radius ?? d.width ?? 25) / 2
      const h = d.height ?? 50
      stl += generateCylinderSTL(px, py, pz, r, h, part.name)
    } else {
      // box (default)
      const w = d.width ?? 50
      const ht = d.height ?? 50
      const dep = d.depth ?? 50
      stl += generateBoxSTL(px, py, pz, w, ht, dep)
    }
  })
  stl += "endsolid voxen_assembly\n"
  return stl
}

function facet(n: number[], v0: number[], v1: number[], v2: number[]): string {
  return (
    `  facet normal ${n[0]} ${n[1]} ${n[2]}\n    outer loop\n` +
    `      vertex ${v0[0]} ${v0[1]} ${v0[2]}\n` +
    `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n` +
    `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n` +
    `    endloop\n  endfacet\n`
  )
}

function generateBoxSTL(px: number, py: number, pz: number, w: number, h: number, d: number): string {
  const hx = w / 2, hy = h / 2, hz = d / 2
  const v = [
    [px - hx, py - hy, pz - hz], [px + hx, py - hy, pz - hz],
    [px + hx, py + hy, pz - hz], [px - hx, py + hy, pz - hz],
    [px - hx, py - hy, pz + hz], [px + hx, py - hy, pz + hz],
    [px + hx, py + hy, pz + hz], [px - hx, py + hy, pz + hz],
  ]
  const faces = [
    [[0,3,1],[0,0,-1]], [[1,3,2],[0,0,-1]],
    [[4,5,7],[0,0,1]],  [[5,6,7],[0,0,1]],
    [[0,1,4],[0,-1,0]], [[1,5,4],[0,-1,0]],
    [[1,2,5],[1,0,0]],  [[2,6,5],[1,0,0]],
    [[2,3,6],[0,1,0]],  [[3,7,6],[0,1,0]],
    [[3,0,7],[-1,0,0]], [[0,4,7],[-1,0,0]],
  ]
  return faces.map(([f, n]) => facet(n as number[], v[f[0] as number], v[f[1] as number], v[f[2] as number])).join("")
}

function generateCylinderSTL(px: number, py: number, pz: number, r: number, h: number, _name: string): string {
  const segs = 32
  let out = ""
  const bot = [px, py - h / 2, pz]
  const top = [px, py + h / 2, pz]
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2
    const a1 = ((i + 1) / segs) * Math.PI * 2
    const b0 = [px + Math.cos(a0) * r, py - h / 2, pz + Math.sin(a0) * r]
    const b1 = [px + Math.cos(a1) * r, py - h / 2, pz + Math.sin(a1) * r]
    const t0 = [px + Math.cos(a0) * r, py + h / 2, pz + Math.sin(a0) * r]
    const t1 = [px + Math.cos(a1) * r, py + h / 2, pz + Math.sin(a1) * r]
    out += facet([0, -1, 0], bot, b1, b0)
    out += facet([0, 1, 0], top, t0, t1)
    const nx = Math.cos((a0 + a1) / 2), nz = Math.sin((a0 + a1) / 2)
    out += facet([nx, 0, nz], b0, b1, t0)
    out += facet([nx, 0, nz], b1, t1, t0)
  }
  return out
}

function generateGearSTL(part: Part, px: number, py: number, pz: number): string {
  const d = part.geometry.dimensions
  const teeth = d.teeth ?? 24
  const module = d.module ?? 3
  const height = d.height ?? 15
  const bore = d.bore ?? 20

  const pr = (module * teeth) / 2
  const or = pr + module
  const rr = pr - 1.25 * module
  const step = (Math.PI * 2) / teeth
  const ha = (Math.PI / teeth) * 0.4

  // Build tooth profile points (2D)
  const pts2d: [number, number][] = []
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    pts2d.push([rr * Math.cos(a - ha * 1.2), rr * Math.sin(a - ha * 1.2)])
    pts2d.push([pr * Math.cos(a - ha),        pr * Math.sin(a - ha)])
    pts2d.push([or * Math.cos(a),              or * Math.sin(a)])
    pts2d.push([pr * Math.cos(a + ha),        pr * Math.sin(a + ha)])
    pts2d.push([rr * Math.cos(a + ha * 1.2), rr * Math.sin(a + ha * 1.2)])
  }

  const n = pts2d.length
  const bot = py - height / 2
  const top = py + height / 2
  let out = ""

  // Side wall quads
  for (let i = 0; i < n; i++) {
    const [x0, z0] = pts2d[i]
    const [x1, z1] = pts2d[(i + 1) % n]
    const v0 = [px + x0, bot, pz + z0]
    const v1 = [px + x1, bot, pz + z1]
    const v2 = [px + x1, top, pz + z1]
    const v3 = [px + x0, top, pz + z0]
    out += facet([0, 0, 1], v0, v1, v2)
    out += facet([0, 0, 1], v0, v2, v3)
  }

  // Top and bottom caps (fan from center, approximate bore)
  const boreR = bore / 2
  const boreSegs = 32
  for (let i = 0; i < n; i++) {
    const [x0, z0] = pts2d[i]
    const [x1, z1] = pts2d[(i + 1) % n]
    out += facet([0, -1, 0], [px, bot, pz], [px + x0, bot, pz + z0], [px + x1, bot, pz + z1])
    out += facet([0, 1, 0],  [px, top, pz], [px + x1, top, pz + z1], [px + x0, top, pz + z0])
  }

  // Bore hole (cylinder subtracted as separate shell)
  for (let i = 0; i < boreSegs; i++) {
    const a0 = (i / boreSegs) * Math.PI * 2
    const a1 = ((i + 1) / boreSegs) * Math.PI * 2
    const bx0 = px + Math.cos(a0) * boreR, bz0 = pz + Math.sin(a0) * boreR
    const bx1 = px + Math.cos(a1) * boreR, bz1 = pz + Math.sin(a1) * boreR
    out += facet([0, -1, 0], [px, bot, pz], [bx1, bot, bz1], [bx0, bot, bz0])
    out += facet([0, 1, 0],  [px, top, pz], [bx0, top, bz0], [bx1, top, bz1])
    out += facet([-Math.cos((a0+a1)/2), 0, -Math.sin((a0+a1)/2)],
      [bx0, bot, bz0], [bx1, top, bz1], [bx0, top, bz0])
    out += facet([-Math.cos((a0+a1)/2), 0, -Math.sin((a0+a1)/2)],
      [bx0, bot, bz0], [bx1, bot, bz1], [bx1, top, bz1])
  }

  return out
}
