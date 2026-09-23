import { apiFetch, apiUpload } from "./client"
import { clearTokens, setTokens } from "./token-storage"
import type { SafeVendor } from "./types"

interface AuthResult {
  vendor: SafeVendor
  accessToken: string
  refreshToken: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  businessName: string
  phoneNumber: string
}

export async function registerVendor(input: RegisterInput): Promise<AuthResult> {
  const formData = new FormData()
  formData.append("email", input.email)
  formData.append("password", input.password)
  formData.append("profile[businessName]", input.businessName)
  formData.append("profile[phoneNumber]", input.phoneNumber)

  const json = await apiUpload<AuthResult>("/vendors/register", formData)
  setTokens(json.accessToken, json.refreshToken)
  return json
}

export async function loginVendor(input: LoginInput): Promise<AuthResult> {
  const json = await apiFetch<AuthResult>("/vendors/login", {
    method: "POST",
    body: input,
    auth: false,
  })
  setTokens(json.accessToken, json.refreshToken)
  return json
}

export async function logoutVendor(): Promise<void> {
  try {
    await apiFetch("/vendors/logout", { method: "POST" })
  } finally {
    clearTokens()
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch("/vendors/forgot-password", { method: "POST", body: { email }, auth: false })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiFetch("/vendors/reset-password", { method: "POST", body: { token, newPassword }, auth: false })
}
