export default function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
    indigo: "from-blue-600 to-blue-700",
    cyan: "from-cyan-500 to-cyan-600",
  };

  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900">{value ?? "—"}</p>
          {sub != null && <p className="text-xs text-gray-500">{sub}</p>}
        </div>
        <div
          className={`w-11 h-11 bg-gradient-to-br ${colorMap[color] || colorMap.blue} flex items-center justify-center text-white shrink-0 rounded-lg`}>
          {Icon ? <Icon className="w-5 h-5" /> : null}
        </div>
      </div>
    </div>
  );
}
