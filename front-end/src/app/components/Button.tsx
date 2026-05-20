import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "disabled";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "px-6 py-3 rounded-lg font-medium transition-all duration-200";

  const variantStyles = {
    primary:
      "bg-bs-gold text-bs-neutral-900 hover:bg-[#FFE44D] active:bg-[#E6C200] shadow-md hover:shadow-lg",
    secondary:
      "bg-transparent border-2 border-bs-red text-bs-red hover:bg-bs-red/10 active:bg-bs-red/20",
    disabled: "bg-bs-neutral-300 text-bs-neutral-500 cursor-not-allowed",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={variant === "disabled"}
      {...props}
    >
      {children}
    </button>
  );
}
