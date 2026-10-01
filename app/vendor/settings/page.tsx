"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ApiError } from "@/lib/api/client"
import { changePassword, fetchProfile, updateBankDetails, updateProfile, uploadLogo } from "@/lib/api/profile"
import type { MomoProvider, SafeVendor } from "@/lib/api/types"

const MOMO_PROVIDER_OPTIONS: { value: MomoProvider; label: string }[] = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "vod", label: "Telecel Cash" },
  { value: "atl", label: "AirtelTigo Money" },
]

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}

export default function VendorSettingsPage() {
  const { setDisplayName } = useUser()
  const { addNotification } = useNotification()

  const [vendor, setVendor] = useState<SafeVendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const [businessInfo, setBusinessInfo] = useState({
    businessName: "",
    ownerName: "",
    phoneNumber: "",
    description: "",
  })

  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    bidAlerts: true,
    messageAlerts: true,
    emailNotifications: false,
    smsNotifications: true,
  })

  const [bankDetails, setBankDetails] = useState<{
    accountName: string
    accountNumber: string
    momoProvider: MomoProvider | ""
  }>({
    accountName: "",
    accountNumber: "",
    momoProvider: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isSavingBusiness, setIsSavingBusiness] = useState(false)
  const [isSavingBank, setIsSavingBank] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    let isCancelled = false

    fetchProfile()
      .then((data) => {
        if (isCancelled) return
        setVendor(data)
        setBusinessInfo({
          businessName: data.profile.businessName ?? "",
          ownerName: data.profile.ownerName ?? "",
          phoneNumber: data.profile.phoneNumber ?? "",
          description: data.profile.description ?? "",
        })
        setBankDetails({
          accountName: data.bankDetails.accountName ?? "",
          accountNumber: data.bankDetails.accountNumber ?? "",
          momoProvider: data.bankDetails.momoProvider ?? "",
        })
      })
      .catch((error) => {
        if (!isCancelled) addNotification(getErrorMessage(error), "error")
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [addNotification])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const logoUrl = await uploadLogo(file)
      setVendor((current) => (current ? { ...current, profile: { ...current.profile, logo: logoUrl } } : current))
      addNotification("Logo updated successfully", "success")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSaveBusinessInfo = async () => {
    setIsSavingBusiness(true)
    try {
      const updated = await updateProfile(businessInfo)
      setVendor(updated)
      setDisplayName(updated.profile.businessName)
      addNotification("Business information updated successfully", "success")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setIsSavingBusiness(false)
    }
  }

  const handleSaveNotifications = () => {
    addNotification("Notification preferences updated", "success")
  }

  const handleSaveBankDetails = async () => {
    if (bankDetails.accountNumber && !/^0\d{9}$/.test(bankDetails.accountNumber)) {
      addNotification("Enter a valid mobile money number, e.g. 0551234567", "error")
      return
    }

    setIsSavingBank(true)
    try {
      const updated = await updateBankDetails({
        ...bankDetails,
        momoProvider: bankDetails.momoProvider || undefined,
      })
      setVendor((current) => (current ? { ...current, bankDetails: updated } : current))
      addNotification("Payout details updated successfully", "success")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setIsSavingBank(false)
    }
  }

  const handleUpdatePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (!currentPassword || !newPassword || !confirmPassword) {
      addNotification("Fill in all password fields", "error")
      return
    }

    if (newPassword !== confirmPassword) {
      addNotification("New password and confirmation do not match", "error")
      return
    }

    setIsSavingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      addNotification("Password updated successfully", "success")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleDeactivateAccount = () => {
    setIsDeactivateDialogOpen(false)
    addNotification("Account deactivation isn't self-service yet — contact support to deactivate your storefront.", "info")
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your vendor account and preferences</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Business Information */}
        <TabsContent value="business" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">🏪</div>
              <div>
                <h2 className="text-xl font-semibold">Business Information</h2>
                <p className="text-sm text-muted-foreground">Update your business details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Business Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {vendor?.profile.logo ? (
                      <img
                        src={vendor.profile.logo}
                        alt="Logo"
                        className="w-24 h-24 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-3xl border-2 border-border">
                        🏪
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                      disabled={isUploadingLogo}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload a square image (recommended: 400x400px).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessInfo.businessName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={businessInfo.ownerName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, ownerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={vendor?.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground">Email can&apos;t be changed here.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={businessInfo.phoneNumber}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phoneNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveBusinessInfo} className="w-full md:w-auto" disabled={isSavingBusiness}>
                {isSavingBusiness ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">🔔</div>
              <div>
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">Manage how you receive notifications</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">In-App Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified when you receive new orders</p>
                    </div>
                    <Switch
                      checked={notifications.orderAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, orderAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Bid Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified about new bids on your products</p>
                    </div>
                    <Switch
                      checked={notifications.bidAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, bidAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Message Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified when customers message you</p>
                    </div>
                    <Switch
                      checked={notifications.messageAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, messageAlerts: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">External Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="w-full md:w-auto">
                Save Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Bank Details */}
        <TabsContent value="bank" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">💳</div>
              <div>
                <h2 className="text-xl font-semibold">Payout Details</h2>
                <p className="text-sm text-muted-foreground">
                  Where approved payouts are sent, via mobile money
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  placeholder="Name registered on the mobile money account"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="momoProvider">Network</Label>
                  <Select
                    value={bankDetails.momoProvider}
                    onValueChange={(value) => setBankDetails({ ...bankDetails, momoProvider: value as MomoProvider })}
                  >
                    <SelectTrigger id="momoProvider">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOMO_PROVIDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Mobile Money Number</Label>
                  <Input
                    id="accountNumber"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    placeholder="0551234567"
                    inputMode="tel"
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Payouts are requested manually from the{" "}
                  <Link href="/vendor/payouts" className="underline">
                    Payouts page
                  </Link>{" "}
                  once you have an available balance. An admin reviews and sends each payout to this number.
                </p>
              </div>

              <Button onClick={handleSaveBankDetails} className="w-full md:w-auto" disabled={isSavingBank}>
                {isSavingBank ? "Saving..." : "Update Payout Details"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">🔒</div>
              <div>
                <h2 className="text-xl font-semibold">Security Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your account security</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <Button className="w-full md:w-auto" onClick={handleUpdatePassword} disabled={isSavingPassword}>
                    {isSavingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch onCheckedChange={() => addNotification("Two-factor authentication coming soon!", "info")} />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 text-red-600">Danger Zone</h3>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full md:w-auto text-red-600 hover:text-red-700 bg-transparent"
                    onClick={() => setIsDeactivateDialogOpen(true)}
                  >
                    Deactivate Account
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate your account?</DialogTitle>
            <DialogDescription>
              Your storefront will be hidden from students and you won&apos;t be able to receive new orders until you
              reactivate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivateAccount}>
              Deactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
