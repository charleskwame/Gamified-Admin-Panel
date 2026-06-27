export default function StatCard({ icon: Icon, label, value, sub, color = "indigo" }) {
  const colorMap = {
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
    violet: "from-violet-500 to-violet-600",
    cyan: "from-cyan-500 to-cyan-600",
  };

  return (
    <div className="bg-white border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900">{value ?? "—"}</p>
          {sub != null && <p className="text-xs text-gray-500">{sub}</p>}
        </div>
        <div
          className={`w-11 h-11 bg-gradient-to-br ${colorMap[color] || colorMap.indigo} flex items-center justify-center text-white shrink-0`}
        >
          {Icon ? <Icon className="w-5 h-5" /> : null}
        </div>
      </div>
    </div>
  );
}
