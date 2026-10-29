export function LoadingSpinner({
  label,
  size = "md",
  className = "",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimensions = {
    sm: "size-4 border-2",
    md: "size-6 border-[3px]",
    lg: "size-10 border-[3px]",
  }[size];

  return (
    <span
      aria-label={label ?? "Loading"}
      className={`inline-flex shrink-0 animate-spin rounded-full border-current border-r-transparent ${dimensions} ${className}`}
      role="status"
    >
      <span className="sr-only">{label ?? "Loading"}</span>
    </span>
  );
}
