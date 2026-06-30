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
  className = "", // 外部传入的 w-[125px] shrink-0 就在这里
  ...props
}: SelectFieldProps) {
  // 🟢 1. 像素级对齐：修改高度为 h-9 (36px)，边框改为 border (1px)，圆角改为 rounded-md，字号 text-xs
  const baseStyles =
    "w-full px-3 rounded-md border transition-all duration-200 appearance-none bg-white h-9 text-xs text-bs-neutral-800 focus:outline-none";

  // 🟢 2. 状态边框同步改为单倍边框
  const stateStyles = error
    ? "border-bs-red focus:border-bs-red focus:ring-2 focus:ring-bs-red/20"
    : "border-bs-neutral-300 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20";

  return (
    // 🚨 3. 核心修正：把外部的 className 挂到最外层 Div 上，去掉硬编码的 w-full！
    // 这样外部的 w-[125px] 就能直接锁死整个组件的宽度
    <div className={`relative ${className}`}>
      {label && (
        <label className="block mb-2 text-bs-neutral-700 text-xs font-medium">
          {label}
        </label>
      )}
      <div className="relative w-full flex items-center">
        {icon && (
          // 🟢 4. 纠正图标在 36px 高度下的居中位置
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bs-neutral-500 pointer-events-none z-10 flex items-center">
            {icon}
          </div>
        )}
        <select
          className={`${baseStyles} ${stateStyles} ${icon ? "pl-8" : "pl-3"} pr-8 disabled:bg-bs-neutral-200 disabled:cursor-not-allowed`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* 🟢 5. 纠正右侧小箭头的尺寸和垂直居中 */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-bs-neutral-400 pointer-events-none flex items-center">
          <ChevronDown size={14} />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-bs-red">{error}</p>}
    </div>
  );
}
