import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REGIONS,
  districtsByRegion,
  constituenciesByDistrict,
  subcountiesByConstituency,
  parishesBySubcounty,
  loadDistrictVillages,
} from "@/data/uganda";

export type AddressValue = {
  region: string;
  district: string;
  constituency: string;
  subcounty: string;
  parish: string;
  village: string;
};

export const emptyAddress: AddressValue = {
  region: "",
  district: "",
  constituency: "",
  subcounty: "",
  parish: "",
  village: "",
};

interface AddressPickerProps {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
}

export const AddressPicker = ({ value, onChange }: AddressPickerProps) => {
  const districts = value.region ? districtsByRegion(value.region) : [];
  const constituencies = value.district ? constituenciesByDistrict(value.district) : [];
  const subcounties =
    value.district && value.constituency
      ? subcountiesByConstituency(value.district, value.constituency)
      : [];
  const parishes =
    value.district && value.constituency && value.subcounty
      ? parishesBySubcounty(value.district, value.constituency, value.subcounty)
      : [];

  const [villages, setVillages] = useState<string[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!value.district || !value.parish) {
      setVillages([]);
      return;
    }
    setLoadingVillages(true);
    loadDistrictVillages(value.district)
      .then((data) => {
        if (cancelled) return;
        setVillages(data[value.parish] ?? []);
      })
      .finally(() => !cancelled && setLoadingVillages(false));
    return () => {
      cancelled = true;
    };
  }, [value.district, value.parish]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Region</Label>
          <Select
            value={value.region}
            onValueChange={(region) =>
              onChange({ ...emptyAddress, region })
            }
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>District</Label>
          <Select
            value={value.district}
            onValueChange={(district) =>
              onChange({ ...emptyAddress, region: value.region, district })
            }
            disabled={!value.region}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder={value.region ? "Select" : "Region first"} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Constituency / County</Label>
          <Select
            value={value.constituency}
            onValueChange={(constituency) =>
              onChange({
                ...emptyAddress,
                region: value.region,
                district: value.district,
                constituency,
              })
            }
            disabled={!value.district}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder={value.district ? "Select" : "District first"} />
            </SelectTrigger>
            <SelectContent>
              {constituencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Subcounty</Label>
          <Select
            value={value.subcounty}
            onValueChange={(subcounty) =>
              onChange({
                ...emptyAddress,
                region: value.region,
                district: value.district,
                constituency: value.constituency,
                subcounty,
              })
            }
            disabled={!value.constituency}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder={value.constituency ? "Select" : "Constituency first"} />
            </SelectTrigger>
            <SelectContent>
              {subcounties.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Parish</Label>
          <Select
            value={value.parish}
            onValueChange={(parish) =>
              onChange({ ...value, parish, village: "" })
            }
            disabled={!value.subcounty}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder={value.subcounty ? "Select" : "Subcounty first"} />
            </SelectTrigger>
            <SelectContent>
              {parishes.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Village</Label>
          <Select
            value={value.village}
            onValueChange={(village) => onChange({ ...value, village })}
            disabled={!value.parish || loadingVillages}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue
                placeholder={
                  !value.parish
                    ? "Parish first"
                    : loadingVillages
                    ? "Loading..."
                    : villages.length
                    ? "Select village"
                    : "No villages"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {villages.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
