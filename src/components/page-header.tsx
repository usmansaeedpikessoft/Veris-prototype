export function PageHeader({
  title,
  description,
  module,
  children,
}: {
  title: string;
  description?: string;
  module?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {module && (
            <span className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {module}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
