import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Download, FileText } from "lucide-react";
import { toast } from "sonner";

const AdminResources = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = async (id: string, file_path: string) => {
    if (!confirm("Delete this resource permanently?")) return;
    await supabase.storage.from("resources").remove([file_path]).catch(() => null);
    const { error } = await supabase.from("shared_resources").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Resource deleted");
    qc.invalidateQueries({ queryKey: ["admin-resources"] });
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">{data?.length ?? 0} resources uploaded by the community.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((r: any) => {
          const url = supabase.storage.from("resources").getPublicUrl(r.file_path).data.publicUrl;
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">by {r.author}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>
                      {r.file_size && <Badge variant="outline" className="text-[10px]">{r.file_size}</Badge>}
                      <Badge variant="outline" className="text-[10px]">{r.downloads} dl</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full"><Download className="h-3 w-3" /> Open</Button>
                  </a>
                  <Button size="sm" variant="outline" onClick={() => remove(r.id, r.file_path)} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {data?.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No resources yet.</p>}
      </div>
    </div>
  );
};

export default AdminResources;
