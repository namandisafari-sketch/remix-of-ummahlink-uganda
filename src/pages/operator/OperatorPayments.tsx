import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Wallet, Trash2, CheckCircle2 } from "lucide-react";
import { fmtUgx, fmtUgxFull } from "@/lib/format";
import { toast } from "sonner";

const METHODS = [
  { value: "manual_cash", label: "Cash" },
  { value: "manual_momo", label: "Mobile Money" },
  { value: "manual_bank", label: "Bank Transfer" },
  { value: "pesapal", label: "Pesapal (online)" },
];

const OperatorPayments = () => {
  const { user } = useAuth();
  const { data: operator } = useMyOperator();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const bookingFromUrl = params.get("booking");
  const [bookingFilter, setBookingFilter] = useState(bookingFromUrl ?? "all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ booking_id: bookingFromUrl ?? "", amount: "", method: "manual_cash", reference: "", note: "" });

  useEffect(() => {
    if (bookingFromUrl) {
      setBookingFilter(bookingFromUrl);
      setForm((f) => ({ ...f, booking_id: bookingFromUrl }));
    }
  }, [bookingFromUrl]);

  const { data, isLoading } = useQuery({
    queryKey: ["operator-payments", operator?.id],
    enabled: !!operator,
    queryFn: async () => {
      const opId = operator!.id;
      const [bRes, pRes] = await Promise.all([
        (supabase.from("tour_bookings") as any).select("*").eq("operator_id", opId).order("created_at", { ascending: false }),
        (supabase.from("tour_booking_payments") as any).select("*, tour_bookings!inner(operator_id, passenger_name)").eq("tour_bookings.operator_id", opId).order("created_at", { ascending: false }),
      ]);
      return { bookings: (bRes.data ?? []) as any[], payments: (pRes.data ?? []) as any[] };
    },
  });

  const filteredPayments = useMemo(() => {
    if (!data) return [];
    return bookingFilter === "all" ? data.payments : data.payments.filter((p: any) => p.booking_id === bookingFilter);
  }, [data, bookingFilter]);

  const totals = useMemo(() => {
    if (!data) return { collected: 0, pending: 0, count: 0 };
    let collected = 0, pending = 0;
    data.payments.forEach((p: any) => {
      if (p.status === "completed") collected += Number(p.amount);
      else if (p.status === "pending") pending += Number(p.amount);
    });
    return { collected, pending, count: data.payments.length };
  }, [data]);

  const recordPayment = async () => {
    if (!form.booking_id || !form.amount) {
      toast.error("Choose a booking and enter an amount");
      return;
    }
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return toast.error("Invalid amount");

    const payload: any = {
      booking_id: form.booking_id,
      amount: amt,
      method: form.method,
      status: form.method === "pesapal" ? "pending" : "completed",
      reference: form.reference || null,
      note: form.note || null,
      recorded_by: user?.id ?? null,
      paid_at: form.method === "pesapal" ? null : new Date().toISOString(),
    };
    const { error } = await (supabase.from("tour_booking_payments") as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success(form.method === "pesapal" ? "Pesapal payment created (pending)" : "Payment recorded");
    setOpen(false);
    setForm({ booking_id: bookingFromUrl ?? "", amount: "", method: "manual_cash", reference: "", note: "" });
    qc.invalidateQueries({ queryKey: ["operator-payments", operator?.id] });
  };

  const markCompleted = async (id: string) => {
    const { error } = await (supabase.from("tour_booking_payments") as any)
      .update({ status: "completed", paid_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Payment marked completed");
    qc.invalidateQueries({ queryKey: ["operator-payments", operator?.id] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this payment record? Booking balance will recalculate.")) return;
    const { error } = await (supabase.from("tour_booking_payments") as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["operator-payments", operator?.id] });
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">Record deposits, installments, and reconcile payments</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Record payment</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-[11px] text-muted-foreground">Collected</p>
          <p className="text-lg font-bold text-green-600">{fmtUgx(totals.collected)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-[11px] text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-amber-600">{fmtUgx(totals.pending)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-[11px] text-muted-foreground">Records</p>
          <p className="text-lg font-bold">{totals.count}</p>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-3">
        <Select value={bookingFilter} onValueChange={setBookingFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All bookings</SelectItem>
            {data?.bookings.map((b: any) => (
              <SelectItem key={b.id} value={b.id}>
                {b.passenger_name} — {fmtUgx(b.total_amount)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent></Card>

      {filteredPayments.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          <Wallet className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
          No payments yet.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredPayments.map((p: any) => (
            <Card key={p.id}><CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{fmtUgxFull(p.amount)}</p>
                    <Badge variant={p.status === "completed" ? "default" : p.status === "pending" ? "secondary" : "destructive"} className="text-[10px] capitalize">{p.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{METHODS.find((m) => m.value === p.method)?.label ?? p.method}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.tour_bookings?.passenger_name}</p>
                  {p.reference && <p className="mt-0.5 text-[10px] text-muted-foreground">Ref: {p.reference}</p>}
                  {p.note && <p className="mt-0.5 text-xs">{p.note}</p>}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {p.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => markCompleted(p.id)}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />Mark paid
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-sm">Booking *</Label>
              <Select value={form.booking_id} onValueChange={(v) => setForm({ ...form, booking_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choose booking" /></SelectTrigger>
                <SelectContent>
                  {data?.bookings.map((b: any) => {
                    const bal = Number(b.total_amount) - Number(b.paid_amount);
                    return (
                      <SelectItem key={b.id} value={b.id}>
                        {b.passenger_name} — Bal {fmtUgx(bal)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-sm">Amount (UGX) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block text-sm">Method</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-sm">Reference (receipt no, txn id)</Label>
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block text-sm">Note</Label>
              <Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <Button className="w-full" onClick={recordPayment}>Save payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperatorPayments;
