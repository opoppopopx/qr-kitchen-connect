import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabels } from "@/types/restaurant";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-primary"><BrandLogo size={26} subtitle="ระบบสั่งอาหารด้วย QR" /></h1>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-tight">{profile?.full_name || profile?.username}</p>
                {role && <Badge variant="secondary" className="text-xs">{roleLabels[role]}</Badge>}
              </div>
              <Button size="sm" variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
