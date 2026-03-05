import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, DollarSign, Clock } from "lucide-react";

const formatUGX = (amount: number) =>
  `UGX ${amount.toLocaleString()}`;

const statusColors: Record<string, "default" | "gold" | "urgent" | "secondary"> = {
  completed: "default",
  pending: "gold",
  failed: "urgent",
  cancelled: "secondary",
};

const AdminDonations = () => {
  const { data: donations, isLoading } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*, mosque_projects(name, mosque)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const completed = donations?.filter((d) => d.status === "completed") || [];
  const totalRaised = completed.reduce((sum, d) => sum + d.amount, 0);
  const pending = donations?.filter((d) => d.status === "pending") || [];

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="font-display text-2xl font-bold text-primary">{formatUGX(totalRaised)}</p>
            <p className="text-xs text-muted-foreground">Total Raised</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="font-display text-2xl font-bold text-foreground">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto mb-2 h-6 w-6 text-accent" />
            <p className="font-display text-2xl font-bold text-foreground">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Donation History</CardTitle>
        </CardHeader>
        <CardContent>
          {donations?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No donations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations?.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.donor_name || "Anonymous"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {(d.mosque_projects as any)?.name || "—"}
                      </TableCell>
                      <TableCell className="font-medium">{formatUGX(d.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">{d.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[d.status] || "secondary"}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(d.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDonations;
