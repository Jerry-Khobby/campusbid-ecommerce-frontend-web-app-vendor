"use client";

import type React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotification } from "@/lib/notification-context";
import { requestPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import Link from "next/link";

export default function VendorForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
      addNotification("Password reset link sent to your email!", "success");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong, please try again";
      addNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-xl">
              🏪
            </div>
            <div>
              <h1 className="text-2xl font-bold">CampusBid</h1>
              <p className="text-sm text-muted-foreground">Vendor Portal</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Forgot Password</h2>
          <p className="text-sm text-muted-foreground">
            {isSubmitted
              ? "Check your email for reset instructions"
              : "Enter your email to receive a password reset link"}
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">📧</div>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
            </div>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="w-full"
            >
              Try Another Email
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/vendor/login"
            className="text-sm text-primary hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
