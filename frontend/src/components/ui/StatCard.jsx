export function StatCard({ icon: Icon, label, value, sub, color = "accent" }) {
  const colors = {
    accent: "bg-accent-500/10 text-accent-500",
    green: "bg-success/10 text-success",
    orange: "bg-warning/10 text-warning",
    red: "bg-danger/10 text-danger",
    purple: "bg-purple-500/10 text-purple-500",
    blue: "bg-sky-500/10 text-sky-500",
  };
  return (
    <div className="card p-5 flex items-start gap-4 animate-fade-in hover:shadow-card-hover transition-shadow">
      <div
        className={`w-11 h-11 rounded-xl ${colors[color]} flex items-center justify-center shrink-0`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
