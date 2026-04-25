import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGIONS, districtsByRegion, constituenciesByDistrict } from "@/data/uganda";

export type AddressValue = {
  region: string;
  district: string;
  constituency: string;
  street: string;
};

interface AddressPickerProps {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
}

export const AddressPicker = ({ value, onChange }: AddressPickerProps) => {
  const districts = value.region ? districtsByRegion(value.region) : [];
  const constituencies = value.district ? constituenciesByDistrict(value.district) : [];

  return (
    <div className="space-y-3">
      <div>
        <Label>Region</Label>
        <Select
          value={value.region}
          onValueChange={(region) =>
            onChange({ region, district: "", constituency: "", street: value.street })
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
            onChange({ ...value, district, constituency: "" })
          }
          disabled={!value.region}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder={value.region ? "Select district" : "Select region first"} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.district_code} value={d.district_name}>
                {d.district_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Constituency / County</Label>
        <Select
          value={value.constituency}
          onValueChange={(constituency) => onChange({ ...value, constituency })}
          disabled={!value.district}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue
              placeholder={value.district ? "Select constituency" : "Select district first"}
            />
          </SelectTrigger>
          <SelectContent>
            {constituencies.map((c) => (
              <SelectItem key={c.constituency_code} value={c.constituency_name}>
                {c.constituency_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="street">Street / Village (optional)</Label>
        <Input
          id="street"
          value={value.street}
          onChange={(e) => onChange({ ...value, street: e.target.value })}
          placeholder="e.g. Plot 14, Kibuli Road"
          className="placeholder-elegant"
          maxLength={120}
        />
      </div>
    </div>
  );
};
