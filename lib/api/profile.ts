import { apiFetch, apiUpload } from "./client"
import type { BankDetails, BusinessHour, SafeVendor, VendorLocation } from "./types"

export async function fetchProfile(): Promise<SafeVendor> {
  const json = await apiFetch<{ vendor: SafeVendor }>("/vendors/profile")
  return json.vendor
}

export interface UpdateProfileInput {
  businessName?: string
  ownerName?: string
  phoneNumber?: string
  description?: string
}

export async function updateProfile(input: UpdateProfileInput): Promise<SafeVendor> {
  const json = await apiFetch<{ vendor: SafeVendor }>("/vendors/profile", {
    method: "PUT",
    body: input,
  })
  return json.vendor
}

export async function uploadLogo(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("logo", file)
  const json = await apiUpload<{ data: { logo: string } }>("/vendors/profile/logo", formData)
  return json.data.logo
}

export async function uploadBanner(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("banner", file)
  const json = await apiUpload<{ data: { banner: string } }>("/vendors/profile/banner", formData)
  return json.data.banner
}

export async function updateLocation(input: {
  address?: string
  building?: string
  coordinates: [number, number]
}): Promise<VendorLocation> {
  const json = await apiFetch<{ location: VendorLocation }>("/vendors/update-location", {
    method: "POST",
    body: input,
  })
  return json.location
}

export async function updateBusinessHours(businessHours: BusinessHour[]): Promise<BusinessHour[]> {
  const json = await apiFetch<{ businessHours: BusinessHour[] }>("/vendors/update-business-hours", {
    method: "POST",
    body: { businessHours },
  })
  return json.businessHours
}

export async function updateBankDetails(input: Partial<BankDetails>): Promise<BankDetails> {
  const json = await apiFetch<{ bankDetails: BankDetails }>("/vendors/bank-details", {
    method: "PUT",
    body: input,
  })
  return json.bankDetails
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await apiFetch("/vendors/change-password", {
    method: "POST",
    body: { oldPassword, newPassword },
  })
}
