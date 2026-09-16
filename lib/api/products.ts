import { apiFetch, apiUpload } from "./client"
import type { CreateProductInput, Product } from "./types"

interface VendorProductsResponse {
  items: Product[]
  total: number
  page: number
  limit: number
}

export async function fetchVendorProducts(): Promise<Product[]> {
  const json = await apiFetch<{ data: VendorProductsResponse }>("/vendors/products", {
    query: { limit: 100 },
  })
  return json.data.items
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const json = await apiFetch<{ product: Product }>("/products/create", {
    method: "POST",
    body: input,
  })
  return json.product
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>): Promise<Product> {
  const json = await apiFetch<{ product: Product }>(`/products/${id}/update`, {
    method: "PATCH",
    body: input,
  })
  return json.product
}

export async function updateProductStock(id: string, stock: number): Promise<void> {
  await apiFetch(`/products/${id}/stock`, { method: "PATCH", body: { stock } })
}

export async function updateProductAvailability(id: string, isAvailable: boolean): Promise<Product> {
  const json = await apiFetch<{ product: Product }>(`/products/${id}/availability`, {
    method: "PATCH",
    body: { isAvailable },
  })
  return json.product
}

export async function uploadProductImages(id: string, files: File[]): Promise<string[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append("images", file))
  const json = await apiUpload<{ images: string[] }>(`/products/${id}/images`, formData)
  return json.images
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/${id}`, { method: "DELETE" })
}
