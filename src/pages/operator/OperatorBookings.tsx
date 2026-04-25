import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMyOperator } from "@/hooks/useMyOperator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Loader2, Plus, Phone, MessageCircle, Wallet, Pencil, Trash2, Search, Users, Calendar,
} from "lucide-react";
import { fmtUgx, daysUntil } from "@/lib/format";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const STATUSES = ["all", "pending", "confirmed", "completed", "cancelled"];

const emptyBooking = {
  package_id: "",
  passenger_name: "",
  passenger_phone: "",
  passenger_email: "",
  passport_no: "",
  emergency_contact: "",
  notes: "",
  total_amount: "",
  departure_date: "",
  status: "pending",
};

const OperatorBookings = () => {
  const { user } = useAuth();
  const { data: operator } = useMyOperator();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pkgFilter, setPkgFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyBooking);

  const { data, isLoading } = useQuery({
    queryKey: ["operator-bookings", operator?.id],
    enabled: !!operator,
    queryFn: async () => {
      const opId = operator!.id;
      const [b, p] = await Promise.all([
        (supabase.from("tour_bookings") as any).select("*").eq("operator_id", opId).order("created_at", { ascending: false }),
        supabase.from("tour_packages").select("id, name, type, tier, price_ugx, departure_date").eq("operator_id", opId),
      ]);
      return { bookings: (b.data ?? []) as any[], packages: (p.data ?? []) as any[] };
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.bookings.filter((b: any) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (pkgFilter !== "all" && b.package_id !== pkgFilter) return false;
      if (q && !`${b.passenger_name} ${b.passenger_phone} ${b.passport_no ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, statusFilter, pkgFilter]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyBooking);
    setOpen(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      package_id: b.package_id ?? "",
      passenger_name: b.passenger_name ?? "",
      passenger_phone: b.passenger_phone ?? "",
      passenger_email: b.passenger_email ?? "",
      passport_no: b.passport_no ?? "",
      emergency_contact: b.emergency_contact ?? "",
      notes: b.notes ?? "",
      total_amount: String(b.total_amount ?? ""),
      departure_date: b.departure_date ?? "",
      status: b.status,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.package_id || !form.passenger_name || !form.passenger_phone) {
      toast.error("Package, name and phone required");
      return;
    }
    const pkg = data?.packages.find((p: any) => p.id === form.package_id);
    const payload: any = {
      operator_id: operator!.id,
      package_id: form.package_id,
      passenger_name: form.passenger_name.trim(),
      passenger_phone: form.passenger_phone.trim(),
      passenger_email: form.passenger_email?.trim() || null,
      passport_no: form.passport_no?.trim() || null,
      emergency_contact: form.emergency_contact?.trim() || null,
      notes: form.notes?.trim() || null,
      total_amount: Number(form.total_amount) || Number(pkg?.price_ugx) || 0,
      departure_date: form.departure_date || pkg?.departure_date || null,
      status: form.status,
    };

    const res = editing
      ? await (supabase.from("tour_bookings") as any).update(payload).eq("id", editing.id)
      : await (supabase.from("tour_bookings") as any).insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Booking updated" : "Booking created");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["operator-bookings", operator?.id] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this booking and all its payment records?")) return;
    const { error } = await (supabase.from("tour_bookings") as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking deleted");
    qc.invalidateQueries({ queryKey: ["operator-bookings", operator?.id] });
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground">{data?.bookings.length ?? 0} total bookings</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />New booking</Button>
      </div>

      {/* Filters */}
      <Card><CardContent className="grid gap-2 p-3 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, phone, passport…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={pkgFilter} onValueChange={setPkgFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All packages</SelectItem>
            {data?.packages.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent></Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
          No bookings match your filters.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((b: any) => {
            const pkg = data?.packages.find((p: any) => p.id === b.package_id);
            const balance = Number(b.total_amount) - Number(b.paid_amount);
            const days = daysUntil(b.departure_date);
            const paidPct = Number(b.total_amount) > 0 ? Math.round((Number(b.paid_amount) / Number(b.total_amount)) * 100) : 0;
            return (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{b.passenger_name}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">{b.status}</Badge>
                        {b.passport_no && <Badge variant="outline" className="text-[10px]">PP: {b.passport_no}</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{pkg?.name ?? "—"}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.passenger_phone}</span>
                        {b.departure_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(b.departure_date), "PP")}
                            {days !== null && days >= 0 && <span className="ml-1 text-primary">({days}d)</span>}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{fmtUgx(b.paid_amount)}<span className="text-xs font-normal text-muted-foreground"> / {fmtUgx(b.total_amount)}</span></p>
                      {balance > 0 && <p className="text-xs text-amber-600">Bal: {fmtUgx(balance)}</p>}
                      {balance <= 0 && Number(b.total_amount) > 0 && <p className="text-xs text-green-600">Paid in full</p>}
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(100, paidPct)}%` }} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/operator/payments?booking=${b.id}`}><Wallet className="mr-1 h-3 w-3" />Payments</Link>
                    </Button>
                    <a href={`https://wa.me/${b.passenger_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline"><MessageCircle className="mr-1 h-3 w-3" />WhatsApp</Button>
                    </a>
                    <Button size="sm" variant="outline" onClick={() => openEdit(b)}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(b.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit booking" : "New booking"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-sm">Package *</Label>
              <Select value={form.package_id} onValueChange={(v) => {
                const pkg = data?.packages.find((p: any) => p.id === v);
                setForm({ ...form, package_id: v, total_amount: form.total_amount || String(pkg?.price_ugx ?? ""), departure_date: form.departure_date || pkg?.departure_date || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Choose package" /></SelectTrigger>
                <SelectContent>
                  {data?.packages.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} — {fmtUgx(p.price_ugx)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Field label="Passenger name *" v={form.passenger_name} onChange={(v) => setForm({ ...form, passenger_name: v })} />
            <Field label="Phone *" v={form.passenger_phone} onChange={(v) => setForm({ ...form, passenger_phone: v })} placeholder="+256..." />
            <Field label="Email" v={form.passenger_email} onChange={(v) => setForm({ ...form, passenger_email: v })} type="email" />
            <Field label="Passport no" v={form.passport_no} onChange={(v) => setForm({ ...form, passport_no: v })} />
            <Field label="Emergency contact" v={form.emergency_contact} onChange={(v) => setForm({ ...form, emergency_contact: v })} />
            <Field label="Total amount (UGX) *" v={form.total_amount} onChange={(v) => setForm({ ...form, total_amount: v })} type="number" />
            <Field label="Departure date" v={form.departure_date} onChange={(v) => setForm({ ...form, departure_date: v })} type="date" />
            <div>
              <Label className="mb-1 block text-sm">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.filter((s) => s !== "all").map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-sm">Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <Button onClick={save}>Save booking</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, v, onChange, type = "text", placeholder }: any) => (
  <div>
    <Label className="mb-1 block text-sm">{label}</Label>
    <Input type={type} value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export default OperatorBookings;
