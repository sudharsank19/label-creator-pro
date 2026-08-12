import { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { label, error, className = "", ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={`input ${error ? "border-danger focus:ring-danger/30" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, className = "", ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className={`input resize-none ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, className = "", children, ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={`input appearance-none ${error ? "border-danger" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

export const Toggle = forwardRef(function Toggle(
  { label, checked, onChange, disabled },
  ref,
) {
  return (
    <label
      ref={ref}
      className={`flex items-center justify-between gap-3 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-accent-500" : "bg-gray-300 dark:bg-[#48484a]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </label>
  );
});

export const ColorInput = forwardRef(function ColorInput(
  { label, value, onChange, className = "" },
  ref,
) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent cursor-pointer p-1"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="input font-mono"
        />
      </div>
    </div>
  );
});
