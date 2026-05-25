import { Skeleton } from "./ui/skeleton";

export function MapLoadingSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] gap-4 p-4 bg-bs-neutral-100">
      <div className="flex-1 rounded-xl overflow-hidden border border-bs-neutral-200 shadow-md">
        <Skeleton className="w-full h-full min-h-[300px] rounded-none" />
      </div>
      <div className="w-full lg:w-80 xl:w-96 space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
