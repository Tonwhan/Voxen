import { z } from "zod"
import { PartSchema } from "../schemas/assembly"

type Part = z.infer<typeof PartSchema>

/**
 * Generates an STL file as a string for a given assembly of parts.
 */
export function exportSTL(parts: Part[]): string {
  let stl = "solid voxen_assembly\n"

  parts.forEach((part) => {
    // For simplicity, we'll represent each part as a box if it's not a known shape,
    // but here we just implement a basic box generation for any part based on its scale.
    // In a real app, we'd use a 3D library or more complex geometry logic.
    stl += generateBoxSTL(part)
  })

  stl += "endsolid voxen_assembly\n"
  return stl
}

/**
 * Generates STL facets for a box-shaped part.
 */
function generateBoxSTL(part: Part): string {
  const [x, y, z] = part.position
  const [sx, sy, sz] = part.scale
  
  const hx = sx / 2
  const hy = sy / 2
  const hz = sz / 2

  // Vertices of the box
  const v = [
    [x - hx, y - hy, z - hz], [x + hx, y - hy, z - hz], [x + hx, y + hy, z - hz], [x - hx, y + hy, z - hz],
    [x - hx, y - hy, z + hz], [x + hx, y - hy, z + hz], [x + hx, y + hy, z + hz], [x - hx, y + hy, z + hz]
  ]

  // 12 triangles (2 per face)
  const faces = [
    [0, 3, 1], [1, 3, 2], // bottom
    [4, 5, 7], [5, 6, 7], // top
    [0, 1, 4], [1, 5, 4], // front
    [1, 2, 5], [2, 6, 5], // right
    [2, 3, 6], [3, 7, 6], // back
    [3, 0, 7], [0, 4, 7]  // left
  ]

  let out = ""
  faces.forEach(f => {
    out += "  facet normal 0 0 0\n    outer loop\n"
    f.forEach(vi => {
      out += `      vertex ${v[vi][0]} ${v[vi][1]} ${v[vi][2]}\n`
    })
    out += "    endloop\n  endfacet\n"
  })

  return out
}
