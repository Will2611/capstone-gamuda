import {
  useState,
  useRef,
  useEffect,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export function FormField({
  label,
  icon,
  error,
  className = "",
  disabled,
  ...props
}: FormFieldProps) {
  // Matches the exact borders, heights, and padding formats used in SelectField
  const borderStyles = error
    ? "border-bs-red"
    : "border-bs-neutral-300 focus:border-bs-neutral-400";

  return (
    <div className={`w-full ${label ? "space-y-1.5" : ""}`}>
      {label && (
        <label className="block text-sm font-medium text-bs-neutral-700">
          {label}
        </label>
      )}
      <div className="relative w-full flex items-center">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bs-neutral-500 pointer-events-none z-10 flex items-center">
            {icon}
          </div>
        )}
        <input
          disabled={disabled}
          className={`w-full bg-white border rounded-md px-3 py-2 text-sm text-bs-neutral-800 placeholder:text-bs-neutral-400 min-h-[38px] transition-colors duration-200 focus:outline-none ${borderStyles} ${
            icon ? "pl-9" : ""
          } ${disabled ? "bg-bs-neutral-200 cursor-not-allowed opacity-60" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-bs-red">{error}</p>}
    </div>
  );
}

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value"
> {
  label?: string;
  icon?: ReactNode;
  options: Option[];
  error?: string;
  placeholder?: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
}

export function SelectField({
  label,
  icon,
  options,
  error,
  placeholder = "Please select...",
  value,
  onChange,
  className = "",
  disabled,
}: SelectFieldProps) {
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

  const handleSelectOption = (optionValue: string) => {
    if (disabled) return;
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const getDisplayLabel = () => {
    if (!value) return placeholder;
    return options.find((o) => o.value === value)?.label || placeholder;
  };

  const borderStyles = error
    ? "border-bs-red"
    : "border-bs-neutral-300 hover:border-bs-neutral-400";

  return (
    <div
      className={`relative ${label ? "space-y-1.5" : ""} ${className}`}
      ref={containerRef}
    >
      {label && (
        <label className="block text-sm font-medium text-bs-neutral-700">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-white border rounded-md px-3 py-2 text-sm select-none min-h-[38px] ${borderStyles} ${
          disabled
            ? "bg-bs-neutral-200 cursor-not-allowed opacity-60"
            : "cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-2 truncate text-bs-neutral-800">
          {icon && <span className="text-bs-neutral-500 shrink-0">{icon}</span>}
          <span className="truncate">{getDisplayLabel()}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-bs-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-bs-neutral-200 rounded-md shadow-lg py-1">
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelectOption(option.value)}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-bs-neutral-100 cursor-pointer"
              >
                <span
                  className={
                    isSelected
                      ? "font-medium text-bs-gold"
                      : "text-bs-neutral-700"
                  }
                >
                  {option.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-bs-red">{error}</p>}
    </div>
  );
}
