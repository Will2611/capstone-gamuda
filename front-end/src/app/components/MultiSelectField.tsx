import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFieldProps {
  label?: string;
  icon?: React.ReactNode;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelectField({
  label,
  icon,
  options,
  value = [],
  onChange,
  className = "",
  placeholder = "Please select...",
}: MultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const getDisplayLabel = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      return options.find((o) => o.value === value[0])?.label || placeholder;
    }
    return `Selected (${value.length})`;
  };

  return (
    <div
      className={`relative ${label ? "space-y-1.5" : ""}`}
      ref={containerRef}
    >
      {label && (
        <label className="block text-sm font-medium text-bs-neutral-700">
          {label}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-white border border-bs-neutral-300 rounded-md px-3 py-2 text-sm cursor-pointer select-none hover:border-bs-neutral-400 min-h-[38px] ${className}`}
      >
        <div className="flex items-center gap-2 truncate text-bs-neutral-800">
          {icon && <span className="text-bs-neutral-500 shrink-0">{icon}</span>}
          <span className="truncate">{getDisplayLabel()}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-bs-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-bs-neutral-200 rounded-md shadow-lg py-1">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="flex items-center justify-between px-3 py-2 text-sm text-bs-neutral-700 hover:bg-bs-neutral-100 cursor-pointer"
              >
                <span className={isSelected ? "font-medium text-bs-gold" : ""}>
                  {option.label}
                </span>
                {isSelected && (
                  <Check size={14} className="text-bs-gold shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
