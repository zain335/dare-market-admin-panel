import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (status !== "authenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  return status === "authenticated" ? <>{children}</> : null;
};

const withProtectedRoute = <P extends {}>(
  Component: React.FC<P>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ProtectedRoute>
      <Component {...props} />
    </ProtectedRoute>
  );

  // Assign a display name to the wrapped component
  WrappedComponent.displayName = `withProtectedRoute(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
};

export default withProtectedRoute;
