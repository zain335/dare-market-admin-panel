"use client";
import React from "react";
import { ProfileData } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "./shadcn/ui/avatar";
import { getIPFSUrl } from "@/utils/ipfs";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  wallet: string;
  profile?: ProfileData | null;
  size?: "sm" | "md" | "lg";
  showUsername?: boolean;
  isLoading?: boolean;
  className?: string;
}

/**
 * Generate a consistent color based on wallet address
 * Used for fallback avatar background
 */
const getWalletColor = (wallet: string): string => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];

  // Use first character of wallet to determine color
  const charCode = wallet.charCodeAt(0);
  return colors[charCode % colors.length];
};

/**
 * Get initials for fallback avatar
 * Priority: username first letter > wallet first letter
 */
const getInitials = (profile?: ProfileData | null, wallet?: string): string => {
  if (profile?.username) {
    return profile.username.charAt(0).toUpperCase();
  }
  if (wallet) {
    return wallet.charAt(0).toUpperCase();
  }
  return "?";
};

/**
 * ProfileAvatar component
 * Displays user avatar from IPFS with fallback to initials
 * Optionally shows username below/beside avatar
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  wallet,
  profile,
  size = "md",
  showUsername = false,
  isLoading = false,
  className,
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const avatarUrl = profile?.avatarCid ? getIPFSUrl(profile.avatarCid) : null;
  const initials = getInitials(profile, wallet);
  const bgColor = getWalletColor(wallet);

  if (showUsername) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar className={sizeClasses[size]}>
          {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.username || wallet} />}
          <AvatarFallback className={cn("text-white font-semibold", bgColor)}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              <span className="text-xs text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              {profile?.username && (
                <p className={cn("font-medium truncate", textSizeClasses[size])}>
                  {profile.username}
                </p>
              )}
              <p className="font-mono text-xs text-gray-500 truncate">
                {wallet.slice(0, 4)}...{wallet.slice(-4)}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Avatar className={sizeClasses[size]}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.username || wallet} />}
        <AvatarFallback className={cn("text-white font-semibold", bgColor)}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            initials
          )}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default ProfileAvatar;
