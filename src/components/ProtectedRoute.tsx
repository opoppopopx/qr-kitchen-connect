import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccess, homeFor } from "@/lib/permissions";
import { AppLayout } from "@/components/layout/AppLayout";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        กำลังโหลด...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!canAccess(role, location.pathname)) {
    return <Navigate to={homeFor(role)} replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}
