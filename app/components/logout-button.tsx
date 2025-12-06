"use client";

import { signOut } from "next-auth/react";
import { Button } from "./shadcn/ui/button";
import { ButtonProps } from "./shadcn/ui/button";

interface LogoutButtonProps extends ButtonProps {
  callbackUrl?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  callbackUrl = "/sign-in", 
  children = "Sign out",
  ...props 
}) => {
  const handleLogout = () => {
    signOut({ callbackUrl });
  };

  return (
    <Button onClick={handleLogout} {...props}>
      {children}
    </Button>
  );
};

export default LogoutButton; 