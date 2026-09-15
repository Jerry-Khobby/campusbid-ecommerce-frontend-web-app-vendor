"use client";

import type React from "react";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { VendorSidebar } from "@/components/vendor/vendor-sidebar";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user && pathname !== "/vendor/login") {
      const params = new URLSearchParams();

      params.set("redirect", pathname);

      router.push(`/vendor/login?${params.toString()}`);
    }
  }, [user, isLoading, pathname, router]);

  // Hide sidebar on login page
  if (pathname === "/vendor/login") {
    return <>{children}</>;
  }

  // Still checking for a persisted session — avoid flashing a redirect.
  if (isLoading) {
    return null;
  }

  // Show loading state while checking authentication
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <VendorSidebar />
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
