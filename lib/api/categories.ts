import { apiFetch } from "./client"

export interface Category {
  _id: string
  name: string
}

/** Public — products must reference one of these exact names (see docs/categories.md). */
export async function fetchCategories(): Promise<Category[]> {
  const json = await apiFetch<{ data: Category[] }>("/categories", { auth: false })
  return json.data
}
