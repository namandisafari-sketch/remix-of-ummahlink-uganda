import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart, Landmark, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const formatUGX = (amount: number) =>
  amount >= 1000000 ? `UGX ${(amount / 1000000).toFixed(1)}M` : `UGX ${(amount / 1000).toFixed(0)}K`;

const DonationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [donorName, setDonorName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["mosque-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosque_projects")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleDonate = async () => {
    if (!user) {
      toast.error("Please sign in to donate");
      navigate("/auth");
      return;
    }
    if (!amount || !phone) {
      toast.error("Please fill in amount and phone number");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("pesapal-payment", {
        body: {
          project_id: selectedProject.id,
          amount: Number(amount),
          phone,
          donor_name: donorName,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.redirect_url) {
        toast.success("Redirecting to Pesapal...");
        window.open(data.redirect_url, "_blank");
      }
      setSelectedProject(null);
      setAmount("");
      setPhone("");
      setDonorName("");
    } catch (err: any) {
      toast.error(err.message || "Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Donation Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Support mosque projects with full transparency. Payments via MTN & Airtel Mobile Money.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project, i) => {
            const percent = project.goal > 0 ? Math.round((project.raised / project.goal) * 100) : 0;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="flex h-full flex-col overflow-hidden">
                  {project.image_url && (
                    <img src={project.image_url} alt={project.name} className="h-40 w-full object-cover" loading="lazy" />
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Landmark className="h-4 w-4" />
                      {project.mosque}
                    </div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                    {(project.location || project.beneficiaries) && (
                      <p className="text-xs text-muted-foreground">
                        {project.location}{project.location && project.beneficiaries ? " • " : ""}
                        {project.beneficiaries ? `${project.beneficiaries.toLocaleString()} beneficiaries` : ""}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4">
                    {project.video_links?.length > 0 && (
                      <a href={project.video_links[0]} target="_blank" rel="noreferrer" className="block text-xs font-medium text-primary underline">
                        ▶ Watch project video
                      </a>
                    )}
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-foreground">{formatUGX(project.raised)} raised</span>
                        <span className="text-muted-foreground">of {formatUGX(project.goal)}</span>
                      </div>
                      <Progress value={Math.min(percent, 100)} className="h-3" />
                      <p className="mt-1 text-right text-xs text-muted-foreground">{percent}% funded</p>
                    </div>
                    <Button
                      variant="gold"
                      className="w-full gap-2"
                      onClick={() => setSelectedProject(project)}
                    >
                      <Heart className="h-4 w-4" /> Donate via Mobile Money
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Donation Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Donate to {selectedProject?.name}</DialogTitle>
            <DialogDescription>{selectedProject?.mosque}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="donorName">Your Name (optional)</Label>
              <Input
                id="donorName"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Anonymous"
              />
            </div>
            <div>
              <Label htmlFor="phone">Mobile Money Number *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0770123456"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">MTN or Airtel Uganda number</p>
            </div>
            <div>
              <Label htmlFor="amount">Amount (UGX) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                min="500"
                required
              />
              <div className="mt-2 flex gap-2">
                {[5000, 10000, 50000, 100000].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(preset))}
                  >
                    {preset >= 1000 ? `${preset / 1000}K` : preset}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              variant="hero"
              className="w-full gap-2"
              onClick={handleDonate}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><Heart className="h-4 w-4" /> Pay {amount ? `UGX ${Number(amount).toLocaleString()}` : ""}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonationsPage;
