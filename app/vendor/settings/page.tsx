"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function VendorSettingsPage() {
  const { user, updateProfile } = useUser()
  const { addNotification } = useNotification()

  const [profileImage, setProfileImage] = useState<string>(user?.profileImage || "")

  const [businessInfo, setBusinessInfo] = useState({
    businessName: user?.name || "Campus Cafe",
    email: user?.email || "vendor@campuscafe.com",
    phone: user?.phone || "+1 (555) 123-4567",
    description: "Fresh coffee and pastries daily",
    address: "123 Campus Drive, Building A",
    hours: "Mon-Fri: 7AM-8PM, Sat-Sun: 8AM-6PM",
  })

  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    bidAlerts: true,
    messageAlerts: true,
    emailNotifications: false,
    smsNotifications: true,
  })

  const [paymentInfo, setPaymentInfo] = useState({
    accountHolder: "Campus Cafe LLC",
    accountNumber: "****1234",
    routingNumber: "****5678",
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setProfileImage(result)
        updateProfile({ profileImage: result })
        addNotification("Profile picture updated successfully", "success")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveBusinessInfo = () => {
    updateProfile({
      name: businessInfo.businessName,
      email: businessInfo.email,
      phone: businessInfo.phone,
    })
    addNotification("Business information updated successfully", "success")
  }

  const handleSaveNotifications = () => {
    addNotification("Notification preferences updated", "success")
  }

  const handleSavePayment = () => {
    addNotification("Payment information updated", "success")
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
          <TabsTrigger value="payment">Payment</TabsTrigger>
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
                <Label>Business Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profileImage ? (
                      <img
                        src={profileImage || "/placeholder.svg"}
                        alt="Profile"
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
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload a square image (recommended: 400x400px). Max size: 5MB
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
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

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <span>📍</span>
                  Address
                </Label>
                <Input
                  id="address"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours" className="flex items-center gap-2">
                  <span>🕐</span>
                  Business Hours
                </Label>
                <Input
                  id="hours"
                  value={businessInfo.hours}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, hours: e.target.value })}
                />
              </div>

              <Button onClick={handleSaveBusinessInfo} className="w-full md:w-auto">
                Save Changes
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

        {/* Payment */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">💳</div>
              <div>
                <h2 className="text-xl font-semibold">Payment Information</h2>
                <p className="text-sm text-muted-foreground">Manage your payout details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountHolder">Account Holder Name</Label>
                <Input
                  id="accountHolder"
                  value={paymentInfo.accountHolder}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, accountHolder: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    type="password"
                    value={paymentInfo.accountNumber}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, accountNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    type="password"
                    value={paymentInfo.routingNumber}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, routingNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your payment information is securely encrypted. Payouts are processed weekly on Fridays.
                </p>
              </div>

              <Button onClick={handleSavePayment} className="w-full md:w-auto">
                Update Payment Info
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
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button className="w-full md:w-auto">Update Password</Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 text-red-600">Danger Zone</h3>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full md:w-auto text-red-600 hover:text-red-700 bg-transparent">
                    Deactivate Account
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
