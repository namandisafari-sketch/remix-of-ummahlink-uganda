import adminIndex from "./admin-index.json";

export type AdminIndex = Record<
  string,
  {
    region: string;
    constituencies: Record<string, Record<string, string[]>>;
    // district -> constituency -> subcounty -> parish[]
  }
>;

export const ADMIN: AdminIndex = adminIndex as AdminIndex;

export const REGIONS: string[] = Array.from(
  new Set(Object.values(ADMIN).map((d) => d.region))
).sort();

export const districtsByRegion = (region: string): string[] =>
  Object.entries(ADMIN)
    .filter(([, v]) => v.region === region)
    .map(([k]) => k)
    .sort();

export const constituenciesByDistrict = (district: string): string[] =>
  district && ADMIN[district] ? Object.keys(ADMIN[district].constituencies).sort() : [];

export const subcountiesByConstituency = (
  district: string,
  constituency: string
): string[] => {
  const c = ADMIN[district]?.constituencies[constituency];
  return c ? Object.keys(c).sort() : [];
};

export const parishesBySubcounty = (
  district: string,
  constituency: string,
  subcounty: string
): string[] => {
  const list = ADMIN[district]?.constituencies[constituency]?.[subcounty];
  return list ? [...list].sort() : [];
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Lazy-load villages for a district (cached)
const villageCache = new Map<string, Record<string, string[]>>();
export const loadDistrictVillages = async (
  district: string
): Promise<Record<string, string[]>> => {
  const key = slug(district);
  if (villageCache.has(key)) return villageCache.get(key)!;
  const mod = await import(`./parishes/${key}.json`);
  const data = (mod.default || mod) as Record<string, string[]>;
  villageCache.set(key, data);
  return data;
};
