import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyOperator } from "@/hooks/useMyOperator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  TrendingUp, Wallet, AlertCircle, Plane, Inbox, Users, Loader2,
  ArrowUpRight, Clock,
} from "lucide-react";
import { fmtUgx, daysUntil } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

const OperatorOverview = () => {
  const { data: operator } = useMyOperator();

  const { data, isLoading } = useQuery({
    queryKey: ["operator-overview", operator?.id],
    enabled: !!operator,
    queryFn: async () => {
      const opId = operator!.id;
      const [bookingsRes, paymentsRes, inquiriesRes, packagesRes] = await Promise.all([
        (supabase.from("tour_bookings") as any).select("*").eq("operator_id", opId),
        (supabase.from("tour_booking_payments") as any).select("*, tour_bookings!inner(operator_id)").eq("tour_bookings.operator_id", opId),
        supabase.from("tour_inquiries").select("*").eq("operator_id", opId),
        supabase.from("tour_packages").select("*").eq("operator_id", opId),
      ]);
      return {
        bookings: (bookingsRes.data ?? []) as any[],
        payments: (paymentsRes.data ?? []) as any[],
        inquiries: (inquiriesRes.data ?? []) as any[],
        packages: (packagesRes.data ?? []) as any[],
      };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const totalRevenue = data.payments.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
    const totalBooked = data.bookings.reduce((s, b) => s + Number(b.total_amount), 0);
    const outstanding = totalBooked - totalRevenue;
    const flyingSoon = data.bookings.filter((b) => {
      const d = daysUntil(b.departure_date);
      return d !== null && d >= 0 && d <= 30 && b.status !== "cancelled";
    });
    const inqCount = data.inquiries.length;
    const bookingCount = data.bookings.length;
    const paidInFull = data.bookings.filter((b) => Number(b.paid_amount) >= Number(b.total_amount) && Number(b.total_amount) > 0).length;

    // Package performance
    const byPackage = new Map<string, { name: string; type: string; tier: string; bookings: number; revenue: number }>();
    data.packages.forEach((p) => byPackage.set(p.id, { name: p.name, type: p.type, tier: p.tier, bookings: 0, revenue: 0 }));
    data.bookings.forEach((b) => {
      const pkg = byPackage.get(b.package_id);
      if (pkg) {
        pkg.bookings += 1;
        pkg.revenue += Number(b.paid_amount);
      }
    });
    const packagePerf = Array.from(byPackage.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    return { totalRevenue, totalBooked, outstanding, flyingSoon, inqCount, bookingCount, paidInFull, packagePerf };
  }, [data]);

  if (isLoading || !stats) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const conversion = stats.inqCount > 0 ? Math.round((stats.bookingCount / stats.inqCount) * 100) : 0;
  const completion = stats.bookingCount > 0 ? Math.round((stats.paidInFull / stats.bookingCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Your business at a glance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={Wallet} label="Revenue collected" value={fmtUgx(stats.totalRevenue)} tone="text-green-600 bg-green-500/10" />
        <KpiCard icon={AlertCircle} label="Outstanding" value={fmtUgx(stats.outstanding)} tone="text-amber-600 bg-amber-500/10" />
        <KpiCard icon={Users} label="Total bookings" value={String(stats.bookingCount)} tone="text-primary bg-primary/10" />
        <KpiCard icon={Plane} label="Flying ≤30 days" value={String(stats.flyingSoon.length)} tone="text-blue-600 bg-blue-500/10" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Conversion funnel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-base">Conversion funnel</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <FunnelRow icon={Inbox} label="Inquiries" value={stats.inqCount} max={Math.max(stats.inqCount, 1)} />
            <FunnelRow icon={Users} label="Bookings" value={stats.bookingCount} max={Math.max(stats.inqCount, 1)} />
            <FunnelRow icon={Wallet} label="Paid in full" value={stats.paidInFull} max={Math.max(stats.inqCount, 1)} />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Stat label="Inquiry → Booking" value={`${conversion}%`} />
              <Stat label="Booking → Paid" value={`${completion}%`} />
            </div>
          </CardContent>
        </Card>

        {/* Top packages */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Top packages by revenue</CardTitle>
            <Link to="/operator/packages" className="flex items-center gap-1 text-xs text-primary">
              Manage <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats.packagePerf.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.packagePerf} margin={{ left: -10, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtUgx(v)} />
                  <Tooltip formatter={(v: any) => fmtUgx(Number(v))} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {stats.packagePerf.map((p, i) => (
                      <Cell key={i} fill={p.type === "hajj" ? "hsl(var(--primary))" : "hsl(var(--soft-gold, 45 90% 55%))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Flying soon */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" /> Flying soon
          </CardTitle>
          <Link to="/operator/schedules" className="flex items-center gap-1 text-xs text-primary">
            All schedules <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {stats.flyingSoon.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No departures in the next 30 days.</p>
          ) : (
            <div className="space-y-2">
              {stats.flyingSoon.slice(0, 5).map((b: any) => {
                const days = daysUntil(b.departure_date)!;
                const balance = Number(b.total_amount) - Number(b.paid_amount);
                return (
                  <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.passenger_name}</p>
                      <p className="text-xs text-muted-foreground">{b.passenger_phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={days <= 7 ? "destructive" : "secondary"} className="text-[10px]">
                        <Clock className="mr-1 h-3 w-3" />{days === 0 ? "Today" : `${days}d`}
                      </Badge>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {balance > 0 ? `Bal: ${fmtUgx(balance)}` : "Paid in full"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, tone }: any) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold leading-none">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const FunnelRow = ({ icon: Icon, label, value, max }: any) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5"><Icon className="h-3 w-3" />{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
    <Progress value={(value / max) * 100} className="h-2" />
  </div>
);

const Stat = ({ label, value }: any) => (
  <div className="rounded-lg bg-muted/50 p-2 text-center">
    <p className="text-base font-bold">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export default OperatorOverview;
