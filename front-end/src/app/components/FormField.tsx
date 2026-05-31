import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
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
  ...props
}: FormFieldProps) {
  const baseStyles =
    "w-full px-4 py-3 rounded-lg border-2 transition-all duration-200";
  const stateStyles = error
    ? "border-bs-red focus:border-bs-red focus:ring-2 focus:ring-bs-red/20"
    : "border-bs-neutral-300 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20";

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-bs-neutral-700">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bs-neutral-500">
            {icon}
          </div>
        )}
        <input
          className={`${baseStyles} ${stateStyles} ${icon ? "pl-10" : ""} ${className} disabled:bg-bs-neutral-200 disabled:cursor-not-allowed`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-bs-red">{error}</p>}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: ReactNode;
  options: { value: string; label: string }[];
  error?: string;
}

export function SelectField({
  label,
  icon,
  options,
  error,
  className = "",
  ...props
}: SelectFieldProps) {
  const baseStyles =
    "w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 appearance-none bg-white";
  const stateStyles = error
    ? "border-bs-red focus:border-bs-red focus:ring-2 focus:ring-bs-red/20"
    : "border-bs-neutral-300 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20";

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-bs-neutral-700">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bs-neutral-500 pointer-events-none z-10">
            {icon}
          </div>
        )}
        <select
          className={`${baseStyles} ${stateStyles} ${icon ? "pl-10" : ""} ${className} disabled:bg-bs-neutral-200 disabled:cursor-not-allowed`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-[calc(50%_-_8px)]  text-bs-neutral-500 pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-bs-red">{error}</p>}
    </div>
  );
}
