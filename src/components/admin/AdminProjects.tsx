import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const formatUGX = (amount: number) =>
  amount >= 1000000 ? `UGX ${(amount / 1000000).toFixed(1)}M` : `UGX ${(amount / 1000).toFixed(0)}K`;

const AdminProjects = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [mosque, setMosque] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosque_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const openCreate = () => {
    setEditing(null);
    setName(""); setMosque(""); setDescription(""); setGoal("");
    setShowForm(true);
  };

  const openEdit = (project: any) => {
    setEditing(project);
    setName(project.name);
    setMosque(project.mosque);
    setDescription(project.description || "");
    setGoal(String(project.goal));
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        mosque,
        description: description || null,
        goal: Number(goal),
      };

      if (editing) {
        const { error } = await supabase
          .from("mosque_projects")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Project updated");
      } else {
        const { error } = await supabase
          .from("mosque_projects")
          .insert(payload);
        if (error) throw error;
        toast.success("Project created");
      }

      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["mosque-projects"] });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const { error } = await supabase.from("mosque_projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    }
  };

  const handleToggleActive = async (project: any) => {
    const { error } = await supabase
      .from("mosque_projects")
      .update({ active: !project.active })
      .eq("id", project.id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-xl">Mosque Projects</CardTitle>
        <Button variant="hero" size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Project
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Mosque</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects?.map((p) => {
                const pct = p.goal > 0 ? Math.round((p.raised / p.goal) * 100) : 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.mosque}</TableCell>
                    <TableCell>
                      <div className="w-32">
                        <Progress value={Math.min(pct, 100)} className="h-2" />
                        <span className="text-xs text-muted-foreground">{formatUGX(p.raised)} / {formatUGX(p.goal)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant={p.active ? "default" : "outline"} size="sm" onClick={() => handleToggleActive(p)}>
                        {p.active ? "Active" : "Inactive"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Project Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Mosque *</Label>
              <Input value={mosque} onChange={(e) => setMosque(e.target.value)} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Goal (UGX) *</Label>
              <Input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} min="1" required />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminProjects;
