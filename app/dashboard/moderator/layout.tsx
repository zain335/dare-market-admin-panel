"use client";

import TopNavBar from "@/components/top-navbar";

/**
 * Layout component for moderator pages
 * Includes the top navigation bar with wallet integration and sign out functionality
 */
export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full">{children}</div>;
}
