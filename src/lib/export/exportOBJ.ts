import { z } from "zod"
import { PartSchema } from "../schemas/assembly"

type Part = z.infer<typeof PartSchema>

/**
 * Generates a Wavefront OBJ file from a given assembly of parts,
 * correctly reading geometry.dimensions from AI-generated data.
 */
export function exportOBJ(parts: Part[]): string {
  let obj = "# Voxen Generated Assembly\n"
  let vertexOffset = 1

  parts.forEach((part) => {
    obj += `o ${part.name.replace(/\s+/g, "_")}_${part.id}\n`
    const { type, dimensions: d } = part.geometry
    const [px, py, pz] = part.position

    if (type === "gear") {
      const { verts, faces } = buildGearMesh(part, px, py, pz)
      verts.forEach(v => { obj += `v ${v[0]} ${v[1]} ${v[2]}\n` })
      faces.forEach(f => {
        const fi = f.map(i => i + vertexOffset)
        if (fi.length === 4) obj += `f ${fi[0]} ${fi[1]} ${fi[2]} ${fi[3]}\n`
        else obj += `f ${fi[0]} ${fi[1]} ${fi[2]}\n`
      })
      vertexOffset += verts.length

    } else if (type === "cylinder") {
      const r = (d.radius ?? d.width ?? 25) / 2
      const h = d.height ?? 50
      const { verts, faces } = buildCylinderMesh(px, py, pz, r, h)
      verts.forEach(v => { obj += `v ${v[0]} ${v[1]} ${v[2]}\n` })
      faces.forEach(f => {
        const fi = f.map(i => i + vertexOffset)
        if (fi.length === 4) obj += `f ${fi[0]} ${fi[1]} ${fi[2]} ${fi[3]}\n`
        else obj += `f ${fi[0]} ${fi[1]} ${fi[2]}\n`
      })
      vertexOffset += verts.length

    } else {
      // box
      const w = d.width ?? 50
      const ht = d.height ?? 50
      const dep = d.depth ?? 50
      const { verts, faces } = buildBoxMesh(px, py, pz, w, ht, dep)
      verts.forEach(v => { obj += `v ${v[0]} ${v[1]} ${v[2]}\n` })
      faces.forEach(f => {
        const fi = f.map(i => i + vertexOffset)
        obj += `f ${fi[0]} ${fi[1]} ${fi[2]} ${fi[3]}\n`
      })
      vertexOffset += verts.length
    }
  })

  return obj
}

function buildBoxMesh(px: number, py: number, pz: number, w: number, h: number, d: number) {
  const hx = w / 2, hy = h / 2, hz = d / 2
  const verts: number[][] = [
    [px - hx, py - hy, pz - hz], [px + hx, py - hy, pz - hz],
    [px + hx, py + hy, pz - hz], [px - hx, py + hy, pz - hz],
    [px - hx, py - hy, pz + hz], [px + hx, py - hy, pz + hz],
    [px + hx, py + hy, pz + hz], [px - hx, py + hy, pz + hz],
  ]
  const faces = [
    [0, 3, 2, 1], [4, 5, 6, 7],
    [0, 1, 5, 4], [1, 2, 6, 5],
    [2, 3, 7, 6], [3, 0, 4, 7],
  ]
  return { verts, faces }
}

function buildCylinderMesh(px: number, py: number, pz: number, r: number, h: number, segs = 32) {
  const verts: number[][] = []
  const faces: number[][] = []
  const botCi = 0
  verts.push([px, py - h / 2, pz])
  const topCi = 1
  verts.push([px, py + h / 2, pz])

  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2
    verts.push([px + Math.cos(a) * r, py - h / 2, pz + Math.sin(a) * r])
    verts.push([px + Math.cos(a) * r, py + h / 2, pz + Math.sin(a) * r])
  }

  for (let i = 0; i < segs; i++) {
    const b0 = 2 + i * 2
    const t0 = 2 + i * 2 + 1
    const b1 = 2 + ((i + 1) % segs) * 2
    const t1 = 2 + ((i + 1) % segs) * 2 + 1
    faces.push([botCi, b1, b0])
    faces.push([topCi, t0, t1])
    faces.push([b0, b1, t1, t0])
  }
  return { verts, faces }
}

function buildGearMesh(part: Part, px: number, py: number, pz: number) {
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

  const pts2d: [number, number][] = []
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    pts2d.push([rr * Math.cos(a - ha * 1.2), rr * Math.sin(a - ha * 1.2)])
    pts2d.push([pr * Math.cos(a - ha), pr * Math.sin(a - ha)])
    pts2d.push([or * Math.cos(a), or * Math.sin(a)])
    pts2d.push([pr * Math.cos(a + ha), pr * Math.sin(a + ha)])
    pts2d.push([rr * Math.cos(a + ha * 1.2), rr * Math.sin(a + ha * 1.2)])
  }

  const n = pts2d.length
  const bot = py - height / 2
  const top = py + height / 2
  const verts: number[][] = []
  const faces: number[][] = []

  // Bottom ring + top ring
  for (const [x, z] of pts2d) {
    verts.push([px + x, bot, pz + z])
  }
  for (const [x, z] of pts2d) {
    verts.push([px + x, top, pz + z])
  }

  // Side faces
  for (let i = 0; i < n; i++) {
    const ni = (i + 1) % n
    faces.push([i, ni, n + ni, n + i])
  }

  // Bottom cap fan center
  const botCi = verts.length
  verts.push([px, bot, pz])
  for (let i = 0; i < n; i++) {
    faces.push([botCi, (i + 1) % n, i])
  }

  // Top cap fan center
  const topCi = verts.length
  verts.push([px, top, pz])
  for (let i = 0; i < n; i++) {
    faces.push([topCi, n + i, n + (i + 1) % n])
  }

  return { verts, faces }
}
