import { motion } from "framer-motion";
import { Shield, Landmark, Bell, DollarSign, Loader2, Megaphone, Mic, Users, BookOpen, Settings, LayoutDashboard, MapPin, Inbox } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminAlerts from "@/components/admin/AdminAlerts";
import AdminDonations from "@/components/admin/AdminDonations";
import AdminHeroBanners from "@/components/admin/AdminHeroBanners";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminSheikhs from "@/components/admin/AdminSheikhs";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminResources from "@/components/admin/AdminResources";
import AdminMosques from "@/components/admin/AdminMosques";
import AdminSubmissions from "@/components/admin/AdminSubmissions";
import AdminSettings from "@/components/admin/AdminSettings";

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
    <div className="px-4 py-6 md:px-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">Full control over content, users, and app behavior</p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="dashboard" className="mt-4">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:grid-cols-6 lg:grid-cols-11">
          <TabsTrigger value="dashboard" className="gap-1 text-xs"><LayoutDashboard className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="banners" className="gap-1 text-xs"><Megaphone className="h-3.5 w-3.5" /> Banners</TabsTrigger>
          <TabsTrigger value="projects" className="gap-1 text-xs"><Landmark className="h-3.5 w-3.5" /> Projects</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1 text-xs"><Bell className="h-3.5 w-3.5" /> Alerts</TabsTrigger>
          <TabsTrigger value="donations" className="gap-1 text-xs"><DollarSign className="h-3.5 w-3.5" /> Donations</TabsTrigger>
          <TabsTrigger value="sheikhs" className="gap-1 text-xs"><Mic className="h-3.5 w-3.5" /> Sheikhs</TabsTrigger>
          <TabsTrigger value="mosques" className="gap-1 text-xs"><MapPin className="h-3.5 w-3.5" /> Mosques</TabsTrigger>
          <TabsTrigger value="submissions" className="gap-1 text-xs"><Inbox className="h-3.5 w-3.5" /> Submissions</TabsTrigger>
          <TabsTrigger value="resources" className="gap-1 text-xs"><BookOpen className="h-3.5 w-3.5" /> Library</TabsTrigger>
          <TabsTrigger value="users" className="gap-1 text-xs"><Users className="h-3.5 w-3.5" /> Users</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1 text-xs"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><AdminDashboard /></TabsContent>
        <TabsContent value="banners"><AdminHeroBanners /></TabsContent>
        <TabsContent value="projects"><AdminProjects /></TabsContent>
        <TabsContent value="alerts"><AdminAlerts /></TabsContent>
        <TabsContent value="donations"><AdminDonations /></TabsContent>
        <TabsContent value="sheikhs"><AdminSheikhs /></TabsContent>
        <TabsContent value="mosques"><AdminMosques /></TabsContent>
        <TabsContent value="submissions"><AdminSubmissions /></TabsContent>
        <TabsContent value="resources"><AdminResources /></TabsContent>
        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="settings"><AdminSettings /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
