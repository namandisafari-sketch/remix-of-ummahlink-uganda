import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyOperator } from "@/hooks/useMyOperator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Inbox, Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const OperatorInquiries = () => {
  const { data: operator } = useMyOperator();
  const qc = useQueryClient();

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["my-inquiries", operator?.id],
    enabled: !!operator?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_inquiries").select("*").eq("operator_id", operator!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tour_inquiries").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-inquiries", operator!.id] });
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Inquiries</h1>
        <p className="text-sm text-muted-foreground">{inquiries?.length ?? 0} total inquiries</p>
      </div>

      {inquiries?.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          <Inbox className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
          No inquiries yet.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {inquiries?.map((i: any) => (
            <Card key={i.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{i.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{i.phone}</p>
                    {i.email && <p className="text-xs text-muted-foreground">{i.email}</p>}
                  </div>
                  <Select value={i.status} onValueChange={(v) => updateStatus(i.id, v)}>
                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {i.message && <p className="text-sm">{i.message}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
                  <a href={`https://wa.me/${i.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1"><MessageCircle className="h-3 w-3" />Reply on WhatsApp</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperatorInquiries;
