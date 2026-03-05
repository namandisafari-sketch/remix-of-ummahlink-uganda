import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Landmark, Bell, DollarSign, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminAlerts from "@/components/admin/AdminAlerts";
import AdminDonations from "@/components/admin/AdminDonations";

const AdminPage = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="font-display text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage projects, alerts, and donations</p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="projects" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects" className="gap-2">
            <Landmark className="h-4 w-4" /> Projects
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="donations" className="gap-2">
            <DollarSign className="h-4 w-4" /> Donations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <AdminProjects />
        </TabsContent>
        <TabsContent value="alerts">
          <AdminAlerts />
        </TabsContent>
        <TabsContent value="donations">
          <AdminDonations />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
