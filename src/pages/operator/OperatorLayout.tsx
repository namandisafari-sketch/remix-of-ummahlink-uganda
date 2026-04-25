import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OperatorSidebar } from "@/components/operator/OperatorSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useMyOperator } from "@/hooks/useMyOperator";
import { OperatorApply } from "@/components/operator/OperatorApply";

const OperatorLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: operator, isLoading } = useMyOperator();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  if (authLoading || isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!operator) return <OperatorApply />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <OperatorSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{operator.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {operator.verified ? "✓ Verified operator" : "Pending verification"}
              </p>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OperatorLayout;
