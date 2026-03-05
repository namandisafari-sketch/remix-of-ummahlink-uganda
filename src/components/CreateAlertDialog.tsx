import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CreateAlertDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"janaza" | "sos">("janaza");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [contact, setContact] = useState("");
  const [urgent, setUrgent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("alerts_janaza").insert({
        user_id: user.id,
        type,
        title,
        description: description || null,
        time,
        location,
        maps_link: mapsLink || null,
        contact,
        urgent,
      });
      if (error) throw error;
      toast.success("Alert posted successfully!");
      onOpenChange(false);
      onCreated();
      // Reset
      setTitle(""); setDescription(""); setTime(""); setLocation("");
      setMapsLink(""); setContact(""); setUrgent(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to post alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Post Community Alert</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button type="button" variant={type === "janaza" ? "default" : "outline"} size="sm" onClick={() => setType("janaza")}>
              Janaza
            </Button>
            <Button type="button" variant={type === "sos" ? "urgent" : "outline"} size="sm" onClick={() => setType("sos")}>
              SOS
            </Button>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Janaza – Br. Ahmed" required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Time *</Label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Today, 2:00 PM" required />
            </div>
            <div>
              <Label>Contact *</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+256 700..." required />
            </div>
          </div>
          <div>
            <Label>Location *</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Masjid Noor, Kampala" required />
          </div>
          <div>
            <Label>Google Maps Link</Label>
            <Input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={urgent} onCheckedChange={setUrgent} />
            <Label>Mark as urgent</Label>
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Alert"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAlertDialog;
