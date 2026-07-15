import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return <div aria-label="กำลังโหลด Dashboard" aria-busy="true"><div className="mb-6 space-y-2"><Skeleton className="h-9 w-56"/><Skeleton className="h-4 w-full max-w-lg"/></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4},(_,index)=><Skeleton key={index} className="h-36 rounded-xl"/>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]"><Skeleton className="h-96 rounded-xl"/><Skeleton className="h-96 rounded-xl"/></div></div>;
}
