export type LayoutPreset = {
  id: string
  name: string
  layout_type: string
  category: string
  description: string
  layout: Record<string, unknown>
}

export function searchPresets(presets: LayoutPreset[], query: string): LayoutPreset[] {
  const q = query.trim().toLowerCase()
  if (!q) return presets
  return presets.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.layout_type.toLowerCase().includes(q)
  )
}
