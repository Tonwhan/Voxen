import { z } from "zod"
import { PartSchema } from "../schemas/assembly"

type Part = z.infer<typeof PartSchema>

/**
 * Generates an OBJ file as a string for a given assembly of parts.
 */
export function exportOBJ(parts: Part[]): string {
  let obj = "# Voxen Generated Assembly\n"
  let vertexOffset = 1

  parts.forEach((part) => {
    obj += `o ${part.name.replace(/\s+/g, "_")}_${part.id}\n`
    
    const [x, y, z] = part.position
    const [sx, sy, sz] = part.scale
    const hx = sx / 2
    const hy = sy / 2
    const hz = sz / 2

    // Vertices
    const v = [
      [x - hx, y - hy, z - hz], [x + hx, y - hy, z - hz], [x + hx, y + hy, z - hz], [x - hx, y + hy, z - hz],
      [x - hx, y - hy, z + hz], [x + hx, y - hy, z + hz], [x + hx, y + hy, z + hz], [x - hx, y + hy, z + hz]
    ]

    v.forEach(vert => {
      obj += `v ${vert[0]} ${vert[1]} ${vert[2]}\n`
    })

    // Faces (1-based index)
    const faces = [
      [0, 1, 2, 3], // bottom
      [4, 7, 6, 5], // top
      [0, 4, 5, 1], // front
      [1, 5, 6, 2], // right
      [2, 6, 7, 3], // back
      [3, 7, 4, 0]  // left
    ]

    faces.forEach(f => {
      obj += `f ${f[0] + vertexOffset} ${f[1] + vertexOffset} ${f[2] + vertexOffset} ${f[3] + vertexOffset}\n`
    })

    vertexOffset += 8
  })

  return obj
}
