import type { SelectHTMLAttributes, ReactNode } from "react";

type SelectFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({
  label,
  error,
  children,
  className = "",
  ...props
}: SelectFieldProps) {
  const selectClass = `
    w-full rounded-xl border px-4 py-3 bg-white text-bs-neutral-900
    outline-none transition
    ${
      error
        ? "border-bs-red focus:ring-2 focus:ring-bs-red/20"
        : "border-bs-neutral-300 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20"
    }
  `;

  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-bs-neutral-700">
        {label}
      </label>

      <select {...props} className={`${selectClass} ${className}`}>
        {children}
      </select>

      {error && <p className="mt-1 text-sm text-bs-red">{error}</p>}
    </div>
  );
}
