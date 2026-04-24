import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Navigation, Star, LocateFixed, AlertTriangle, Loader2, MessageSquare, Phone, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Fix default Leaflet icons (Vite/CDN safe)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const mosqueIcon = L.divIcon({
  className: "",
  html: `<div style="background:hsl(var(--primary));color:white;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.3);border:2px solid white"><div style="transform:rotate(45deg);font-size:18px">🕌</div></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32],
});

interface Masjid {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  imam_name: string | null;
  contact_phone: string | null;
  facilities: string[] | null;
  description: string | null;
  image_url: string | null;
  verified: boolean;
}

interface Review {
  id: string;
  masjid_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Recenter = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.2 });
  }, [center, map]);
  return null;
};

// Fix the "blue empty map" bug by invalidating the map size once layout is ready.
const InvalidateOnReady = () => {
  const map = useMap();
  useEffect(() => {
    const timers = [50, 250, 700].map((d) => setTimeout(() => map.invalidateSize(), d));
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
};

const KAMPALA: [number, number] = [0.3163, 32.5650];

const MapPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [permState, setPermState] = useState<"prompt" | "granted" | "denied" | "loading">("loading");
  const [selected, setSelected] = useState<Masjid | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const promptedRef = useRef(false);

  // Suggest mosque dialog
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sugBusy, setSugBusy] = useState(false);
  const [sug, setSug] = useState({ name: "", address: "", city: "Kampala", district: "", latitude: "", longitude: "", imam_name: "", contact_phone: "", description: "" });

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setPermState("denied");
      toast.error("Geolocation not supported by this device");
      return;
    }
    setPermState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setPermState("granted");
        toast.success("Location enabled — showing nearby mosques");
      },
      (err) => {
        setPermState(err.code === err.PERMISSION_DENIED ? "denied" : "prompt");
        toast.error(err.code === err.PERMISSION_DENIED ? "Location denied. Showing Kampala center." : "Couldn't get location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  // Always ask for permission on mount
  useEffect(() => {
    if (promptedRef.current) return;
    promptedRef.current = true;
    requestLocation();
    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000 },
      );
      return () => navigator.geolocation.clearWatch(id);
    }
  }, []);

  const { data: masjids = [], isLoading } = useQuery({
    queryKey: ["masjids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masjids")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as Masjid[];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["mosque_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosque_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  // Realtime — reviews + masjid changes
  useEffect(() => {
    const channel = supabase
      .channel("masjid-map-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "mosque_reviews" }, () => {
        qc.invalidateQueries({ queryKey: ["mosque_reviews"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "masjids" }, () => {
        qc.invalidateQueries({ queryKey: ["masjids"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const center = position ?? KAMPALA;

  const sorted = useMemo(() => {
    if (!position) return masjids;
    return [...masjids].sort(
      (a, b) =>
        haversine(position[0], position[1], a.latitude, a.longitude) -
        haversine(position[0], position[1], b.latitude, b.longitude),
    );
  }, [masjids, position]);

  const reviewsByMosque = useMemo(() => {
    const map = new Map<string, Review[]>();
    reviews.forEach((r) => {
      const list = map.get(r.masjid_id) ?? [];
      list.push(r);
      map.set(r.masjid_id, list);
    });
    return map;
  }, [reviews]);

  const avg = (id: string) => {
    const list = reviewsByMosque.get(id) ?? [];
    if (!list.length) return null;
    return (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1);
  };

  const submitReview = async () => {
    if (!user) return toast.error("Sign in to leave a review");
    if (!selected) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("mosque_reviews")
      .upsert(
        { masjid_id: selected.id, user_id: user.id, rating, comment: comment.trim() || null },
        { onConflict: "masjid_id,user_id" },
      );
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Review posted");
    setComment("");
    setRating(5);
  };

  const useMyLocationForSuggestion = () => {
    if (position) {
      setSug({ ...sug, latitude: String(position[0]), longitude: String(position[1]) });
      toast.success("Coordinates filled from your location");
    } else {
      requestLocation();
    }
  };

  const submitSuggestion = async () => {
    if (!user) {
      toast.error("Sign in to suggest a mosque");
      return;
    }
    if (!sug.name || !sug.latitude || !sug.longitude) {
      toast.error("Name and coordinates are required");
      return;
    }
    setSugBusy(true);
    const { error } = await supabase.from("masjid_submissions").insert({
      user_id: user.id,
      name: sug.name,
      address: sug.address || null,
      city: sug.city || null,
      district: sug.district || null,
      latitude: parseFloat(sug.latitude),
      longitude: parseFloat(sug.longitude),
      imam_name: sug.imam_name || null,
      contact_phone: sug.contact_phone || null,
      description: sug.description || null,
    });
    setSugBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted! An admin will review it shortly.");
    setSug({ name: "", address: "", city: "Kampala", district: "", latitude: "", longitude: "", imam_name: "", contact_phone: "", description: "" });
    setSuggestOpen(false);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="px-4 pb-3 pt-5 md:px-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Masjid Map</h1>
                <p className="text-sm text-muted-foreground">Find nearby mosques and share live reviews</p>
              </div>
            </div>
            <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="gold" className="gap-1 shrink-0"><Plus className="h-4 w-4" /> Suggest</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Suggest a missing mosque</DialogTitle></DialogHeader>
                <p className="text-xs text-muted-foreground">Submissions are reviewed by an admin before going live on the map.</p>
                <div className="space-y-3">
                  <div><Label>Mosque name *</Label><Input value={sug.name} onChange={(e) => setSug({ ...sug, name: e.target.value })} /></div>
                  <div><Label>Address</Label><Input value={sug.address} onChange={(e) => setSug({ ...sug, address: e.target.value })} placeholder="Street, area" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>City</Label><Input value={sug.city} onChange={(e) => setSug({ ...sug, city: e.target.value })} /></div>
                    <div><Label>District</Label><Input value={sug.district} onChange={(e) => setSug({ ...sug, district: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Latitude *</Label><Input type="number" step="0.000001" value={sug.latitude} onChange={(e) => setSug({ ...sug, latitude: e.target.value })} /></div>
                    <div><Label>Longitude *</Label><Input type="number" step="0.000001" value={sug.longitude} onChange={(e) => setSug({ ...sug, longitude: e.target.value })} /></div>
                  </div>
                  <Button variant="outline" size="sm" type="button" onClick={useMyLocationForSuggestion} className="w-full gap-1">
                    <LocateFixed className="h-3 w-3" /> Use my current location
                  </Button>
                  <div><Label>Imam (optional)</Label><Input value={sug.imam_name} onChange={(e) => setSug({ ...sug, imam_name: e.target.value })} /></div>
                  <div><Label>Phone (optional)</Label><Input value={sug.contact_phone} onChange={(e) => setSug({ ...sug, contact_phone: e.target.value })} /></div>
                  <div><Label>Description / notes</Label><Textarea value={sug.description} onChange={(e) => setSug({ ...sug, description: e.target.value })} /></div>
                  <Button onClick={submitSuggestion} disabled={sugBusy} className="w-full">
                    {sugBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for review"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {permState === "denied" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-urgent/30 bg-urgent/5 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-urgent" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Location permission denied</p>
              <p className="text-muted-foreground">Enable location in your browser settings to see distance to each mosque.</p>
            </div>
            <Button size="sm" variant="outline" onClick={requestLocation}>Retry</Button>
          </div>
        )}
      </section>

      {/* Map */}
      <section className="px-4 md:px-6">
        <div className="relative h-[55vh] w-full overflow-hidden rounded-xl border bg-muted shadow-emerald">
          {isLoading && (
            <div className="absolute inset-0 z-[400] flex items-center justify-center bg-card/60 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <InvalidateOnReady />
            <Recenter center={position} />
            {position && (
              <CircleMarker
                center={position}
                radius={9}
                pathOptions={{ color: "hsl(var(--primary))", fillColor: "hsl(var(--primary))", fillOpacity: 0.7, weight: 3 }}
              >
                <Popup>You are here</Popup>
              </CircleMarker>
            )}
            {masjids.map((m) => (
              <Marker
                key={m.id}
                position={[m.latitude, m.longitude]}
                icon={mosqueIcon}
                eventHandlers={{ click: () => setSelected(m) }}
              >
                <Popup>
                  <div className="min-w-[160px] space-y-1">
                    <p className="text-sm font-semibold">{m.name}</p>
                    {m.address && <p className="text-xs text-muted-foreground">{m.address}</p>}
                    <button
                      onClick={() => setSelected(m)}
                      className="text-xs font-medium text-primary underline"
                    >
                      Open details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <button
            onClick={requestLocation}
            className="absolute bottom-3 right-3 z-[500] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-emerald transition hover:scale-105"
            aria-label="Recenter to my location"
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Nearby list */}
      <section className="px-4 py-5 md:px-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {position ? "Nearest Mosques" : "All Mosques"}
            </h2>
            <p className="text-xs text-muted-foreground">{sorted.length} listed</p>
          </div>
          {!user && (
            <Link to="/auth">
              <Button size="sm" variant="outline">Sign in to review</Button>
            </Link>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => {
            const dist = position ? haversine(position[0], position[1], m.latitude, m.longitude) : null;
            const a = avg(m.id);
            const count = reviewsByMosque.get(m.id)?.length ?? 0;
            return (
              <Card key={m.id} className="cursor-pointer transition hover:shadow-emerald" onClick={() => setSelected(m)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.address || m.city || "—"}</p>
                    </div>
                    {m.verified && <Badge variant="secondary" className="text-[10px]">Verified</Badge>}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Navigation className="h-3 w-3" />
                      {dist !== null ? `${dist.toFixed(1)} km` : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span className="font-medium text-foreground">{a ?? "—"}</span>
                      <span className="text-muted-foreground">({count})</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 shadow-2xl md:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">{selected.name}</h3>
                  {selected.address && <p className="text-sm text-muted-foreground">{selected.address}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {selected.imam_name && (
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-muted-foreground">Imam</p>
                    <p className="font-medium text-foreground">{selected.imam_name}</p>
                  </div>
                )}
                {selected.contact_phone && (
                  <a href={`tel:${selected.contact_phone}`} className="flex items-center gap-2 rounded-md bg-primary/10 p-2 text-primary">
                    <Phone className="h-3 w-3" /> {selected.contact_phone}
                  </a>
                )}
              </div>

              {selected.description && (
                <p className="mt-3 text-sm text-muted-foreground">{selected.description}</p>
              )}

              <a
                href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex w-full"
              >
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <Navigation className="h-3 w-3" /> Open directions
                </Button>
              </a>

              {/* Reviews */}
              <div className="mt-5 border-t pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-primary" /> Reviews</h4>
                  <span className="text-xs text-muted-foreground">{(reviewsByMosque.get(selected.id) ?? []).length} total</span>
                </div>

                {user ? (
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                          <Star className={`h-5 w-5 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience…"
                      maxLength={500}
                      className="min-h-[60px] text-sm"
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={submitReview} disabled={submitting}>
                        {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post review"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="w-full">Sign in to leave a review</Button>
                  </Link>
                )}

                <div className="mt-3 space-y-2">
                  {(reviewsByMosque.get(selected.id) ?? []).slice(0, 8).map((r) => (
                    <div key={r.id} className="rounded-md border bg-card p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`h-3 w-3 ${n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      {r.comment && <p className="mt-1 text-xs text-foreground">{r.comment}</p>}
                    </div>
                  ))}
                  {(reviewsByMosque.get(selected.id) ?? []).length === 0 && (
                    <p className="py-3 text-center text-xs text-muted-foreground">Be the first to review.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapPage;
