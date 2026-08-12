export function Loader({ text = "Loading...", full = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${full ? "min-h-[50vh]" : "py-10"}`}
    >
      <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white/60 dark:bg-[#1c1c1e]/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Loading…
        </p>
      </div>
    </div>
  );
}
