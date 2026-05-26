import type { ReactNode } from "react";

interface ProfileCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function ProfileCard({
  title,
  children,
  className = "",
  action,
}: ProfileCardProps) {
  return (
    <section
      className={`bg-white rounded-xl border border-bs-neutral-200 shadow-md p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-bs-neutral-900">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
