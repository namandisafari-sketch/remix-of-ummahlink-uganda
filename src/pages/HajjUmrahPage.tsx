import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Search, MapPin, BadgeCheck, Star, Plane, SlidersHorizontal, Compass, Building2, Loader2,
} from "lucide-react";

const TYPES = ["all", "hajj", "umrah"] as const;
const TIERS = ["all", "economy", "standard", "vip", "family"] as const;
const MONTHS = [
  "all", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const fmtUgx = (n: number) =>
  n >= 1_000_000 ? `UGX ${(n / 1_000_000).toFixed(1)}M` : `UGX ${new Intl.NumberFormat().format(n)}`;

const HajjUmrahPage = () => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [tier, setTier] = useState<(typeof TIERS)[number]>("all");
  const [month, setMonth] = useState<string>("all");
  const [district, setDistrict] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tour-operators-with-packages"],
    queryFn: async () => {
      const [{ data: ops, error: oe }, { data: pkgs, error: pe }, { data: revs, error: re }] = await Promise.all([
        supabase.from("tour_operators").select("*").eq("active", true).order("verified", { ascending: false }),
        supabase.from("tour_packages").select("*").eq("active", true),
        supabase.from("tour_reviews").select("operator_id, rating"),
      ]);
      if (oe) throw oe;
      if (pe) throw pe;
      if (re) throw re;
      const pkgByOp = new Map<string, any[]>();
      (pkgs ?? []).forEach((p: any) => {
        const list = pkgByOp.get(p.operator_id) ?? [];
        list.push(p);
        pkgByOp.set(p.operator_id, list);
      });
      const ratingByOp = new Map<string, { avg: number; count: number }>();
      (revs ?? []).forEach((r: any) => {
        const cur = ratingByOp.get(r.operator_id) ?? { avg: 0, count: 0 };
        const total = cur.avg * cur.count + r.rating;
        const count = cur.count + 1;
        ratingByOp.set(r.operator_id, { avg: total / count, count });
      });
      return (ops ?? []).map((o: any) => ({
        ...o,
        packages: pkgByOp.get(o.id) ?? [],
        rating: ratingByOp.get(o.id) ?? { avg: 0, count: 0 },
      }));
    },
  });

  const districts = useMemo(() => {
    const s = new Set<string>();
    data?.forEach((o: any) => o.district && s.add(o.district));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const max = maxPrice ? Number(maxPrice) : null;
    return data
      .map((o: any) => {
        const pkgMatch = o.packages.filter((p: any) => {
          if (type !== "all" && p.type !== type) return false;
          if (tier !== "all" && p.tier !== tier) return false;
          if (month !== "all" && p.departure_month !== month) return false;
          if (max && Number(p.price_ugx) > max) return false;
          return true;
        });
        return { ...o, _matchedPackages: pkgMatch };
      })
      .filter((o: any) => {
        if (verifiedOnly && !o.verified) return false;
        if (district !== "all" && o.district !== district) return false;
        if (q && !`${o.name} ${o.city ?? ""} ${o.district ?? ""}`.toLowerCase().includes(q)) return false;
        // If user picked package filters, hide operators with no matches
        const hasFilters = type !== "all" || tier !== "all" || month !== "all" || max;
        if (hasFilters && o._matchedPackages.length === 0) return false;
        return true;
      });
  }, [data, search, type, tier, month, district, maxPrice, verifiedOnly]);

  const activeFilterCount =
    (type !== "all" ? 1 : 0) +
    (tier !== "all" ? 1 : 0) +
    (month !== "all" ? 1 : 0) +
    (district !== "all" ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  const Filters = (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      <Select value={type} onValueChange={(v) => setType(v as any)}>
        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All types" : t.toUpperCase()}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={tier} onValueChange={(v) => setTier(v as any)}>
        <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
        <SelectContent>{TIERS.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All tiers" : t}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
        <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m === "all" ? "Any month" : m}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={district} onValueChange={setDistrict}>
        <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All districts</SelectItem>
          {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        type="number"
        inputMode="numeric"
        placeholder="Max price (UGX)"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
      />
      <Button
        variant={verifiedOnly ? "default" : "outline"}
        onClick={() => setVerifiedOnly((v) => !v)}
        className="gap-2"
      >
        <BadgeCheck className="h-4 w-4" />
        {verifiedOnly ? "Verified only" : "All operators"}
      </Button>
    </div>
  );

  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground shadow-lg md:p-7">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
          <Compass className="h-3.5 w-3.5" /> Spiritual journeys
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">Hajj & Umrah</h1>
        <p className="mt-1 max-w-md text-sm opacity-90">
          Browse trusted Uganda-based tour operators, compare packages, and inquire instantly.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-white/15 px-2 py-1">{data?.length ?? 0} operators</span>
          <span className="rounded-full bg-white/15 px-2 py-1">
            {data?.filter((o: any) => o.verified).length ?? 0} verified
          </span>
          <Link to="/operator" className="rounded-full bg-soft-gold px-3 py-1 font-medium text-foreground">
            List your company →
          </Link>
        </div>
      </motion.div>

      {/* Search + filter trigger */}
      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search operator, city…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative md:hidden">
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <h3 className="mb-3 font-semibold">Filters</h3>
            {Filters}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop filters */}
      <Card className="mt-3 hidden md:block">
        <CardContent className="p-3">{Filters}</CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Building2 className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No operators match your filters.</p>
          <Button variant="link" onClick={() => { setSearch(""); setType("all"); setTier("all"); setMonth("all"); setDistrict("all"); setMaxPrice(""); setVerifiedOnly(false); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o: any, i: number) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/hajj-umrah/${o.slug}`}>
                <Card className="group h-full overflow-hidden transition hover:shadow-lg">
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    {o.hero_url
                      ? <img src={o.hero_url} alt={o.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                      : <div className="flex h-full items-center justify-center"><Plane className="h-10 w-10 text-primary/40" /></div>}
                    {o.verified && (
                      <Badge className="absolute right-2 top-2 gap-1 bg-primary text-primary-foreground">
                        <BadgeCheck className="h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start gap-3">
                      {o.logo_url ? (
                        <img src={o.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-lg border bg-card object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{o.name}</p>
                        {(o.city || o.district) && (
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />{[o.city, o.district].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    {o.rating.count > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-soft-gold text-soft-gold" />
                        <span className="font-medium">{o.rating.avg.toFixed(1)}</span>
                        <span className="text-muted-foreground">({o.rating.count})</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {(o._matchedPackages.length > 0 ? o._matchedPackages : o.packages).slice(0, 3).map((p: any) => (
                        <Badge key={p.id} variant="outline" className="text-[10px]">
                          {p.type.toUpperCase()} · {fmtUgx(Number(p.price_ugx))}
                        </Badge>
                      ))}
                      {o.packages.length === 0 && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">No packages yet</Badge>
                      )}
                    </div>
                    {o.license_no && (
                      <p className="truncate text-[10px] text-muted-foreground">
                        License: {o.license_no}{o.license_authority ? ` · ${o.license_authority}` : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HajjUmrahPage;
