import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyOperator } from "@/hooks/useMyOperator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Users, Plane } from "lucide-react";
import { fmtUgx, daysUntil } from "@/lib/format";
import { format } from "date-fns";

const OperatorSchedules = () => {
  const { data: operator } = useMyOperator();

  const { data, isLoading } = useQuery({
    queryKey: ["operator-schedules", operator?.id],
    enabled: !!operator,
    queryFn: async () => {
      const opId = operator!.id;
      const [pkgRes, bookRes] = await Promise.all([
        supabase.from("tour_packages").select("*").eq("operator_id", opId).order("departure_date", { ascending: true }),
        (supabase.from("tour_bookings") as any).select("*").eq("operator_id", opId).neq("status", "cancelled"),
      ]);
      return {
        packages: (pkgRes.data ?? []) as any[],
        bookings: (bookRes.data ?? []) as any[],
      };
    },
  });

  const schedules = useMemo(() => {
    if (!data) return [];
    return data.packages.map((p: any) => {
      const bookings = data.bookings.filter((b: any) => b.package_id === p.id);
      const seatsBooked = bookings.length;
      const seatsTotal = p.seats_available ?? 0;
      const seatsLeft = Math.max(0, seatsTotal - seatsBooked);
      const collected = bookings.reduce((s, b) => s + Number(b.paid_amount), 0);
      const expected = bookings.reduce((s, b) => s + Number(b.total_amount), 0);
      const outstanding = expected - collected;
      const days = daysUntil(p.departure_date);
      return { p, bookings, seatsBooked, seatsTotal, seatsLeft, collected, expected, outstanding, days };
    }).sort((a, b) => {
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    });
  }, [data]);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Schedules</h1>
        <p className="text-sm text-muted-foreground">Track departures, seats, and revenue per package</p>
      </div>

      {schedules.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          No packages yet. Create one in the Packages tab.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {schedules.map(({ p, seatsBooked, seatsTotal, seatsLeft, collected, expected, outstanding, days }) => {
            const seatPct = seatsTotal > 0 ? (seatsBooked / seatsTotal) * 100 : 0;
            const tone = days === null ? "secondary" : days < 0 ? "outline" : days <= 7 ? "destructive" : days <= 30 ? "default" : "secondary";
            return (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge>{p.type?.toUpperCase()}</Badge>
                        <Badge variant="outline" className="capitalize">{p.tier}</Badge>
                      </div>
                    </div>
                    <Badge variant={tone as any} className="shrink-0">
                      {days === null ? "No date" : days < 0 ? "Departed" : days === 0 ? "Today" : `${days}d`}
                    </Badge>
                  </div>

                  {p.departure_date && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(p.departure_date), "PPP")}
                    </p>
                  )}

                  {/* Seats */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />Seats</span>
                      <span className="font-medium">{seatsBooked}/{seatsTotal || "—"}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, seatPct)}%` }}
                      />
                    </div>
                    {seatsTotal > 0 && (
                      <p className="mt-1 text-[10px] text-muted-foreground">{seatsLeft} left</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Expected</p>
                      <p className="font-semibold">{fmtUgx(expected)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Collected</p>
                      <p className="font-semibold text-green-600">{fmtUgx(collected)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Outstanding</p>
                      <p className={`font-semibold ${outstanding > 0 ? "text-amber-600" : ""}`}>{fmtUgx(outstanding)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OperatorSchedules;
