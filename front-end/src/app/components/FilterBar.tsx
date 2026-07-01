import { SelectField } from "../components/FormField";
import { MultiSelectField } from "../components/MultiSelectField";
import {
  Utensils,
  DollarSign,
  Leaf,
  MapPin,
  Coffee,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import type { SearchPreferences } from "../types/restaurant";
import {
  CUISINE_OPTIONS,
  PRICE_OPTIONS,
  DIETARY_OPTIONS,
  DISTANCE_OPTIONS,
  AMBIENCE_OPTIONS,
  TIME_OPTIONS,
  getDropdownOptions,
} from "./config/FilterOption";

interface FilterBarProps {
  filters: SearchPreferences;
  onFilterChange: (filters: SearchPreferences) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const handleChange = (
    key: keyof SearchPreferences,
    value: string | string[],
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="w-full bg-white border-b border-bs-neutral-200 px-4 py-2 shadow-sm relative z-30">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-bs-neutral-700 font-medium shrink-0">
          <SlidersHorizontal size={16} className="text-bs-gold" />
          <span className="text-xs uppercase tracking-wider hidden sm:inline">
            Filters
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 overflow-x-auto md:overflow-visible scrollbar-none py-1">
          {/* 1. Cuisine */}
          <MultiSelectField
            options={CUISINE_OPTIONS}
            value={filters.cuisine || []}
            onChange={(val) => handleChange("cuisine", val)}
            icon={<Utensils size={14} />}
            placeholder="Cuisine"
            className="w-[125px] shrink-0"
          />

          {/* 2. Price */}
          <MultiSelectField
            options={PRICE_OPTIONS}
            value={filters.priceRange || []}
            onChange={(val) => handleChange("priceRange", val)}
            icon={<DollarSign size={14} />}
            placeholder="Price"
            className="w-[125px] shrink-0"
          />

          {/* 3. Dietary */}
          <MultiSelectField
            options={DIETARY_OPTIONS}
            value={filters.dietary || []}
            onChange={(val) => handleChange("dietary", val)}
            icon={<Leaf size={14} />}
            placeholder="Dietary"
            className="w-[125px] shrink-0"
          />

          {/* 4. Ambience */}
          <MultiSelectField
            options={AMBIENCE_OPTIONS}
            value={filters.ambience || []}
            onChange={(val) => handleChange("ambience", val)}
            icon={<Coffee size={14} />}
            placeholder="Ambience"
            className="w-[125px] shrink-0"
          />

          {/* 5. Distance */}
          <SelectField
            options={getDropdownOptions("Distance", DISTANCE_OPTIONS)}
            value={filters.distance || ""}
            onChange={(e) => handleChange("distance", e.target.value)}
            icon={<MapPin size={14} />}
            className="w-[125px] shrink-0"
          />

          {/* 6. Time */}
          <SelectField
            options={getDropdownOptions("Time", TIME_OPTIONS)}
            value={filters.time || ""}
            onChange={(e) => handleChange("time", e.target.value)}
            icon={<Clock size={14} />}
            className="w-[125px] shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
