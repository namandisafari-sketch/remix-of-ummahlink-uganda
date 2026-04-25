import districtsRaw from "./districts.json";
import constituenciesRaw from "./constituencies.json";

export type District = {
  district_code: number;
  district_name: string;
  region_code: number;
  region_name: string;
};

export type Constituency = {
  constituency_code: number;
  constituency_name: string;
  district_code: number;
  district_name: string;
};

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

export const DISTRICTS: District[] = (districtsRaw as District[])
  .map((d) => ({ ...d, district_name: titleCase(d.district_name), region_name: titleCase(d.region_name) }))
  .sort((a, b) => a.district_name.localeCompare(b.district_name));

export const CONSTITUENCIES: Constituency[] = (constituenciesRaw as Constituency[])
  .map((c) => ({
    ...c,
    constituency_name: titleCase(c.constituency_name),
    district_name: titleCase(c.district_name),
  }))
  .sort((a, b) => a.constituency_name.localeCompare(b.constituency_name));

export const REGIONS: string[] = Array.from(new Set(DISTRICTS.map((d) => d.region_name))).sort();

export const districtsByRegion = (region: string) =>
  DISTRICTS.filter((d) => d.region_name === region);

export const constituenciesByDistrict = (districtName: string) =>
  CONSTITUENCIES.filter((c) => c.district_name === districtName);
