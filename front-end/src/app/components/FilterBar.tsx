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
  RotateCcw,
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

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";

interface FilterBarProps {
  filters: SearchPreferences;
  onFilterChange: (filters: SearchPreferences) => void;
  defaultFilters?: SearchPreferences; // 1. Add optional defaultFilters prop
}

// Defining the initial/empty state of filters for clean resetting
const DEFAULT_FILTERS: SearchPreferences = {
  cuisine: [],
  priceRange: [],
  dietary: [],
  ambience: [],
  distance: "",
  time: "",
};

export default function FilterBar({
  filters,
  onFilterChange,
  defaultFilters = DEFAULT_FILTERS,
}: FilterBarProps) {
  const handleChange = (
    key: keyof SearchPreferences,
    value: string | string[],
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // Check if any filter has been changed from its default empty state
  const hasActiveFilters =
    (filters.cuisine?.length ?? 0) > 0 ||
    (filters.priceRange?.length ?? 0) > 0 ||
    (filters.dietary?.length ?? 0) > 0 ||
    (filters.ambience?.length ?? 0) > 0 ||
    !!filters.distance ||
    !!filters.time;

  const handleReset = () => {
    onFilterChange(defaultFilters);
  };
  return (
    <div className="w-full bg-white border-b border-bs-neutral-200 px-4 py-2 shadow-sm relative z-10">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-bs-neutral-700 font-medium shrink-0">
          <SlidersHorizontal size={16} className="text-bs-gold" />
          <span className="text-xs uppercase tracking-wider hidden sm:inline">
            Filters
          </span>
        </div>

        <div className=" flex-1 py-1">
          <Carousel className="mx-12 overflow-visible" opts={{ loop: true }}>
            <CarouselContent overwriteHidden={true}>
              <CarouselItem key={0} selfIndex={0}>
                <div className="grid grid-cols-3 gap-2">
                  {/* 1. Cuisine */}
                  <MultiSelectField
                    options={CUISINE_OPTIONS}
                    value={filters.cuisine || []}
                    onChange={(val) => handleChange("cuisine", val)}
                    icon={<Utensils size={14} />}
                    placeholder="Cuisine"
                    className="min-w-[100px] shrink-0"
                  />

                  {/* 2. Price */}
                  <MultiSelectField
                    options={PRICE_OPTIONS}
                    value={filters.priceRange || []}
                    onChange={(val) => handleChange("priceRange", val)}
                    icon={<DollarSign size={14} />}
                    placeholder="Price"
                    className="min-w-[100px] shrink-0"
                  />

                  {/* 3. Dietary */}
                  <MultiSelectField
                    options={DIETARY_OPTIONS}
                    value={filters.dietary || []}
                    onChange={(val) => handleChange("dietary", val)}
                    icon={<Leaf size={14} />}
                    placeholder="Dietary"
                    className="min-w-[100px] shrink-0"
                  />
                </div>
              </CarouselItem>
              <CarouselItem key={1} selfIndex={1}>
                <div className="grid grid-cols-3 gap-2">
                  {/* 4. Ambience */}
                  <MultiSelectField
                    options={AMBIENCE_OPTIONS}
                    value={filters.ambience || []}
                    onChange={(val) => handleChange("ambience", val)}
                    icon={<Coffee size={14} />}
                    placeholder="Ambience"
                    className="min-w-[100px] shrink-0"
                  />
                  {/* 5. Distance */}
                  <SelectField
                    options={getDropdownOptions("Distance", DISTANCE_OPTIONS)}
                    value={filters.distance || ""}
                    onChange={(e) => handleChange("distance", e.target.value)}
                    icon={<MapPin size={14} />}
                    className="min-w-[100px] shrink-0"
                  />

                  {/* 6. Time */}
                  <SelectField
                    options={getDropdownOptions("Time", TIME_OPTIONS)}
                    value={filters.time || ""}
                    onChange={(e) => handleChange("time", e.target.value)}
                    icon={<Clock size={14} />}
                    className="min-w-[100px] shrink-0"
                  />
                </div>
              </CarouselItem>
              {hasActiveFilters && (
                <CarouselItem key={2} selfIndex={2}>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!hasActiveFilters}
                    className={`flex items-center gap-1.5 text-xs font-medium text-white active:scale-95 px-3 py-1.5 rounded-md shadow-sm transition-all shrink-0 ml-auto ${hasActiveFilters ? "bg-rose-600 hover:bg-rose-700" : "bg-rose-400"}`}
                  >
                    <RotateCcw size={13} />
                    <span>Clear Filters</span>
                  </button>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselNext />
            <CarouselPrevious />
          </Carousel>
        </div>
      </div>
    </div>
  );
}
