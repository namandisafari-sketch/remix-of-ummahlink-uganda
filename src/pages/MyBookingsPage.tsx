import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plane, Calendar, Wallet, Phone, ExternalLink } from "lucide-react";
import { fmtUgx, fmtUgxFull, daysUntil } from "@/lib/format";
import { format } from "date-fns";

const MyBookingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: bookings, error } = await (supabase.from("tour_bookings") as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const opIds = Array.from(new Set((bookings ?? []).map((b: any) => b.operator_id)));
      const pkgIds = Array.from(new Set((bookings ?? []).map((b: any) => b.package_id)));
      const bookingIds = (bookings ?? []).map((b: any) => b.id);
      const [ops, pkgs, payments] = await Promise.all([
        opIds.length ? supabase.from("tour_operators").select("id, name, slug, contact_phone, whatsapp").in("id", opIds) : Promise.resolve({ data: [] as any[] }),
        pkgIds.length ? supabase.from("tour_packages").select("id, name, type, tier").in("id", pkgIds) : Promise.resolve({ data: [] as any[] }),
        bookingIds.length ? (supabase.from("tour_booking_payments") as any).select("*").in("booking_id", bookingIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
      ]);
      return {
        bookings: (bookings ?? []) as any[],
        operators: (ops.data ?? []) as any[],
        packages: (pkgs.data ?? []) as any[],
        payments: (payments.data ?? []) as any[],
      };
    },
  });

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const bookings = data?.bookings ?? [];

  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold md:text-3xl">My Hajj & Umrah Bookings</h1>
        <p className="text-sm text-muted-foreground">Track your journey, payments, and balance</p>
      </div>

      {bookings.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Plane className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="mb-1 font-semibold">No bookings yet</p>
          <p className="mb-4 text-sm text-muted-foreground">Browse our verified operators and book your spiritual journey.</p>
          <Button asChild><Link to="/hajj-umrah">Explore packages</Link></Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => {
            const op = data!.operators.find((o: any) => o.id === b.operator_id);
            const pkg = data!.packages.find((p: any) => p.id === b.package_id);
            const payments = data!.payments.filter((p: any) => p.booking_id === b.id);
            const balance = Number(b.total_amount) - Number(b.paid_amount);
            const days = daysUntil(b.departure_date);
            const paidPct = Number(b.total_amount) > 0 ? Math.round((Number(b.paid_amount) / Number(b.total_amount)) * 100) : 0;
            return (
              <Card key={b.id} className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/70 p-4 text-primary-foreground">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider opacity-90">{pkg?.type?.toUpperCase()} · {pkg?.tier}</p>
                      <p className="font-display text-lg font-bold">{pkg?.name ?? "Package"}</p>
                      <Link to={op ? `/hajj-umrah/${op.slug}` : "#"} className="flex items-center gap-1 text-xs opacity-90 hover:underline">
                        {op?.name} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <Badge variant="secondary" className="capitalize">{b.status}</Badge>
                  </div>
                </div>
                <CardContent className="space-y-3 p-4">
                  {b.departure_date && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        {format(new Date(b.departure_date), "PPPP")}
                      </span>
                      {days !== null && days >= 0 && (
                        <Badge variant={days <= 7 ? "destructive" : "default"}>
                          {days === 0 ? "Today" : `${days} days to go`}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Payment progress</span>
                      <span className="font-medium">{fmtUgxFull(b.paid_amount)} / {fmtUgxFull(b.total_amount)}</span>
                    </div>
                    <Progress value={paidPct} className="h-2" />
                    {balance > 0 ? (
                      <p className="mt-1 text-xs text-amber-600">Balance: {fmtUgxFull(balance)}</p>
                    ) : Number(b.total_amount) > 0 ? (
                      <p className="mt-1 text-xs text-green-600">✓ Paid in full</p>
                    ) : null}
                  </div>

                  {payments.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium">Payment history</p>
                      <div className="space-y-1">
                        {payments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(p.created_at).toLocaleDateString()}</span>
                              <Badge variant="outline" className="text-[10px] capitalize">{p.method?.replace("manual_", "")}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{fmtUgx(p.amount)}</span>
                              <Badge variant={p.status === "completed" ? "default" : "secondary"} className="text-[10px] capitalize">{p.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {op && (
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                      {op.contact_phone && (
                        <a href={`tel:${op.contact_phone}`}>
                          <Button size="sm" variant="outline"><Phone className="mr-1 h-3 w-3" />Call operator</Button>
                        </a>
                      )}
                      {op.whatsapp && (
                        <a href={`https://wa.me/${op.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">WhatsApp</Button>
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
