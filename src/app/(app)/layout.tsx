"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { FEATURES } from "@/lib/feature-flags";

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
    const role = (user.role ?? "student").toLowerCase();
    const isStudent = role === "student";
    const onFacultyPath = pathname.startsWith("/faculty");
    const onSharedPath = pathname === "/settings";
    if (isStudent && onFacultyPath) {
      router.replace("/dashboard");
      return;
    } else if (!isStudent && !onFacultyPath && !onSharedPath) {
      router.replace("/faculty/dashboard");
      return;
    }

    if (!FEATURES.AI_ASSISTANT && pathname === "/assistant") {
      router.replace(isStudent ? "/dashboard" : "/faculty/dashboard");
      return;
    }

    if (!FEATURES.STUDY_PLANNER && pathname.startsWith("/study-planner")) {
      router.replace(isStudent ? "/dashboard" : "/faculty/dashboard");
      return;
    }

    const isOtherResourcePath =
      pathname.startsWith("/notices") ||
      pathname.startsWith("/study-materials") ||
      pathname.startsWith("/notifications") ||
      pathname.startsWith("/faculty/notices") ||
      pathname.startsWith("/faculty/materials");

    if (!FEATURES.RESOURCES && isOtherResourcePath) {
      router.replace(isStudent ? "/dashboard" : "/faculty/dashboard");
      return;
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
