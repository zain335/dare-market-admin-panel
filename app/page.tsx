"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingIcon from "./components/icons/loading";

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session) {
      // User is authenticated, redirect to dashboard
      router.push("/dashboard");
    } else {
      // User is not authenticated, redirect to sign-in
      router.push("/sign-in");
    }
  }, [session, status, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingIcon
          className="animate-spin mx-auto mb-4"
          width={40}
          height={40}
        />
        <p className="text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}
