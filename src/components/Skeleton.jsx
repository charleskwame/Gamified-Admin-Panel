export default function Skeleton({ className = "", rounded = false }) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse ${rounded ? "rounded-full" : "rounded-md"} ${className}`}
    />
  );
}

// Named export for convenience (used in page imports)
export { Skeleton };

// Skeleton for StatCard
export function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border p-5 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-8 h-8" rounded={true} />
        <Skeleton className="w-10 h-4" />
      </div>
      <Skeleton className="w-16 h-7 mb-1" />
      <Skeleton className="w-24 h-3" />
    </div>
  );
}

// Skeleton for student table row
export function StudentRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8" rounded={true} />
          <div>
            <Skeleton className="w-32 h-4 mb-1" />
            <Skeleton className="w-40 h-3" />
          </div>
        </div>
      </td>
      <td className="px-6 py-3.5">
        <Skeleton className="w-12 h-5" />
      </td>
      <td className="px-6 py-3.5">
        <Skeleton className="w-10 h-5" />
      </td>
      <td className="px-6 py-3.5">
        <Skeleton className="w-10 h-5" />
      </td>
      <td className="px-6 py-3.5">
        <Skeleton className="w-12 h-5" />
      </td>
      <td className="px-6 py-3.5">
        <Skeleton className="w-12 h-5" />
      </td>
      <td className="px-6 py-3.5">
        <Skeleton className="w-12 h-5" />
      </td>
      <td className="px-6 py-3.5">
        <Skeleton className="w-20 h-4" />
      </td>
    </tr>
  );
}

// Skeleton for question card
export function QuestionSkeleton() {
  return (
    <div className="px-6 py-5 border-b border-border-light">
      <Skeleton className="w-full h-5 mb-3" />
      <div className="flex flex-wrap gap-2 mb-2">
        <Skeleton className="w-24 h-7" />
        <Skeleton className="w-24 h-7" />
        <Skeleton className="w-24 h-7" />
        <Skeleton className="w-24 h-7" />
      </div>
      <Skeleton className="w-40 h-3 mb-2" />
    </div>
  );
}

// Skeleton for chart container
export function ChartSkeleton({ height = 260 }) {
  return (
    <div className="bg-surface border border-border p-6 rounded-xl">
      <Skeleton className="w-48 h-5 mb-4" />
      <Skeleton className="w-full h-64" />
    </div>
  );
}

// Skeleton for leaderboard/student table
export function LeaderboardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border-light">
            {Array.from({ length: 5 }).map((_, i) => (
              <StudentRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
