"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const isStudent = user.role === "student";
    const onFacultyPath = pathname.startsWith("/faculty");
    const onSharedPath = pathname === "/settings";
    if (isStudent && onFacultyPath) {
      router.replace("/dashboard");
    } else if (!isStudent && !onFacultyPath && !onSharedPath) {
      router.replace("/faculty/dashboard");
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-3 p-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}
