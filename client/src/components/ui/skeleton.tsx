import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

// Basic Skeleton Block
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  );
}

// Shimmer Skeleton (Premium effect)
export function ShimmerSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]",
        className
      )}
    />
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 p-6 space-y-4">
      <ShimmerSkeleton className="h-40 w-full rounded-xl" />
      <ShimmerSkeleton className="h-6 w-3/4" />
      <ShimmerSkeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <ShimmerSkeleton className="h-8 w-20 rounded-full" />
        <ShimmerSkeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

// Profile Sidebar Skeleton
export function ProfileSkeleton() {
  return (
    <div className="rounded-[2rem] border-0 shadow-lg p-6 space-y-4">
      <div className="flex flex-col items-center">
        <ShimmerSkeleton className="w-24 h-24 rounded-full" />
        <ShimmerSkeleton className="h-6 w-32 mt-4" />
        <ShimmerSkeleton className="h-4 w-20 mt-2" />
      </div>
      <ShimmerSkeleton className="h-20 w-full rounded-xl" />
      <ShimmerSkeleton className="h-12 w-full rounded-xl" />
      <ShimmerSkeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

// Video Player Skeleton
export function VideoSkeleton() {
  return (
    <div className="aspect-video rounded-xl overflow-hidden relative">
      <ShimmerSkeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[20px] border-l-white/50 border-y-[12px] border-y-transparent ml-1" />
        </div>
      </div>
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50">
      <ShimmerSkeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <ShimmerSkeleton className="h-5 w-3/4" />
        <ShimmerSkeleton className="h-4 w-1/2" />
      </div>
      <ShimmerSkeleton className="h-8 w-20 rounded-full" />
    </div>
  );
}

// Stats Card Skeleton
export function StatsSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 p-6 flex items-center gap-4">
      <ShimmerSkeleton className="w-12 h-12 rounded-xl" />
      <div className="space-y-2">
        <ShimmerSkeleton className="h-4 w-20" />
        <ShimmerSkeleton className="h-8 w-12" />
      </div>
    </div>
  );
}
