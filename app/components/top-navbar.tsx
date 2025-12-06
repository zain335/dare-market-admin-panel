"use client";

import { PropsWithChildren, ReactNode } from "react";
import { Button } from "./shadcn/ui/button";
import { cn } from "@/utils";
import { signOut } from "next-auth/react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface SideNavBarProps {
  children?: ReactNode;
  className?: string;
}

const TopNavBar: React.FC<PropsWithChildren<SideNavBarProps>> = ({
  children,
  className,
}) => {
  return (
    <div className="flex flex-col">
      <div className={cn("top-0 absolute", className)}>
        <div className="flex items-center justify-between border-b bg-background px-5 py-2">
          <div className="flex flex-row space-x-2 w-full items-center"></div>
          <div className="flex flex-row space-x-2">
            <WalletMultiButton className="" />
            <Button
              variant={"danger"}
              size={"default"}
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[100vh] mt-12">
        {children}{" "}
      </div>
    </div>
  );
};

export default TopNavBar;
