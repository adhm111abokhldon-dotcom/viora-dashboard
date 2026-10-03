import type { ReactNode } from "react";

type IconComponent = React.ComponentType<{ className?: string }>;

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: IconComponent;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full border bg-muted/50">
        <Icon className="size-5 text-muted-foreground" />
      </div>

      <div className="space-y-1">
        <p className="font-medium">{title}</p>

        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
