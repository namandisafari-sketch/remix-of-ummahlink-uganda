import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Shield, ShieldOff, Search, UserCog } from "lucide-react";
import { toast } from "sonner";

type Role = "admin" | "moderator" | "user";

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  roles: Role[];
}

const AdminUsers = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, phone, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pe) throw pe;
      if (re) throw re;
      const rolesByUser = new Map<string, Role[]>();
      (roles ?? []).forEach((r: any) => {
        const list = rolesByUser.get(r.user_id) ?? [];
        list.push(r.role);
        rolesByUser.set(r.user_id, list);
      });
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: rolesByUser.get(p.user_id) ?? ["user"],
      })) as ProfileRow[];
    },
  });

  const setRole = async (user_id: string, role: Role, grant: boolean) => {
    if (grant) {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) return toast.error(error.message);
    }
    toast.success(`Role ${grant ? "granted" : "revoked"}`);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const filtered = users?.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (u.display_name || "").toLowerCase().includes(q) || (u.phone || "").includes(q);
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="secondary">{filtered?.length ?? 0} users</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((u) => {
          const isAdmin = u.roles.includes("admin");
          const isMod = u.roles.includes("moderator");
          return (
            <Card key={u.user_id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{u.display_name || "Unnamed"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.phone || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-[10px]">{r}</Badge>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button size="sm" variant={isAdmin ? "outline" : "default"} onClick={() => setRole(u.user_id, "admin", !isAdmin)}>
                    {isAdmin ? <><ShieldOff className="h-3 w-3" /> Revoke Admin</> : <><Shield className="h-3 w-3" /> Make Admin</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRole(u.user_id, "moderator", !isMod)}>
                    {isMod ? "Revoke Mod" : "Make Mod"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered?.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No users match.</p>}
      </div>
    </div>
  );
};

export default AdminUsers;
