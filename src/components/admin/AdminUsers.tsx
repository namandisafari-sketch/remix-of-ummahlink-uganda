import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, Shield, ShieldOff, Search, UserCog, MapPin, Briefcase, Phone,
  Calendar, Heart, Sparkles, Eye, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Role = "admin" | "moderator" | "user";

interface UserRow {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  roles: Role[];
  prefs: any | null;
}

const AdminUsers = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [hobbyFilter, setHobbyFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<UserRow | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-rich"],
    queryFn: async () => {
      const [
        { data: profiles, error: pe },
        { data: roles, error: re },
        { data: prefs, error: ue },
      ] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, phone, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("user_preferences").select("*"),
      ]);
      if (pe) throw pe;
      if (re) throw re;
      if (ue) throw ue;
      const rolesByUser = new Map<string, Role[]>();
      (roles ?? []).forEach((r: any) => {
        const list = rolesByUser.get(r.user_id) ?? [];
        list.push(r.role);
        rolesByUser.set(r.user_id, list);
      });
      const prefsByUser = new Map<string, any>();
      (prefs ?? []).forEach((p: any) => prefsByUser.set(p.user_id, p));
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: rolesByUser.get(p.user_id) ?? ["user"],
        prefs: prefsByUser.get(p.user_id) ?? null,
      })) as UserRow[];
    },
  });

  const districts = useMemo(() => {
    const set = new Set<string>();
    users?.forEach((u) => u.prefs?.district && set.add(u.prefs.district));
    return Array.from(set).sort();
  }, [users]);

  const allHobbies = useMemo(() => {
    const set = new Set<string>();
    users?.forEach((u) => (u.prefs?.hobbies ?? []).forEach((h: string) => set.add(h)));
    return Array.from(set).sort();
  }, [users]);

  const allPurposes = useMemo(() => {
    const set = new Set<string>();
    users?.forEach((u) => u.prefs?.account_purpose && set.add(u.prefs.account_purpose));
    return Array.from(set).sort();
  }, [users]);

  const setRole = async (user_id: string, role: Role, grant: boolean) => {
    if (grant) {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) return toast.error(error.message);
    }
    toast.success(`Role ${grant ? "granted" : "revoked"}`);
    qc.invalidateQueries({ queryKey: ["admin-users-rich"] });
  };

  const filtered = users?.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.phone || "").includes(q) ||
      (u.prefs?.business_name || "").toLowerCase().includes(q) ||
      (u.prefs?.village || "").toLowerCase().includes(q);
    const matchesDistrict = districtFilter === "all" || u.prefs?.district === districtFilter;
    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter as Role);
    const matchesHobby = hobbyFilter === "all" || (u.prefs?.hobbies ?? []).includes(hobbyFilter);
    const matchesPurpose = purposeFilter === "all" || u.prefs?.account_purpose === purposeFilter;
    return matchesSearch && matchesDistrict && matchesRole && matchesHobby && matchesPurpose;
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const onboardedCount = users?.filter((u) => u.prefs?.onboarding_completed).length ?? 0;
  const businessCount = users?.filter((u) => u.prefs?.has_business).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total users", value: users?.length ?? 0, icon: UserCog, accent: "bg-primary/10 text-primary" },
          { label: "Onboarded", value: onboardedCount, icon: CheckCircle2, accent: "bg-accent/30 text-accent-foreground" },
          { label: "With business", value: businessCount, icon: Briefcase, accent: "bg-primary/10 text-primary" },
          { label: "Districts", value: districts.length, icon: MapPin, accent: "bg-destructive/10 text-destructive" },
        ].map((s) => {
          const I = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.accent}`}>
                  <I className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 p-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, phone, business, village…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={hobbyFilter} onValueChange={setHobbyFilter}>
            <SelectTrigger><SelectValue placeholder="Hobby" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All hobbies</SelectItem>
              {allHobbies.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
        {allPurposes.length > 0 && (
          <CardContent className="flex flex-wrap items-center gap-2 border-t p-3 pt-3">
            <span className="text-xs text-muted-foreground">Purpose:</span>
            <button
              onClick={() => setPurposeFilter("all")}
              className={`rounded-full px-3 py-1 text-xs ${purposeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`}
            >All</button>
            {allPurposes.map((p) => (
              <button
                key={p}
                onClick={() => setPurposeFilter(p)}
                className={`rounded-full px-3 py-1 text-xs ${purposeFilter === p ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`}
              >{p}</button>
            ))}
            <Badge variant="secondary" className="ml-auto">{filtered?.length ?? 0} matches</Badge>
          </CardContent>
        )}
      </Card>

      {/* Card grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered?.map((u) => {
          const isAdmin = u.roles.includes("admin");
          const isMod = u.roles.includes("moderator");
          const p = u.prefs;
          return (
            <Card key={u.user_id} className="overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    <span className="text-sm font-bold">
                      {(u.display_name || "U").trim().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{u.display_name || "Unnamed"}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />{u.phone || "—"}
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />Joined {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {p?.onboarding_completed
                    ? <CheckCircle2 className="h-4 w-4 text-primary" />
                    : <XCircle className="h-4 w-4 text-muted-foreground/50" />}
                </div>

                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-[10px]">{r}</Badge>
                  ))}
                  {p?.age_range && <Badge variant="outline" className="text-[10px]">{p.age_range}</Badge>}
                  {p?.has_business && <Badge variant="outline" className="text-[10px]">Business</Badge>}
                </div>

                {(p?.district || p?.village) && (
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {[p.village, p.parish, p.subcounty, p.district].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}

                {p?.business_name && (
                  <div className="flex items-center gap-1.5 truncate text-xs">
                    <Briefcase className="h-3 w-3 shrink-0 text-primary" />
                    <span className="truncate font-medium">{p.business_name}</span>
                    {p.business_category && <span className="truncate text-muted-foreground">· {p.business_category}</span>}
                  </div>
                )}

                {p?.hobbies?.length > 0 && (
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Heart className="h-3 w-3" />Hobbies
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.hobbies.slice(0, 3).map((h: string) => (
                        <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>
                      ))}
                      {p.hobbies.length > 3 && <Badge variant="outline" className="text-[10px]">+{p.hobbies.length - 3}</Badge>}
                    </div>
                  </div>
                )}

                {p?.interests?.length > 0 && (
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-3 w-3" />Interests
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.interests.slice(0, 3).map((h: string) => (
                        <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>
                      ))}
                      {p.interests.length > 3 && <Badge variant="outline" className="text-[10px]">+{p.interests.length - 3}</Badge>}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setSelected(u)}>
                    <Eye className="h-3 w-3" /> View
                  </Button>
                  <Button size="sm" variant={isAdmin ? "outline" : "default"} className="flex-1 gap-1" onClick={() => setRole(u.user_id, "admin", !isAdmin)}>
                    {isAdmin ? <><ShieldOff className="h-3 w-3" /> Revoke</> : <><Shield className="h-3 w-3" /> Admin</>}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setRole(u.user_id, "moderator", !isMod)}>
                    {isMod ? "Revoke Mod" : "Make Mod"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered?.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No users match your filters.</p>}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.display_name || "User profile"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Field label="Phone" value={selected.phone} />
              <Field label="Joined" value={new Date(selected.created_at).toLocaleString()} />
              <Field label="Roles" value={selected.roles.join(", ")} />
              {selected.prefs ? (
                <>
                  <Section title="Demographics">
                    <Field label="Age range" value={selected.prefs.age_range} />
                    <Field label="Account purpose" value={selected.prefs.account_purpose} />
                    <Field label="Referral source" value={selected.prefs.referral_source} />
                  </Section>
                  <Section title="Location">
                    <Field label="Region" value={selected.prefs.region} />
                    <Field label="District" value={selected.prefs.district} />
                    <Field label="Constituency" value={selected.prefs.constituency} />
                    <Field label="Sub-county" value={selected.prefs.subcounty} />
                    <Field label="Parish" value={selected.prefs.parish} />
                    <Field label="Village" value={selected.prefs.village} />
                    <Field label="City" value={selected.prefs.location_city} />
                  </Section>
                  {selected.prefs.has_business && (
                    <Section title="Business">
                      <Field label="Name" value={selected.prefs.business_name} />
                      <Field label="Category" value={selected.prefs.business_category} />
                      <Field label="Description" value={selected.prefs.business_description} />
                    </Section>
                  )}
                  {(selected.prefs.hobbies?.length || selected.prefs.interests?.length) && (
                    <Section title="Personal">
                      {selected.prefs.hobbies?.length > 0 && (
                        <div>
                          <p className="text-[11px] text-muted-foreground">Hobbies</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selected.prefs.hobbies.map((h: string) => <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>)}
                          </div>
                        </div>
                      )}
                      {selected.prefs.interests?.length > 0 && (
                        <div>
                          <p className="text-[11px] text-muted-foreground">Interests</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selected.prefs.interests.map((h: string) => <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>)}
                          </div>
                        </div>
                      )}
                    </Section>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No onboarding data recorded.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: any }) => (
  <div className="grid grid-cols-3 gap-2">
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="col-span-2 break-words">{value ? String(value) : <span className="text-muted-foreground">—</span>}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <p className="mb-2 text-xs font-semibold text-foreground">{title}</p>
    <div className="space-y-1.5">{children}</div>
  </div>
);

export default AdminUsers;
