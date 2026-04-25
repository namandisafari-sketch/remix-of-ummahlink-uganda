import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, BadgeCheck, Trash2, Building2, Plane, Inbox, Phone, MessageCircle, Eye, ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const AdminTours = () => {
  const qc = useQueryClient();

  const { data: operators, isLoading } = useQuery({
    queryKey: ["admin-tour-operators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_operators").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: packages } = useQuery({
    queryKey: ["admin-tour-packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_packages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: inquiries } = useQuery({
    queryKey: ["admin-tour-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_inquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleVerify = async (id: string, verified: boolean) => {
    const { error } = await supabase.from("tour_operators").update({ verified: !verified }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(verified ? "Verification revoked" : "Operator verified");
    qc.invalidateQueries({ queryKey: ["admin-tour-operators"] });
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("tour_operators").update({ active: !active }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(active ? "Operator hidden" : "Operator shown");
    qc.invalidateQueries({ queryKey: ["admin-tour-operators"] });
  };

  const removeOperator = async (id: string) => {
    if (!confirm("Permanently delete this operator and all their packages?")) return;
    const { error } = await supabase.from("tour_operators").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Operator deleted");
    qc.invalidateQueries({ queryKey: ["admin-tour-operators"] });
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Operators", value: operators?.length ?? 0, icon: Building2 },
          { label: "Verified", value: operators?.filter((o) => o.verified).length ?? 0, icon: BadgeCheck },
          { label: "Packages", value: packages?.length ?? 0, icon: Plane },
          { label: "Inquiries", value: inquiries?.length ?? 0, icon: Inbox },
        ].map((s) => {
          const I = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><I className="h-4 w-4" /></div>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="operators">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
        </TabsList>

        <TabsContent value="operators" className="mt-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {operators?.map((o: any) => (
              <Card key={o.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start gap-3">
                    {o.logo_url
                      ? <img src={o.logo_url} alt="" className="h-10 w-10 rounded-lg border object-cover" />
                      : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{o.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{[o.city, o.district].filter(Boolean).join(", ") || "—"}</p>
                    </div>
                    {o.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={o.active ? "default" : "secondary"} className="text-[10px]">{o.active ? "Active" : "Hidden"}</Badge>
                    {o.license_no && <Badge variant="outline" className="text-[10px]">Lic: {o.license_no}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to={`/hajj-umrah/${o.slug}`}><Button size="sm" variant="outline" className="w-full gap-1"><Eye className="h-3 w-3" />View</Button></Link>
                    <Button size="sm" variant={o.verified ? "outline" : "default"} className="gap-1" onClick={() => toggleVerify(o.id, o.verified)}>
                      <BadgeCheck className="h-3 w-3" />{o.verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(o.id, o.active)}>{o.active ? "Hide" : "Show"}</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => removeOperator(o.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {operators?.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No operators yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="packages" className="mt-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {packages?.map((p: any) => {
              const op = operators?.find((o: any) => o.id === p.operator_id);
              return (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{op?.name ?? "—"}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge>{p.type.toUpperCase()}</Badge>
                      <Badge variant="outline" className="capitalize">{p.tier}</Badge>
                      <Badge variant="outline">UGX {Number(p.price_ugx).toLocaleString()}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {packages?.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No packages yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="inquiries" className="mt-3">
          <div className="space-y-2">
            {inquiries?.map((i: any) => {
              const op = operators?.find((o: any) => o.id === i.operator_id);
              return (
                <Card key={i.id}>
                  <CardContent className="space-y-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{i.name} <span className="text-xs font-normal text-muted-foreground">→ {op?.name ?? "—"}</span></p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{i.phone}</p>
                      </div>
                      <Badge variant={i.status === "new" ? "default" : "secondary"} className="text-[10px]">{i.status}</Badge>
                    </div>
                    {i.message && <p className="text-sm">{i.message}</p>}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
                      <a href={`https://wa.me/${i.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1"><MessageCircle className="h-3 w-3" />WhatsApp</Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {inquiries?.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No inquiries yet.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTours;
